(function () {
    'use strict';

    var CRI_DRUGS = [
        {
            id: 'morphine',
            name: 'Morphine',
            defaultRate: 0.2,
            rateUnit: 'mg_kg_hr',
            stockConcentration: 15,
            range: { min: 0.1, max: 0.5, unit: 'mg_kg_hr' },
            maxSafeConcentration: 1.5,
            lightSensitive: false,
            requiresFilter: false,
            incompatibleWith: [],
            reference: 'Plumb\'s CRI chapter'
        },
        {
            id: 'fentanyl',
            name: 'Fentanyl',
            defaultRate: 7,
            rateUnit: 'mcg_kg_hr',
            stockConcentration: 0.05,
            range: { min: 5, max: 10, unit: 'mcg_kg_hr' },
            maxSafeConcentration: 0.2,
            lightSensitive: false,
            requiresFilter: false,
            incompatibleWith: [],
            reference: 'Emergency and critical care analgesia protocols'
        },
        {
            id: 'lidocaine',
            name: 'Lidocaine (Dog)',
            defaultRate: 50,
            rateUnit: 'mcg_kg_min',
            stockConcentration: 20,
            range: { min: 50, max: 100, unit: 'mcg_kg_min' },
            maxSafeConcentration: 6,
            lightSensitive: false,
            requiresFilter: false,
            incompatibleWith: ['sodium bicarbonate'],
            reference: 'Ventricular arrhythmia CRI ranges'
        },
        {
            id: 'ketamine',
            name: 'Ketamine',
            defaultRate: 0.6,
            rateUnit: 'mg_kg_hr',
            stockConcentration: 100,
            range: { min: 0.6, max: 1.2, unit: 'mg_kg_hr' },
            maxSafeConcentration: 2,
            lightSensitive: false,
            requiresFilter: false,
            incompatibleWith: [],
            reference: 'Analgesic adjunct CRI standards'
        },
        {
            id: 'dopamine',
            name: 'Dopamine',
            defaultRate: 5,
            rateUnit: 'mcg_kg_min',
            stockConcentration: 40,
            range: { min: 5, max: 20, unit: 'mcg_kg_min' },
            maxSafeConcentration: 2,
            lightSensitive: true,
            requiresFilter: false,
            incompatibleWith: ['alkaline solutions'],
            reference: 'Inotrope and vasopressor range'
        },
        {
            id: 'dobutamine',
            name: 'Dobutamine',
            defaultRate: 5,
            rateUnit: 'mcg_kg_min',
            stockConcentration: 12.5,
            range: { min: 5, max: 20, unit: 'mcg_kg_min' },
            maxSafeConcentration: 1,
            lightSensitive: false,
            requiresFilter: false,
            incompatibleWith: ['alkaline solutions'],
            reference: 'Cardiogenic shock support range'
        },
        {
            id: 'nitroglycerin',
            name: 'Nitroglycerin',
            defaultRate: 1,
            rateUnit: 'mcg_kg_min',
            stockConcentration: 5,
            range: { min: 1, max: 5, unit: 'mcg_kg_min' },
            maxSafeConcentration: 0.5,
            lightSensitive: true,
            requiresFilter: false,
            incompatibleWith: [],
            reference: 'Vasodilator infusion standards'
        },
        {
            id: 'nitroprusside',
            name: 'Nitroprusside',
            defaultRate: 1,
            rateUnit: 'mcg_kg_min',
            stockConcentration: 25,
            range: { min: 1, max: 10, unit: 'mcg_kg_min' },
            maxSafeConcentration: 0.5,
            lightSensitive: true,
            requiresFilter: true,
            incompatibleWith: ['NS if protocol requires D5W-only'],
            reference: 'ICU vasodilator protocols'
        },
        {
            id: 'esmolol',
            name: 'Esmolol',
            defaultRate: 50,
            rateUnit: 'mcg_kg_min',
            stockConcentration: 10,
            range: { min: 50, max: 200, unit: 'mcg_kg_min' },
            maxSafeConcentration: 5,
            lightSensitive: false,
            requiresFilter: false,
            incompatibleWith: [],
            reference: 'SVT and tachyarrhythmia infusion range'
        },
        {
            id: 'propofol',
            name: 'Propofol',
            defaultRate: 0.1,
            rateUnit: 'mg_kg_min',
            stockConcentration: 10,
            range: { min: 0.1, max: 0.4, unit: 'mg_kg_min' },
            maxSafeConcentration: 10,
            lightSensitive: false,
            requiresFilter: false,
            incompatibleWith: ['many admixtures; often run undiluted'],
            reference: 'Sedation infusion range'
        },
        {
            id: 'metoclopramide',
            name: 'Metoclopramide',
            defaultRate: 1,
            rateUnit: 'mg_kg_day',
            stockConcentration: 5,
            range: { min: 1, max: 2, unit: 'mg_kg_day' },
            maxSafeConcentration: 0.5,
            lightSensitive: false,
            requiresFilter: false,
            incompatibleWith: [],
            reference: 'Antiemetic CRI daily dosing'
        },
        {
            id: 'vasopressin',
            name: 'Vasopressin (Units concentration entered as numeric)',
            defaultRate: 0.01,
            rateUnit: 'u_kg_min',
            stockConcentration: 20,
            range: { min: 0.01, max: 0.04, unit: 'u_kg_min' },
            maxSafeConcentration: 2,
            lightSensitive: false,
            requiresFilter: false,
            incompatibleWith: [],
            reference: 'Vasopressor rescue range'
        },
        {
            id: 'medetomidine',
            name: 'Medetomidine',
            defaultRate: 0.8,
            rateUnit: 'mcg_kg_hr',
            stockConcentration: 1,
            range: { min: 0.5, max: 1, unit: 'mcg_kg_hr' },
            maxSafeConcentration: 0.1,
            lightSensitive: false,
            requiresFilter: false,
            incompatibleWith: [],
            reference: 'Sedation infusion protocol'
        },
        {
            id: 'dexmedetomidine',
            name: 'Dexmedetomidine',
            defaultRate: 0.5,
            rateUnit: 'mcg_kg_hr',
            stockConcentration: 0.5,
            range: { min: 0.5, max: 2, unit: 'mcg_kg_hr' },
            maxSafeConcentration: 0.05,
            lightSensitive: false,
            requiresFilter: false,
            incompatibleWith: [],
            reference: 'Sedation and MAC-sparing CRI range'
        },
        {
            id: 'glycopyrrolate',
            name: 'Glycopyrrolate',
            defaultRate: 0.01,
            rateUnit: 'mg_kg_hr',
            stockConcentration: 0.2,
            range: { min: 0.005, max: 0.02, unit: 'mg_kg_hr' },
            maxSafeConcentration: 0.05,
            lightSensitive: false,
            requiresFilter: false,
            incompatibleWith: [],
            reference: 'Anticholinergic infusion support'
        },
        {
            id: 'norepinephrine',
            name: 'Norepinephrine',
            defaultRate: 0.05,
            rateUnit: 'mcg_kg_min',
            stockConcentration: 1,
            range: { min: 0.05, max: 2, unit: 'mcg_kg_min' },
            maxSafeConcentration: 0.3,
            lightSensitive: true,
            requiresFilter: false,
            incompatibleWith: ['alkaline solutions'],
            reference: 'Vasopressor titration protocols'
        },
        {
            id: 'milrinone',
            name: 'Milrinone',
            defaultRate: 0.5,
            rateUnit: 'mcg_kg_min',
            stockConcentration: 1,
            range: { min: 0.25, max: 0.75, unit: 'mcg_kg_min' },
            maxSafeConcentration: 0.2,
            lightSensitive: false,
            requiresFilter: false,
            incompatibleWith: ['furosemide in same line'],
            reference: 'Advanced cardiogenic support protocols'
        },
        {
            id: 'midazolam',
            name: 'Midazolam',
            defaultRate: 0.2,
            rateUnit: 'mg_kg_hr',
            stockConcentration: 5,
            range: { min: 0.1, max: 0.3, unit: 'mg_kg_hr' },
            maxSafeConcentration: 0.5,
            lightSensitive: false,
            requiresFilter: false,
            incompatibleWith: [],
            reference: 'Sedation CRI support protocols'
        },
        {
            id: 'alfaxalone',
            name: 'Alfaxalone',
            defaultRate: 2,
            rateUnit: 'mg_kg_hr',
            stockConcentration: 10,
            range: { min: 1, max: 4, unit: 'mg_kg_hr' },
            maxSafeConcentration: 2,
            lightSensitive: false,
            requiresFilter: false,
            incompatibleWith: [],
            reference: 'Continuous sedation protocols'
        },
        {
            id: 'insulin_regular',
            name: 'Regular Insulin (DKA CRI)',
            defaultRate: 0.0008,
            rateUnit: 'u_kg_min',
            stockConcentration: 100,
            range: { min: 0.0005, max: 0.001, unit: 'u_kg_min' },
            maxSafeConcentration: 2,
            lightSensitive: false,
            requiresFilter: false,
            incompatibleWith: [],
            reference: 'DKA CRI protocols'
        }
    ];

    var UNIT_LABELS = {
        mcg_kg_min: 'mcg/kg/min',
        mcg_kg_hr: 'mcg/kg/hr',
        mg_kg_hr: 'mg/kg/hr',
        mg_kg_day: 'mg/kg/day',
        mg_kg_min: 'mg/kg/min',
        u_kg_min: 'U/kg/min'
    };

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

    function setText(id, value) {
        var node = document.getElementById(id);
        if (node) {
            node.textContent = value;
        }
    }

    function getDrugById(id) {
        for (var i = 0; i < CRI_DRUGS.length; i += 1) {
            if (CRI_DRUGS[i].id === id) {
                return CRI_DRUGS[i];
            }
        }
        return CRI_DRUGS[0];
    }

    function doseToBasePerKgMin(rate, unit) {
        if (unit === 'mcg_kg_min') {
            return rate;
        }
        if (unit === 'mcg_kg_hr') {
            return rate / 60;
        }
        if (unit === 'mg_kg_hr') {
            return (rate * 1000) / 60;
        }
        if (unit === 'mg_kg_day') {
            return (rate * 1000) / (24 * 60);
        }
        if (unit === 'mg_kg_min') {
            return rate * 1000;
        }
        if (unit === 'u_kg_min') {
            return rate;
        }
        return NaN;
    }

    function basePerKgMinToUnit(baseRate, unit) {
        if (unit === 'mcg_kg_min') {
            return baseRate;
        }
        if (unit === 'mcg_kg_hr') {
            return baseRate * 60;
        }
        if (unit === 'mg_kg_hr') {
            return (baseRate * 60) / 1000;
        }
        if (unit === 'mg_kg_day') {
            return (baseRate * 60 * 24) / 1000;
        }
        if (unit === 'mg_kg_min') {
            return baseRate / 1000;
        }
        if (unit === 'u_kg_min') {
            return baseRate;
        }
        return NaN;
    }

    function unitWord(unit) {
        return UNIT_LABELS[unit] || unit;
    }

    function isUnitBasedDrug(drug) {
        return drug.rateUnit === 'u_kg_min';
    }

    function getSeverity(messages) {
        var hasDanger = false;
        var hasCaution = false;

        for (var i = 0; i < messages.length; i += 1) {
            if (messages[i].level === 'danger') {
                hasDanger = true;
            }
            if (messages[i].level === 'caution') {
                hasCaution = true;
            }
        }

        if (hasDanger) {
            return 'danger';
        }
        if (hasCaution) {
            return 'caution';
        }
        return 'ok';
    }

    function setSafety(messages) {
        var warningNode = document.getElementById('cri-safety');
        if (!warningNode) {
            return;
        }

        if (!messages.length) {
            warningNode.hidden = true;
            warningNode.textContent = '';
            warningNode.className = 'pc-calculator-warning';
            return;
        }

        var textParts = [];
        for (var i = 0; i < messages.length; i += 1) {
            textParts.push(messages[i].text);
        }

        var severity = getSeverity(messages);
        warningNode.hidden = false;
        warningNode.textContent = textParts.join(' ');
        warningNode.className = 'pc-calculator-warning';
        if (severity === 'danger') {
            warningNode.classList.add('pc-calculator-warning--danger');
        } else if (severity === 'caution') {
            warningNode.classList.add('pc-calculator-warning--caution');
        }
    }

    function renderResult(result) {
        setText('cri-total-mg', result.totalDrugLabel);
        setText('cri-drug-ml', format(result.volumeToAddMl, 2) + ' mL');
        setText('cri-remove-ml', format(result.fluidToRemoveMl, 2) + ' mL');
        setText('cri-final-conc', format(result.finalConcentration, 4) + ' ' + result.concentrationUnit + '/mL');
        setText('cri-admin-mlhr', format(result.adminRateMlPerHr, 1) + ' mL/hr');
        setText('cri-verify', format(result.backCalculatedRate, 2) + ' ' + unitWord(result.targetUnit));

        var stepText = '' +
            '1) Remove ' + format(result.fluidToRemoveMl, 2) + ' mL from a ' + format(result.bagVolumeMl, 0) + ' mL bag. ' +
            '2) Add ' + format(result.volumeToAddMl, 2) + ' mL of ' + result.drugName + '. ' +
            '3) Mix and label concentration as ' + format(result.finalConcentration, 4) + ' ' + result.concentrationUnit + '/mL. ' +
            '4) Run at ' + format(result.adminRateMlPerHr, 1) + ' mL/hr (' + format(result.dripRateDropsPerMin, 0) + ' drops/min at 20 gtt/mL).';

        setText('cri-steps', stepText);
        setText('cri-meta', 'Reference: ' + result.reference + '. Verification delta: ' + format(result.verificationPercent, 2) + '%.');
    }

    function calculate(event) {
        if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
        }

        var drugId = String(document.getElementById('cri-drug').value || 'morphine');
        var weightKg = toNumber(document.getElementById('cri-weight').value);
        var rate = toNumber(document.getElementById('cri-rate').value);
        var unit = String(document.getElementById('cri-unit').value || 'mcg_kg_min');
        var stockConcentration = toNumber(document.getElementById('cri-concentration').value);
        var bagVolume = toNumber(document.getElementById('cri-bag').value);
        var durationHours = toNumber(document.getElementById('cri-duration').value);

        if (!Number.isFinite(weightKg) || weightKg <= 0 || !Number.isFinite(rate) || rate <= 0 || !Number.isFinite(stockConcentration) || stockConcentration <= 0 || !Number.isFinite(bagVolume) || bagVolume <= 0 || !Number.isFinite(durationHours) || durationHours <= 0) {
            setText('cri-steps', 'Enter valid positive values for all CRI inputs.');
            setText('cri-meta', '-');
            setSafety([{ level: 'danger', text: 'Invalid input detected. Re-check weight, rate, concentration, bag volume, and duration.' }]);
            return;
        }

        var drug = getDrugById(drugId);
        var basePerKgMin = doseToBasePerKgMin(rate, unit);
        var baseUnitLabel = isUnitBasedDrug(drug) ? 'U' : 'mg';

        if (!Number.isFinite(basePerKgMin) || basePerKgMin <= 0) {
            setText('cri-steps', 'Selected rate unit is not supported for this calculation.');
            setText('cri-meta', '-');
            setSafety([{ level: 'danger', text: 'Unsupported unit conversion. Choose a valid CRI rate unit.' }]);
            return;
        }

        var perMin = weightKg * basePerKgMin;
        var perHour = perMin * 60;
        var totalNeeded = perHour * durationHours;

        if (!isUnitBasedDrug(drug)) {
            perHour = perHour / 1000;
            totalNeeded = perHour * durationHours;
        }

        var volumeToAdd = totalNeeded / stockConcentration;
        var fluidToRemove = volumeToAdd;
        var finalConcentration = totalNeeded / bagVolume;
        var adminRateMlPerHr = bagVolume / durationHours;
        var adminRateMlPerMin = adminRateMlPerHr / 60;
        var dripRate = adminRateMlPerMin * 20;

        var backDeliveredPerHour = adminRateMlPerHr * finalConcentration;
        var backPerKgPerMin = backDeliveredPerHour / weightKg / 60;
        if (!isUnitBasedDrug(drug)) {
            backPerKgPerMin = backPerKgPerMin * 1000;
        }

        var backInTargetUnit = basePerKgMinToUnit(backPerKgPerMin, unit);
        var verificationPercent = Math.abs(backInTargetUnit - rate) / rate * 100;

        var messages = [];
        var rangeMin = doseToBasePerKgMin(drug.range.min, drug.range.unit);
        var rangeMax = doseToBasePerKgMin(drug.range.max, drug.range.unit);

        if (Number.isFinite(rangeMin) && Number.isFinite(rangeMax) && (basePerKgMin < rangeMin || basePerKgMin > rangeMax)) {
            messages.push({ level: 'caution', text: 'Ordered rate is outside the typical range for ' + drug.name + '.' });
        }

        if (finalConcentration > drug.maxSafeConcentration) {
            messages.push({ level: 'danger', text: 'Final bag concentration exceeds suggested safety threshold. Re-check protocol and dilution.' });
        }

        if (volumeToAdd > bagVolume * 0.35) {
            messages.push({ level: 'danger', text: 'Large additive volume relative to bag size. Consider concentrated preparation or a larger bag.' });
        }

        if (verificationPercent > 1) {
            messages.push({ level: 'caution', text: 'Back-calculated rate differs from target by more than 1%.' });
        }

        if (drug.lightSensitive) {
            messages.push({ level: 'caution', text: 'This CRI is light sensitive. Use light-protective handling per hospital policy.' });
        }

        if (drug.requiresFilter) {
            messages.push({ level: 'caution', text: 'Inline filter requirement may apply for this infusion.' });
        }

        if (drug.incompatibleWith.length) {
            messages.push({ level: 'caution', text: 'Known compatibility caution: ' + drug.incompatibleWith.join(', ') + '.' });
        }

        setSafety(messages);

        renderResult({
            drugName: drug.name,
            targetUnit: unit,
            bagVolumeMl: bagVolume,
            volumeToAddMl: volumeToAdd,
            fluidToRemoveMl: fluidToRemove,
            finalConcentration: finalConcentration,
            concentrationUnit: baseUnitLabel,
            adminRateMlPerHr: adminRateMlPerHr,
            dripRateDropsPerMin: dripRate,
            backCalculatedRate: backInTargetUnit,
            verificationPercent: verificationPercent,
            totalDrugLabel: format(totalNeeded, 2) + ' ' + baseUnitLabel,
            reference: drug.reference
        });
    }

    function populateDrugs() {
        var select = document.getElementById('cri-drug');
        if (!select) {
            return;
        }

        select.innerHTML = '';
        for (var i = 0; i < CRI_DRUGS.length; i += 1) {
            var drug = CRI_DRUGS[i];
            var option = document.createElement('option');
            option.value = drug.id;
            option.textContent = drug.name;
            select.appendChild(option);
        }
    }

    function applyDrugPreset() {
        var select = document.getElementById('cri-drug');
        if (!select) {
            return;
        }

        var drug = getDrugById(select.value);

        document.getElementById('cri-rate').value = drug.defaultRate;
        document.getElementById('cri-unit').value = drug.rateUnit;
        document.getElementById('cri-concentration').value = drug.stockConcentration;
    }

    function init() {
        var form = document.getElementById('cri-form');
        var drugSelect = document.getElementById('cri-drug');

        if (!form || !drugSelect) {
            return;
        }

        populateDrugs();
        applyDrugPreset();

        form.addEventListener('submit', calculate);
        drugSelect.addEventListener('change', function () {
            applyDrugPreset();
            calculate();
        });
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
