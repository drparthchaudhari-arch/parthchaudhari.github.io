(function () {
    'use strict';

    var REFERENCE_BASELINE = [
        'DailyMed drug labels',
        'IRIS staging context',
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

    function formatNumber(value, digits) {
        if (!Number.isFinite(value)) {
            return '-';
        }
        return value.toFixed(digits);
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

        prefilled = setInputValue('fluid-weight', params.get('weight'), false) || prefilled;
        prefilled = setInputValue('fluid-dehydration', params.get('dehydration'), true) || prefilled;
        prefilled = setInputValue('fluid-maintenance', params.get('maintenance'), false) || prefilled;

        integrationContext.caseId = String(params.get('case') || params.get('caseId') || '').trim().toLowerCase();
        integrationContext.encounterId = String(params.get('encounter') || '').trim().toLowerCase();
        integrationContext.autoRun = String(params.get('auto') || '').trim() === '1';

        var note = document.getElementById('fluid-context-note');
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

    function setResult(id, value, suffix) {
        var node = document.getElementById(id);
        if (!node) {
            return;
        }
        node.textContent = formatNumber(value, 1) + (suffix || '');
    }

    function readInputs() {
        var weight = toNumber(document.getElementById('fluid-weight').value);
        var dehydrationPercent = toNumber(document.getElementById('fluid-dehydration').value);
        var maintenanceFactor = toNumber(document.getElementById('fluid-maintenance').value);

        if (!Number.isFinite(weight) || weight <= 0) {
            return null;
        }

        if (!Number.isFinite(dehydrationPercent) || dehydrationPercent < 0) {
            return null;
        }

        if (!Number.isFinite(maintenanceFactor) || maintenanceFactor <= 0) {
            return null;
        }

        return {
            weight: weight,
            dehydrationPercent: dehydrationPercent,
            maintenanceFactor: maintenanceFactor
        };
    }

    function renderCalculation(input) {
        if (!input) {
            return null;
        }

        var weight = input.weight;
        var dehydrationPercent = input.dehydrationPercent;
        var maintenanceFactor = input.maintenanceFactor;
        var deficitMl = weight * dehydrationPercent * 10;
        var maintenanceMlDay = weight * maintenanceFactor;
        var total24hMl = deficitMl + maintenanceMlDay;
        var hourlyMl = total24hMl / 24;

        setResult('fluid-deficit', deficitMl, ' mL');
        setResult('fluid-maint', maintenanceMlDay, ' mL/day');
        setResult('fluid-total', total24hMl, ' mL/24h');

        var hourlyNode = document.getElementById('fluid-hourly');
        if (hourlyNode) {
            hourlyNode.textContent = formatNumber(hourlyMl, 1) + ' mL/hour';
        }

        var shockNode = document.getElementById('fluid-shock');
        if (shockNode) {
            var dogLow = weight * 10;
            var dogHigh = weight * 20;
            var catLow = weight * 5;
            var catHigh = weight * 10;
            shockNode.textContent =
                'Shock bolus reminder: dog ' + formatNumber(dogLow, 0) + '-' + formatNumber(dogHigh, 0) + ' mL aliquots; ' +
                'cat ' + formatNumber(catLow, 0) + '-' + formatNumber(catHigh, 0) + ' mL aliquots, then reassess perfusion.';
        }

        return {
            deficitMl: deficitMl,
            maintenanceMlDay: maintenanceMlDay,
            total24hMl: total24hMl,
            hourlyMl: hourlyMl
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
            calculatorId: 'fluid_calculator',
            calculatorLabel: 'Fluid Calculator',
            source: 'tool_fluid_calculator',
            inputs: {
                weightKg: input.weight,
                dehydrationPercent: input.dehydrationPercent,
                maintenanceMlKgDay: input.maintenanceFactor
            },
            outputs: {
                deficitMl: output.deficitMl,
                maintenanceMlDay: output.maintenanceMlDay,
                total24hMl: output.total24hMl,
                hourlyMl: output.hourlyMl
            },
            references: REFERENCE_BASELINE
        });
    }

    function calculate(event) {
        if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
        }

        var input = readInputs();
        if (!input) {
            return;
        }

        var output = renderCalculation(input);
        if (!output) {
            return;
        }

        logCalculation(input, output);
    }

    function init() {
        var form = document.getElementById('fluid-form');
        if (!form) {
            return;
        }

        applyPrefillFromQuery();
        form.addEventListener('submit', calculate);

        if (integrationContext.autoRun) {
            calculate();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
