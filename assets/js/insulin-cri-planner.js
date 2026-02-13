(function () {
    'use strict';

    var REFERENCE_BASELINE = [
        'DailyMed drug labels',
        'Normal lab values',
        'RECOVER CPR guidelines'
    ];

    var integrationContext = {
        caseId: '',
        encounterId: '',
        autoRun: false
    };

    function toNumber(value) {
        var parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : NaN;
    }

    function format(value, digits, suffix) {
        if (!Number.isFinite(value)) {
            return '-';
        }
        return value.toFixed(digits) + (suffix || '');
    }

    function setText(id, text) {
        var node = document.getElementById(id);
        if (node) {
            node.textContent = text;
        }
    }

    function setOverrideNote(message, isWarning) {
        var note = document.getElementById('icp-override-note');
        if (!note) {
            return;
        }

        if (!message) {
            note.hidden = true;
            note.textContent = '';
            note.classList.remove('pc-is-warning');
            return;
        }

        note.hidden = false;
        note.textContent = message;
        note.classList.toggle('pc-is-warning', !!isWarning);
    }

    function parseQuery() {
        try {
            return new URLSearchParams(window.location.search || '');
        } catch (error) {
            return new URLSearchParams('');
        }
    }

    function setInputValue(id, value, allowZero) {
        var node = document.getElementById(id);
        var numeric = toNumber(value);

        if (!node || !Number.isFinite(numeric)) {
            return false;
        }

        if (!allowZero && numeric <= 0) {
            return false;
        }

        node.value = String(numeric);
        return true;
    }

    function applyPrefillFromQuery() {
        var params = parseQuery();
        var prefilled = false;

        prefilled = setInputValue('icp-weight', params.get('weight'), false) || prefilled;
        prefilled = setInputValue('icp-dose', params.get('dose'), false) || prefilled;
        prefilled = setInputValue('icp-bag-volume', params.get('bag'), false) || prefilled;
        prefilled = setInputValue('icp-insulin-units', params.get('units'), false) || prefilled;
        prefilled = setInputValue('icp-bg', params.get('bg'), false) || prefilled;

        integrationContext.caseId = String(params.get('case') || params.get('caseId') || '').trim().toLowerCase();
        integrationContext.encounterId = String(params.get('encounter') || '').trim().toLowerCase();
        integrationContext.autoRun = String(params.get('auto') || '').trim() === '1';

        var note = document.getElementById('icp-context-note');
        if (note) {
            if (integrationContext.caseId || integrationContext.encounterId || prefilled) {
                note.hidden = false;
                note.textContent =
                    'Case-linked prefill active' +
                    (integrationContext.caseId ? ' for ' + integrationContext.caseId : '') +
                    (integrationContext.encounterId ? ' | encounter: ' + integrationContext.encounterId : '') +
                    '.';
            } else {
                note.hidden = true;
            }
        }
    }

    function readInputs() {
        var weight = toNumber(document.getElementById('icp-weight').value);
        var dose = toNumber(document.getElementById('icp-dose').value);
        var bagVolume = toNumber(document.getElementById('icp-bag-volume').value);
        var insulinUnits = toNumber(document.getElementById('icp-insulin-units').value);
        var bg = toNumber(document.getElementById('icp-bg').value);
        var userOverride = !!(document.getElementById('icp-override') && document.getElementById('icp-override').checked);
        var overrideReasonNode = document.getElementById('icp-override-reason');
        var overrideReason = overrideReasonNode ? String(overrideReasonNode.value || '').trim() : '';

        if (!Number.isFinite(weight) || weight <= 0 ||
            !Number.isFinite(dose) || dose <= 0 ||
            !Number.isFinite(bagVolume) || bagVolume <= 0 ||
            !Number.isFinite(insulinUnits) || insulinUnits <= 0) {
            return null;
        }

        return {
            weight: weight,
            dose: dose,
            bagVolume: bagVolume,
            insulinUnits: insulinUnits,
            bg: bg,
            userOverride: userOverride,
            overrideReason: overrideReason
        };
    }

    function renderCalculation(input) {
        if (!input) {
            return null;
        }

        var weight = input.weight;
        var dose = input.dose;
        var bagVolume = input.bagVolume;
        var insulinUnits = input.insulinUnits;
        var bg = input.bg;


        var concentration = insulinUnits / bagVolume;
        var requiredUnitsPerHour = weight * dose;
        var infusionRateMlHr = requiredUnitsPerHour / concentration;
        var dextroseLow = requiredUnitsPerHour * 1;
        var dextroseHigh = requiredUnitsPerHour * 2;

        setText('icp-conc', format(concentration, 4, ' U/mL'));
        setText('icp-uhr', format(requiredUnitsPerHour, 3, ' U/hr'));
        setText('icp-rate', format(infusionRateMlHr, 2, ' mL/hr'));
        setText('icp-dextrose', format(dextroseLow, 1, '') + ' - ' + format(dextroseHigh, 1, ' g/hr'));

        var notes = [];
        if (Number.isFinite(bg)) {
            if (bg < 150) {
                notes.push('BG is already low; hold or reduce insulin and increase dextrose support per clinician protocol.');
            } else if (bg < 250) {
                notes.push('BG is near transition range; continue insulin but add dextrose support and monitor closely.');
            } else {
                notes.push('BG remains elevated; continue scheduled reassessment while titrating CRI.');
            }
        }

        if (requiredUnitsPerHour > 2) {
            notes.push('High hourly insulin exposure: verify dilution math and pump programming with a second check.');
        }

        notes.push('Recheck BG/electrolytes every 2-4 hours and adjust CRI/dextrose together.');
        setText('icp-note', notes.join(' '));

        return {
            concentration: concentration,
            requiredUnitsPerHour: requiredUnitsPerHour,
            infusionRateMlHr: infusionRateMlHr,
            dextroseLow: dextroseLow,
            dextroseHigh: dextroseHigh
        };
    }

    function logCalculation(input, output) {
        if (!window.pcIntegration || typeof window.pcIntegration.logCalculation !== 'function') {
            return;
        }

        window.pcIntegration.logCalculation({
            caseId: integrationContext.caseId,
            encounterId: integrationContext.encounterId,
            caseTitle: document.title,
            calculatorId: 'insulin_cri_planner',
            calculatorLabel: 'Insulin CRI Planner',
            source: 'tool_insulin_cri',
            inputs: {
                weightKg: input.weight,
                doseUkgHr: input.dose,
                bagVolumeMl: input.bagVolume,
                insulinUnitsAdded: input.insulinUnits,
                currentBgMgDl: Number.isFinite(input.bg) ? input.bg : null
            },
            outputs: {
                concentrationUml: output.concentration,
                unitsPerHour: output.requiredUnitsPerHour,
                infusionRateMlHr: output.infusionRateMlHr,
                dextroseSupportRangeGhr: [output.dextroseLow, output.dextroseHigh]
            },
            references: REFERENCE_BASELINE,
            userOverride: input.userOverride,
            overrideReason: input.overrideReason
        });
    }

    function calculate(event) {
        if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
        }

        var input = readInputs();
        if (!input) {
            setText('icp-note', 'Enter valid positive values for weight, dose, bag volume, and insulin units.');
            return;
        }

        var output = renderCalculation(input);
        if (!output) {
            return;
        }

        if (input.userOverride && !input.overrideReason) {
            setOverrideNote('Override is selected. Enter an override reason to save this run in encounter logs.', true);
            return;
        }

        if (input.userOverride) {
            setOverrideNote('Override reason captured and saved with this calculation.', false);
        } else {
            setOverrideNote('', false);
        }

        logCalculation(input, output);
    }

    function init() {
        var form = document.getElementById('icp-form');
        if (!form) {
            return;
        }

        applyPrefillFromQuery();
        form.addEventListener('submit', calculate);
        form.addEventListener('input', calculate);
        form.addEventListener('change', calculate);
        calculate();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
