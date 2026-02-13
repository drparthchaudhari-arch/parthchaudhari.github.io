(function () {
    'use strict';

    var ENCOUNTERS_KEY = 'pc_phase4_encounters_v1';
    var ACTIVE_CASE_MAP_KEY = 'pc_phase4_active_case_map_v1';
    var OFFLINE_QUEUE_KEY = 'pc_phase4_offline_queue_v1';
    var MAX_CALCULATIONS_PER_ENCOUNTER = 250;
    var MAX_EVENTS_PER_ENCOUNTER = 500;
    var MAX_OFFLINE_QUEUE = 100;
    var listenersBound = false;

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
            'warnings'
        ].join(','));

        for (i = 0; i < calculations.length; i += 1) {
            var row = calculations[i];
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
                toCsvCell(Array.isArray(row.warnings) ? row.warnings.join('; ') : '')
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
        var extension = normalized === 'csv' ? 'csv' : 'json';
        var content;
        var mimeType;

        if (extension === 'csv') {
            content = encounterToCsv(encounter);
            mimeType = 'text/csv;charset=utf-8';
        } else {
            content = JSON.stringify(encounter, null, 2);
            mimeType = 'application/json;charset=utf-8';
        }

        var filename = (sanitizeId(encounter.caseId) || 'encounter') + '_' + sanitizeId(encounter.id) + '.' + extension;
        downloadText(filename, content, mimeType);

        var encounters = getAllEncounters();
        if (encounters[encounter.id]) {
            encounters[encounter.id].exports = Array.isArray(encounters[encounter.id].exports) ? encounters[encounter.id].exports : [];
            encounters[encounter.id].exports.push({
                format: extension,
                createdAt: nowIso()
            });
            encounters[encounter.id].updatedAt = nowIso();
            setAllEncounters(encounters);
        }

        triggerSync('phase4_export', {
            encounterId: encounter.id,
            format: extension
        });

        return {
            ok: true,
            format: extension,
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
        exportEncounter: exportEncounter,
        queueAction: queueAction,
        flushQueue: flushQueue,
        buildPrefillUrl: buildPrefillUrl
    };

    window.PCIntegration = window.pcIntegration;
    bindListeners();
})();
