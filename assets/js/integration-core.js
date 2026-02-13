(function () {
    'use strict';

    var ENCOUNTERS_KEY = 'pc_phase4_encounters_v1';
    var ACTIVE_CASE_MAP_KEY = 'pc_phase4_active_case_map_v1';
    var OFFLINE_QUEUE_KEY = 'pc_phase4_offline_queue_v1';
    var BACKGROUND_SYNC_TAG = 'pc-phase4-sync';
    var MAX_CALCULATIONS_PER_ENCOUNTER = 250;
    var MAX_EVENTS_PER_ENCOUNTER = 500;
    var MAX_OFFLINE_QUEUE = 100;
    var listenersBound = false;
    var RESOLUTION_ALLOWED = {
        improved: true,
        static: true,
        deteriorated: true,
        euthanized: true
    };

    function safeParse(value, fallback) {
        if (!value) {
            return fallback;
        }

        try {
            var parsed = JSON.parse(value);
            return parsed !== undefined ? parsed : fallback;
        } catch (error) {
            return fallback;
        }
    }

    function safeClone(value, fallback) {
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (error) {
            return fallback;
        }
    }

    function safeGet(key, fallback) {
        try {
            return safeParse(localStorage.getItem(key), fallback);
        } catch (error) {
            return fallback;
        }
    }

    function safeSet(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            return false;
        }
    }

    function nowIso() {
        return new Date().toISOString();
    }

    function sanitizeId(value) {
        return String(value || '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, '');
    }

    function randomId(prefix) {
        var base = String(prefix || 'id');
        var random = Math.random().toString(36).slice(2, 10);
        return base + '_' + Date.now().toString(36) + '_' + random;
    }

    function getAllEncounters() {
        var encounters = safeGet(ENCOUNTERS_KEY, {});
        return encounters && typeof encounters === 'object' ? encounters : {};
    }

    function setAllEncounters(encounters) {
        return safeSet(ENCOUNTERS_KEY, encounters && typeof encounters === 'object' ? encounters : {});
    }

    function getActiveCaseMap() {
        var map = safeGet(ACTIVE_CASE_MAP_KEY, {});
        return map && typeof map === 'object' ? map : {};
    }

    function setActiveCaseMap(map) {
        return safeSet(ACTIVE_CASE_MAP_KEY, map && typeof map === 'object' ? map : {});
    }

    function getOfflineQueue() {
        var queue = safeGet(OFFLINE_QUEUE_KEY, []);
        return Array.isArray(queue) ? queue : [];
    }

    function setOfflineQueue(queue) {
        return safeSet(OFFLINE_QUEUE_KEY, Array.isArray(queue) ? queue : []);
    }

    function canUseBackgroundSync() {
        return typeof navigator !== 'undefined' &&
            'serviceWorker' in navigator &&
            typeof window !== 'undefined' &&
            window.isSecureContext === true;
    }

    function requestQueueSync() {
        if (!canUseBackgroundSync()) {
            return Promise.resolve({
                ok: false,
                reason: 'background_sync_unavailable'
            });
        }

        return navigator.serviceWorker.ready
            .then(function (registration) {
                if (!registration || !registration.sync || typeof registration.sync.register !== 'function') {
                    return {
                        ok: false,
                        reason: 'sync_manager_unavailable'
                    };
                }

                return registration.sync.register(BACKGROUND_SYNC_TAG)
                    .then(function () {
                        return {
                            ok: true
                        };
                    });
            })
            .catch(function () {
                return {
                    ok: false,
                    reason: 'sync_register_failed'
                };
            });
    }

    function parseQuery() {
        try {
            return new URLSearchParams(window.location.search || '');
        } catch (error) {
            return new URLSearchParams('');
        }
    }

    function getContextFromUrl() {
        var params = parseQuery();
        var caseId = sanitizeId(params.get('case') || params.get('caseId') || '');
        var encounterId = sanitizeId(params.get('encounter') || '');
        return {
            caseId: caseId,
            encounterId: encounterId
        };
    }

    function normalizeComplications(value) {
        if (Array.isArray(value)) {
            var cleaned = [];
            var i;

            for (i = 0; i < value.length; i += 1) {
                var item = String(value[i] || '').trim();
                if (item) {
                    cleaned.push(item);
                }
            }
            return cleaned;
        }

        if (typeof value === 'string') {
            return value.split(',')
                .map(function (item) {
                    return String(item || '').trim();
                })
                .filter(function (item) {
                    return !!item;
                });
        }

        return [];
    }

    function sanitizeOutcomePayload(outcomes) {
        var source = outcomes && typeof outcomes === 'object' ? outcomes : {};
        var resolution = String(source.resolution || '').trim().toLowerCase();

        if (!RESOLUTION_ALLOWED[resolution]) {
            resolution = '';
        }

        return {
            actualTreatment: String(source.actualTreatment || '').trim(),
            complications: normalizeComplications(source.complications),
            resolution: resolution,
            followUpNeeded: !!source.followUpNeeded
        };
    }

    function findLatestEncounterIdForCase(caseId, encounters) {
        var keys = Object.keys(encounters || {});
        var latestId = '';
        var latestTimestamp = 0;
        var normalizedCaseId = sanitizeId(caseId);
        var i;

        for (i = 0; i < keys.length; i += 1) {
            var id = keys[i];
            var record = encounters[id];
            if (!record || sanitizeId(record.caseId) !== normalizedCaseId) {
                continue;
            }

            var stamp = Date.parse(record.updatedAt || record.createdAt || '');
            if (!Number.isFinite(stamp)) {
                continue;
            }

            if (stamp > latestTimestamp) {
                latestTimestamp = stamp;
                latestId = id;
            }
        }

        return latestId;
    }

    function queueAction(action, payload) {
        var queue = getOfflineQueue();
        queue.push({
            id: randomId('queued'),
            action: String(action || 'sync_pending'),
            payload: safeClone(payload || {}, {}),
            queuedAt: nowIso()
        });

        if (queue.length > MAX_OFFLINE_QUEUE) {
            queue = queue.slice(queue.length - MAX_OFFLINE_QUEUE);
        }

        setOfflineQueue(queue);
        requestQueueSync().catch(function () {
            // Best effort background sync registration.
        });
        return queue.length;
    }

    function triggerSync(trigger, payload) {
        if (!window.pcSync || typeof window.pcSync.syncToServer !== 'function') {
            return;
        }

        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            queueAction(trigger || 'offline_sync', payload || {});
            return;
        }

        window.pcSync.syncToServer({ trigger: trigger || 'phase4_update' })
            .then(function (result) {
                if (!result || result.ok) {
                    return;
                }
                if (result.reason === 'offline') {
                    queueAction(trigger || 'offline_sync', payload || {});
                }
            })
            .catch(function () {
                queueAction(trigger || 'sync_failed', payload || {});
            });
    }

    function ensureEncounter(options) {
        var opts = options && typeof options === 'object' ? options : {};
        var context = getContextFromUrl();
        var caseId = sanitizeId(opts.caseId || context.caseId || '');
        var title = String(opts.caseTitle || opts.title || document.title || 'Clinical Encounter');
        var encounterId = sanitizeId(opts.encounterId || context.encounterId || '');
        var encounters = getAllEncounters();
        var activeMap = getActiveCaseMap();

        if (encounterId && !encounters[encounterId]) {
            encounterId = '';
        }

        if (!encounterId && caseId && activeMap[caseId] && encounters[activeMap[caseId]]) {
            encounterId = activeMap[caseId];
        }

        if (!encounterId && caseId) {
            encounterId = findLatestEncounterIdForCase(caseId, encounters);
        }

        if (!encounterId) {
            encounterId = randomId('enc');
        }

        if (!encounters[encounterId]) {
            encounters[encounterId] = {
                id: encounterId,
                caseId: caseId || 'standalone',
                caseTitle: title,
                pagePath: window.location.pathname,
                status: 'open',
                patient: safeClone(opts.patient || {}, {}),
                tags: Array.isArray(opts.tags) ? safeClone(opts.tags, []) : [],
                outcomes: {
                    actualTreatment: '',
                    complications: [],
                    resolution: '',
                    followUpNeeded: false,
                    updatedAt: ''
                },
                createdAt: nowIso(),
                updatedAt: nowIso(),
                events: [],
                calculations: [],
                exports: []
            };
        } else {
            if (caseId) {
                encounters[encounterId].caseId = caseId;
            }
            if (title) {
                encounters[encounterId].caseTitle = title;
            }
            if (opts.patient && typeof opts.patient === 'object') {
                encounters[encounterId].patient = safeClone(opts.patient, {});
            }
            if (!encounters[encounterId].outcomes || typeof encounters[encounterId].outcomes !== 'object') {
                encounters[encounterId].outcomes = {
                    actualTreatment: '',
                    complications: [],
                    resolution: '',
                    followUpNeeded: false,
                    updatedAt: ''
                };
            }
            encounters[encounterId].updatedAt = nowIso();
        }

        if (caseId) {
            activeMap[caseId] = encounterId;
        }

        setAllEncounters(encounters);
        setActiveCaseMap(activeMap);
        return safeClone(encounters[encounterId], null);
    }

    function getEncounter(encounterId) {
        var id = sanitizeId(encounterId);
        if (!id) {
            return null;
        }

        var encounters = getAllEncounters();
        if (!encounters[id]) {
            return null;
        }

        return safeClone(encounters[id], null);
    }

    function listCaseEncounters(caseId) {
        var normalizedCaseId = sanitizeId(caseId);
        if (!normalizedCaseId) {
            return [];
        }

        var encounters = getAllEncounters();
        var keys = Object.keys(encounters);
        var items = [];
        var i;

        for (i = 0; i < keys.length; i += 1) {
            var record = encounters[keys[i]];
            if (record && sanitizeId(record.caseId) === normalizedCaseId) {
                items.push(safeClone(record, null));
            }
        }

        items.sort(function (a, b) {
            return Date.parse(b.updatedAt || b.createdAt || '') - Date.parse(a.updatedAt || a.createdAt || '');
        });

        return items;
    }

    function getLatestEncounterForCase(caseId) {
        var items = listCaseEncounters(caseId);
        return items.length ? items[0] : null;
    }

    function appendEvent(options) {
        var opts = options && typeof options === 'object' ? options : {};
        var encounter = ensureEncounter(opts);
        var encounters = getAllEncounters();
        var record = encounters[encounter.id];

        if (!record) {
            return null;
        }

        var item = {
            id: randomId('evt'),
            type: String(opts.type || 'event'),
            source: String(opts.source || window.location.pathname),
            details: safeClone(opts.details || {}, {}),
            createdAt: nowIso()
        };

        record.events = Array.isArray(record.events) ? record.events : [];
        record.events.push(item);

        if (record.events.length > MAX_EVENTS_PER_ENCOUNTER) {
            record.events = record.events.slice(record.events.length - MAX_EVENTS_PER_ENCOUNTER);
        }

        record.updatedAt = item.createdAt;
        encounters[encounter.id] = record;
        setAllEncounters(encounters);

        triggerSync('phase4_event', { eventType: item.type, encounterId: encounter.id });
        return safeClone(item, null);
    }

    function logCaseOpen(options) {
        var opts = options && typeof options === 'object' ? options : {};
        return appendEvent({
            caseId: opts.caseId,
            caseTitle: opts.caseTitle || opts.title,
            encounterId: opts.encounterId,
            patient: opts.patient,
            source: 'case_page',
            type: 'case_open',
            details: {
                pagePath: window.location.pathname
            }
        });
    }

    function logCaseAction(options) {
        var opts = options && typeof options === 'object' ? options : {};
        return appendEvent({
            caseId: opts.caseId,
            caseTitle: opts.caseTitle || opts.title,
            encounterId: opts.encounterId,
            patient: opts.patient,
            source: opts.source || 'case_action',
            type: opts.action || 'case_action',
            details: opts.details || {}
        });
    }

    function logCalculation(options) {
        var opts = options && typeof options === 'object' ? options : {};
        var encounter = ensureEncounter(opts);
        var encounters = getAllEncounters();
        var record = encounters[encounter.id];

        if (!record) {
            return null;
        }

        var calculation = {
            id: randomId('calc'),
            calculatorId: String(opts.calculatorId || 'calculator'),
            calculatorLabel: String(opts.calculatorLabel || opts.calculatorId || 'Calculator'),
            source: String(opts.source || window.location.pathname),
            inputs: safeClone(opts.inputs || {}, {}),
            outputs: safeClone(opts.outputs || {}, {}),
            warnings: Array.isArray(opts.warnings) ? safeClone(opts.warnings, []) : [],
            references: Array.isArray(opts.references) ? safeClone(opts.references, []) : [],
            userOverride: !!opts.userOverride,
            overrideReason: String(opts.overrideReason || '').trim(),
            createdAt: nowIso()
        };

        record.calculations = Array.isArray(record.calculations) ? record.calculations : [];
        record.calculations.push(calculation);

        if (record.calculations.length > MAX_CALCULATIONS_PER_ENCOUNTER) {
            record.calculations = record.calculations.slice(record.calculations.length - MAX_CALCULATIONS_PER_ENCOUNTER);
        }

        record.updatedAt = calculation.createdAt;
        encounters[encounter.id] = record;
        setAllEncounters(encounters);

        triggerSync('phase4_calculation', {
            encounterId: encounter.id,
            calculatorId: calculation.calculatorId
        });

        return {
            encounterId: encounter.id,
            calculationId: calculation.id
        };
    }

    function updateEncounterOutcome(options) {
        var opts = options && typeof options === 'object' ? options : {};
        var encounter = ensureEncounter(opts);
        var encounters = getAllEncounters();
        var record = encounters[encounter.id];

        if (!record) {
            return {
                ok: false,
                reason: 'encounter_not_found'
            };
        }

        var incoming = sanitizeOutcomePayload(opts.outcomes);
        var previous = record.outcomes && typeof record.outcomes === 'object' ? record.outcomes : {};
        var hasActualTreatment = opts.outcomes && Object.prototype.hasOwnProperty.call(opts.outcomes, 'actualTreatment');
        var hasComplications = opts.outcomes && Object.prototype.hasOwnProperty.call(opts.outcomes, 'complications');
        var hasResolution = opts.outcomes && Object.prototype.hasOwnProperty.call(opts.outcomes, 'resolution');
        var hasFollowUp = opts.outcomes && Object.prototype.hasOwnProperty.call(opts.outcomes, 'followUpNeeded');

        var merged = {
            actualTreatment: hasActualTreatment ? incoming.actualTreatment : String(previous.actualTreatment || '').trim(),
            complications: hasComplications ? incoming.complications : normalizeComplications(previous.complications),
            resolution: hasResolution ? incoming.resolution : String(previous.resolution || '').trim().toLowerCase(),
            followUpNeeded: hasFollowUp ? !!opts.outcomes.followUpNeeded : !!previous.followUpNeeded,
            updatedAt: nowIso()
        };

        record.outcomes = merged;
        record.updatedAt = merged.updatedAt;
        encounters[encounter.id] = record;
        setAllEncounters(encounters);

        appendEvent({
            encounterId: encounter.id,
            caseId: record.caseId,
            caseTitle: record.caseTitle,
            source: 'outcome_snapshot',
            type: 'outcome_update',
            details: {
                resolution: merged.resolution,
                followUpNeeded: merged.followUpNeeded,
                complicationCount: merged.complications.length
            }
        });

        triggerSync('phase4_outcome', {
            encounterId: encounter.id,
            resolution: merged.resolution
        });

        return {
            ok: true,
            encounterId: encounter.id,
            outcomes: safeClone(merged, {})
        };
    }

    function toCsvCell(value) {
        var text = value;

        if (text === null || text === undefined) {
            text = '';
        }

        if (typeof text === 'object') {
            text = JSON.stringify(text);
        }

        text = String(text).replace(/"/g, '""');
        return '"' + text + '"';
    }

    function escapeHtml(value) {
        return String(value === null || value === undefined ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function toFhirId(value, fallbackPrefix) {
        var base = sanitizeId(value || '');
        if (!base) {
            base = sanitizeId((fallbackPrefix || 'id') + '_' + randomId(''));
        }

        if (base.length > 60) {
            base = base.slice(0, 60);
        }

        return base;
    }

    function encounterToFhir(encounter) {
        var calculations = Array.isArray(encounter.calculations) ? encounter.calculations : [];
        var outcomes = encounter.outcomes && typeof encounter.outcomes === 'object' ? encounter.outcomes : {};
        var encounterStatus = outcomes.resolution ? 'finished' : 'in-progress';
        var entries = [];
        var i;

        entries.push({
            fullUrl: 'urn:uuid:' + toFhirId(encounter.id, 'encounter'),
            resource: {
                resourceType: 'Encounter',
                id: toFhirId(encounter.id, 'encounter'),
                status: encounterStatus,
                class: {
                    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
                    code: 'AMB',
                    display: 'ambulatory'
                },
                subject: {
                    display: encounter.caseTitle || encounter.caseId || 'Clinical Encounter'
                },
                period: {
                    start: encounter.createdAt || '',
                    end: encounter.updatedAt || ''
                },
                reasonCode: [
                    {
                        text: encounter.caseTitle || encounter.caseId || ''
                    }
                ],
                extension: [
                    {
                        url: 'https://parthchaudhari.com/fhir/StructureDefinition/case-id',
                        valueString: encounter.caseId || ''
                    }
                ]
            }
        });

        entries.push({
            fullUrl: 'urn:uuid:' + toFhirId((encounter.id || '') + '_outcome', 'outcome'),
            resource: {
                resourceType: 'Observation',
                id: toFhirId((encounter.id || '') + '_outcome', 'outcome'),
                status: 'final',
                code: {
                    text: 'Clinical outcome snapshot'
                },
                effectiveDateTime: outcomes.updatedAt || encounter.updatedAt || '',
                valueString: outcomes.resolution || 'not documented',
                component: [
                    {
                        code: { text: 'Actual treatment' },
                        valueString: outcomes.actualTreatment || ''
                    },
                    {
                        code: { text: 'Complications' },
                        valueString: Array.isArray(outcomes.complications) ? outcomes.complications.join('; ') : ''
                    },
                    {
                        code: { text: 'Follow-up needed' },
                        valueBoolean: !!outcomes.followUpNeeded
                    }
                ]
            }
        });

        for (i = 0; i < calculations.length; i += 1) {
            var calc = calculations[i] || {};
            var calcId = toFhirId(calc.id || ('calculation_' + (i + 1)), 'calc');
            var noteText = [];

            if (calc.warnings && calc.warnings.length) {
                noteText.push('Warnings: ' + calc.warnings.join('; '));
            }
            if (calc.userOverride) {
                noteText.push('User override: yes');
            }
            if (calc.overrideReason) {
                noteText.push('Override reason: ' + calc.overrideReason);
            }

            entries.push({
                fullUrl: 'urn:uuid:' + calcId,
                resource: {
                    resourceType: 'MedicationRequest',
                    id: calcId,
                    status: 'active',
                    intent: 'order',
                    authoredOn: calc.createdAt || encounter.updatedAt || '',
                    subject: {
                        display: encounter.caseTitle || encounter.caseId || 'Case context'
                    },
                    medicationCodeableConcept: {
                        text: calc.calculatorLabel || calc.calculatorId || 'Calculator result'
                    },
                    dosageInstruction: [
                        {
                            text: 'Calculator output generated by ' + (calc.calculatorId || 'tool')
                        }
                    ],
                    note: noteText.length ? [{ text: noteText.join(' | ') }] : [],
                    extension: [
                        {
                            url: 'https://parthchaudhari.com/fhir/StructureDefinition/calculator-context',
                            valueString: JSON.stringify({
                                calculatorId: calc.calculatorId || '',
                                source: calc.source || '',
                                inputs: calc.inputs || {},
                                outputs: calc.outputs || {},
                                references: calc.references || []
                            })
                        }
                    ]
                }
            });
        }

        return {
            resourceType: 'Bundle',
            id: toFhirId(encounter.id, 'bundle'),
            type: 'collection',
            timestamp: encounter.updatedAt || nowIso(),
            entry: entries
        };
    }

    function encounterToPrintableHtml(encounter) {
        var outcomes = encounter.outcomes && typeof encounter.outcomes === 'object' ? encounter.outcomes : {};
        var calculations = Array.isArray(encounter.calculations) ? encounter.calculations : [];
        var events = Array.isArray(encounter.events) ? encounter.events : [];
        var i;
        var rows = '';
        var timelineRows = '';

        for (i = 0; i < calculations.length; i += 1) {
            var calc = calculations[i] || {};
            rows +=
                '<tr>' +
                '<td>' + escapeHtml(calc.calculatorLabel || calc.calculatorId || 'Calculator') + '</td>' +
                '<td><code>' + escapeHtml(JSON.stringify(calc.inputs || {})) + '</code></td>' +
                '<td><code>' + escapeHtml(JSON.stringify(calc.outputs || {})) + '</code></td>' +
                '<td>' + escapeHtml(calc.createdAt || '') + '</td>' +
                '</tr>';
        }

        if (!rows) {
            rows = '<tr><td colspan="4">No calculator entries recorded.</td></tr>';
        }

        var eventCount = Math.min(events.length, 20);
        for (i = Math.max(0, events.length - eventCount); i < events.length; i += 1) {
            var evt = events[i] || {};
            timelineRows +=
                '<tr>' +
                '<td>' + escapeHtml(evt.type || 'event') + '</td>' +
                '<td><code>' + escapeHtml(JSON.stringify(evt.details || {})) + '</code></td>' +
                '<td>' + escapeHtml(evt.createdAt || '') + '</td>' +
                '</tr>';
        }

        if (!timelineRows) {
            timelineRows = '<tr><td colspan="3">No timeline events.</td></tr>';
        }

        return '<!DOCTYPE html>' +
            '<html lang="en">' +
            '<head>' +
            '<meta charset="utf-8">' +
            '<meta name="viewport" content="width=device-width, initial-scale=1">' +
            '<title>Encounter Export - ' + escapeHtml(encounter.caseTitle || encounter.caseId || 'Case') + '</title>' +
            '<style>' +
            'body{font-family:Arial,sans-serif;margin:24px;color:#0f172a;line-height:1.45}' +
            'h1,h2{margin:0 0 12px}' +
            '.meta{margin:0 0 16px;padding:12px;border:1px solid #cbd5e1;border-radius:8px;background:#f8fafc}' +
            '.meta p{margin:4px 0}' +
            'table{width:100%;border-collapse:collapse;margin-top:10px}' +
            'th,td{border:1px solid #cbd5e1;padding:8px;vertical-align:top;text-align:left;font-size:12px}' +
            'th{background:#f1f5f9}' +
            'code{white-space:pre-wrap;word-break:break-word;font-size:11px}' +
            '.disclaimer{margin-top:18px;padding:10px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;font-size:12px}' +
            '@media print{body{margin:12px} .no-print{display:none}}' +
            '</style>' +
            '</head>' +
            '<body>' +
            '<h1>Encounter Export</h1>' +
            '<div class="meta">' +
            '<p><strong>Encounter ID:</strong> ' + escapeHtml(encounter.id || '') + '</p>' +
            '<p><strong>Case:</strong> ' + escapeHtml(encounter.caseTitle || encounter.caseId || '') + '</p>' +
            '<p><strong>Status:</strong> ' + escapeHtml(encounter.status || 'open') + '</p>' +
            '<p><strong>Created:</strong> ' + escapeHtml(encounter.createdAt || '') + '</p>' +
            '<p><strong>Updated:</strong> ' + escapeHtml(encounter.updatedAt || '') + '</p>' +
            '<p><strong>Outcome:</strong> ' + escapeHtml(outcomes.resolution || 'not documented') + '</p>' +
            '<p><strong>Follow-up needed:</strong> ' + (outcomes.followUpNeeded ? 'Yes' : 'No') + '</p>' +
            '<p><strong>Complications:</strong> ' + escapeHtml(Array.isArray(outcomes.complications) ? outcomes.complications.join('; ') : '') + '</p>' +
            '<p><strong>Actual treatment:</strong> ' + escapeHtml(outcomes.actualTreatment || '') + '</p>' +
            '</div>' +
            '<h2>Calculator Log</h2>' +
            '<table>' +
            '<thead><tr><th>Calculator</th><th>Inputs</th><th>Outputs</th><th>Timestamp</th></tr></thead>' +
            '<tbody>' + rows + '</tbody>' +
            '</table>' +
            '<h2>Recent Timeline Events</h2>' +
            '<table>' +
            '<thead><tr><th>Event</th><th>Details</th><th>Timestamp</th></tr></thead>' +
            '<tbody>' + timelineRows + '</tbody>' +
            '</table>' +
            '<p class="disclaimer">Educational export only. Verify all doses and treatment decisions against current clinical protocols.</p>' +
            '<p class="no-print"><button onclick="window.print()">Print / Save as PDF</button></p>' +
            '<script>setTimeout(function(){window.print();},300);<\/script>' +
            '</body>' +
            '</html>';
    }

    function encounterToCsv(encounter) {
        var lines = [];
        var calculations = Array.isArray(encounter.calculations) ? encounter.calculations : [];
        var i;

        lines.push([
            'encounter_id',
            'case_id',
            'case_title',
            'status',
            'event_type',
            'calculator_id',
            'calculator_label',
            'created_at',
            'inputs',
            'outputs',
            'warnings',
            'user_override',
            'override_reason',
            'outcome_resolution',
            'outcome_follow_up_needed',
            'outcome_complications',
            'outcome_actual_treatment'
        ].join(','));

        for (i = 0; i < calculations.length; i += 1) {
            var row = calculations[i];
            var outcomes = encounter.outcomes && typeof encounter.outcomes === 'object' ? encounter.outcomes : {};
            lines.push([
                toCsvCell(encounter.id),
                toCsvCell(encounter.caseId),
                toCsvCell(encounter.caseTitle),
                toCsvCell(encounter.status || 'open'),
                toCsvCell('calculation'),
                toCsvCell(row.calculatorId),
                toCsvCell(row.calculatorLabel),
                toCsvCell(row.createdAt),
                toCsvCell(row.inputs),
                toCsvCell(row.outputs),
                toCsvCell(Array.isArray(row.warnings) ? row.warnings.join('; ') : ''),
                toCsvCell(row.userOverride ? 'yes' : 'no'),
                toCsvCell(row.overrideReason || ''),
                toCsvCell(outcomes.resolution || ''),
                toCsvCell(outcomes.followUpNeeded ? 'yes' : 'no'),
                toCsvCell(Array.isArray(outcomes.complications) ? outcomes.complications.join('; ') : ''),
                toCsvCell(outcomes.actualTreatment || '')
            ].join(','));
        }

        if (!calculations.length) {
            var emptyOutcomes = encounter.outcomes && typeof encounter.outcomes === 'object' ? encounter.outcomes : {};
            lines.push([
                toCsvCell(encounter.id),
                toCsvCell(encounter.caseId),
                toCsvCell(encounter.caseTitle),
                toCsvCell(encounter.status || 'open'),
                toCsvCell('outcome_snapshot'),
                toCsvCell(''),
                toCsvCell(''),
                toCsvCell(emptyOutcomes.updatedAt || encounter.updatedAt || ''),
                toCsvCell(''),
                toCsvCell(''),
                toCsvCell(''),
                toCsvCell(''),
                toCsvCell(''),
                toCsvCell(emptyOutcomes.resolution || ''),
                toCsvCell(emptyOutcomes.followUpNeeded ? 'yes' : 'no'),
                toCsvCell(Array.isArray(emptyOutcomes.complications) ? emptyOutcomes.complications.join('; ') : ''),
                toCsvCell(emptyOutcomes.actualTreatment || '')
            ].join(','));
        }

        return lines.join('\n');
    }

    function downloadText(filename, content, mimeType) {
        var blob = new Blob([String(content || '')], { type: mimeType || 'text/plain;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename || 'download.txt';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        window.setTimeout(function () {
            URL.revokeObjectURL(url);
        }, 250);
    }

    function exportEncounter(encounterId, format) {
        var encounter = getEncounter(encounterId);
        if (!encounter) {
            return {
                ok: false,
                reason: 'encounter_not_found'
            };
        }

        var normalized = String(format || 'json').toLowerCase();
        var exportType = 'json';
        var extension = 'json';
        var content;
        var mimeType;

        if (normalized === 'csv') {
            exportType = 'csv';
            extension = 'csv';
            content = encounterToCsv(encounter);
            mimeType = 'text/csv;charset=utf-8';
        } else if (normalized === 'fhir' || normalized === 'hl7' || normalized === 'hl7_fhir' || normalized === 'fhir_json') {
            exportType = 'fhir';
            extension = 'fhir.json';
            content = JSON.stringify(encounterToFhir(encounter), null, 2);
            mimeType = 'application/fhir+json;charset=utf-8';
        } else if (normalized === 'pdf' || normalized === 'print') {
            var popup = window.open('', '_blank', 'noopener,noreferrer');
            if (!popup) {
                return {
                    ok: false,
                    reason: 'popup_blocked'
                };
            }

            popup.document.open();
            popup.document.write(encounterToPrintableHtml(encounter));
            popup.document.close();
            exportType = 'pdf';
        } else {
            exportType = 'json';
            extension = 'json';
            content = JSON.stringify(encounter, null, 2);
            mimeType = 'application/json;charset=utf-8';
        }

        if (exportType !== 'pdf') {
            var filename = (sanitizeId(encounter.caseId) || 'encounter') + '_' + sanitizeId(encounter.id) + '.' + extension;
            downloadText(filename, content, mimeType);
        }

        var encounters = getAllEncounters();
        if (encounters[encounter.id]) {
            encounters[encounter.id].exports = Array.isArray(encounters[encounter.id].exports) ? encounters[encounter.id].exports : [];
            encounters[encounter.id].exports.push({
                format: exportType,
                createdAt: nowIso()
            });
            encounters[encounter.id].updatedAt = nowIso();
            setAllEncounters(encounters);
        }

        triggerSync('phase4_export', {
            encounterId: encounter.id,
            format: exportType
        });

        return {
            ok: true,
            format: exportType,
            encounterId: encounter.id
        };
    }

    function flushQueue() {
        var queue = getOfflineQueue();
        if (!queue.length) {
            return Promise.resolve({
                ok: true,
                flushed: 0
            });
        }

        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            return Promise.resolve({
                ok: false,
                reason: 'offline',
                queued: queue.length
            });
        }

        if (!window.pcSync || typeof window.pcSync.syncToServer !== 'function') {
            return Promise.resolve({
                ok: false,
                reason: 'sync_unavailable',
                queued: queue.length
            });
        }

        return window.pcSync.syncToServer({ trigger: 'phase4_offline_flush' })
            .then(function (result) {
                if (result && result.ok) {
                    setOfflineQueue([]);
                    return {
                        ok: true,
                        flushed: queue.length
                    };
                }
                return {
                    ok: false,
                    reason: 'sync_failed',
                    queued: queue.length
                };
            })
            .catch(function () {
                return {
                    ok: false,
                    reason: 'sync_failed',
                    queued: queue.length
                };
            });
    }

    function buildPrefillUrl(path, params, context) {
        var basePath = String(path || '/');
        var target = new URL(basePath, window.location.origin);
        var keyList = Object.keys(params || {});
        var i;

        for (i = 0; i < keyList.length; i += 1) {
            var key = keyList[i];
            var value = params[key];
            if (value === null || value === undefined || value === '') {
                continue;
            }
            target.searchParams.set(key, String(value));
        }

        var ctx = context && typeof context === 'object' ? context : {};
        var urlContext = getContextFromUrl();
        var caseId = sanitizeId(ctx.caseId || urlContext.caseId || '');
        var encounterId = sanitizeId(ctx.encounterId || urlContext.encounterId || '');

        if (caseId && !target.searchParams.get('case')) {
            target.searchParams.set('case', caseId);
        }

        if (encounterId && !target.searchParams.get('encounter')) {
            target.searchParams.set('encounter', encounterId);
        }

        return target.pathname + target.search;
    }

    function bindListeners() {
        if (listenersBound) {
            return;
        }
        listenersBound = true;

        window.addEventListener('online', function () {
            flushQueue().catch(function () {
                // Best effort.
            });
        });

        if (canUseBackgroundSync()) {
            navigator.serviceWorker.addEventListener('message', function (event) {
                var data = event && event.data ? event.data : null;
                if (!data || data.type !== 'pc-phase4-sync-request') {
                    return;
                }

                flushQueue().catch(function () {
                    // Best effort sync on worker request.
                });
            });
        }
    }

    window.pcIntegration = {
        getContextFromUrl: getContextFromUrl,
        ensureEncounter: ensureEncounter,
        getEncounter: getEncounter,
        listCaseEncounters: listCaseEncounters,
        getLatestEncounterForCase: getLatestEncounterForCase,
        logCaseOpen: logCaseOpen,
        logCaseAction: logCaseAction,
        logCalculation: logCalculation,
        updateEncounterOutcome: updateEncounterOutcome,
        exportEncounter: exportEncounter,
        queueAction: queueAction,
        flushQueue: flushQueue,
        buildPrefillUrl: buildPrefillUrl
    };

    window.PCIntegration = window.pcIntegration;
    bindListeners();
})();
