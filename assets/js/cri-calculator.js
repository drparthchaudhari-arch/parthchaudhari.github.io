(function () {
    'use strict';

    var PRESETS = [
        { id: 'custom', label: 'Custom', dose: '', unit: 'mcg_kg_min', concentration: '' },
        { id: 'fentanyl', label: 'Fentanyl', dose: 5, unit: 'mcg_kg_hr', concentration: 0.05 },
        { id: 'ketamine', label: 'Ketamine', dose: 0.6, unit: 'mg_kg_hr', concentration: 10 },
        { id: 'lidocaine', label: 'Lidocaine (dog)', dose: 2, unit: 'mg_kg_hr', concentration: 20 },
        { id: 'dexmed', label: 'Dexmedetomidine', dose: 1, unit: 'mcg_kg_hr', concentration: 0.01 },
        { id: 'morphine', label: 'Morphine', dose: 0.1, unit: 'mg_kg_hr', concentration: 1 }
    ];

    function toNumber(value) {
        var parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : NaN;
    }

    function format(value, digits) {
        if (!Number.isFinite(value)) {
            return '-';
        }
        return value.toFixed(digits);
    }

    function doseToMgKgHr(dose, unit) {
        if (unit === 'mcg_kg_min') {
            return (dose * 60) / 1000;
        }
        if (unit === 'mcg_kg_hr') {
            return dose / 1000;
        }
        return dose;
    }

    function setText(id, value) {
        var node = document.getElementById(id);
        if (node) {
            node.textContent = value;
        }
    }

    function runCalculation(event) {
        event.preventDefault();

        var weight = toNumber(document.getElementById('cri-weight').value);
        var dose = toNumber(document.getElementById('cri-dose').value);
        var unit = String(document.getElementById('cri-unit').value || 'mcg_kg_min');
        var concentration = toNumber(document.getElementById('cri-concentration').value);

        if (!Number.isFinite(weight) || weight <= 0 || !Number.isFinite(dose) || dose <= 0 || !Number.isFinite(concentration) || concentration <= 0) {
            setText('cri-note', 'Enter valid positive values for weight, dose, and concentration.');
            return;
        }

        var mgKgHr = doseToMgKgHr(dose, unit);
        var mgHr = mgKgHr * weight;
        var mlHr = mgHr / concentration;
        var mlDay = mlHr * 24;

        setText('cri-mg-hr', format(mgHr, 3) + ' mg/hr');
        setText('cri-ml-hr', format(mlHr, 3) + ' mL/hr');
        setText('cri-ml-day', format(mlDay, 2) + ' mL/day');
        setText('cri-note', 'Calculated using ' + format(mgKgHr, 4) + ' mg/kg/hr equivalent dose.');
    }

    function applyPreset() {
        var presetId = String(document.getElementById('cri-preset').value || 'custom');

        for (var i = 0; i < PRESETS.length; i += 1) {
            if (PRESETS[i].id !== presetId) {
                continue;
            }

            if (PRESETS[i].dose !== '') {
                document.getElementById('cri-dose').value = PRESETS[i].dose;
            }

            if (PRESETS[i].unit) {
                document.getElementById('cri-unit').value = PRESETS[i].unit;
            }

            if (PRESETS[i].concentration !== '') {
                document.getElementById('cri-concentration').value = PRESETS[i].concentration;
            }
            return;
        }
    }

    function populatePresets() {
        var select = document.getElementById('cri-preset');
        if (!select) {
            return;
        }

        for (var i = 0; i < PRESETS.length; i += 1) {
            var option = document.createElement('option');
            option.value = PRESETS[i].id;
            option.textContent = PRESETS[i].label;
            select.appendChild(option);
        }
    }

    function init() {
        var form = document.getElementById('cri-form');
        var preset = document.getElementById('cri-preset');

        if (!form || !preset) {
            return;
        }

        populatePresets();

        form.addEventListener('submit', runCalculation);
        preset.addEventListener('change', applyPreset);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
