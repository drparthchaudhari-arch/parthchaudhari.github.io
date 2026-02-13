(function () {
    'use strict';

    var DRUGS = [
        {
            use: 'CPR',
            drug: 'Epinephrine (low dose)',
            dose: '0.01 mg/kg',
            doseValue: 0.01,
            unit: 'mg/kg',
            concentration: 0.1,
            concentrationUnit: 'mg/mL',
            route: 'IV/IO'
        },
        {
            use: 'Anaphylaxis',
            drug: 'Epinephrine',
            dose: '0.01 mg/kg',
            doseValue: 0.01,
            unit: 'mg/kg',
            concentration: 1,
            concentrationUnit: 'mg/mL',
            route: 'IM'
        },
        {
            use: 'Bradycardia',
            drug: 'Atropine',
            dose: '0.02-0.04 mg/kg',
            doseValue: 0.03,
            unit: 'mg/kg',
            concentration: 0.54,
            concentrationUnit: 'mg/mL',
            route: 'IV/IM'
        },
        {
            use: 'Hyperkalemia',
            drug: 'Calcium gluconate 10%',
            dose: '100 mg/kg',
            doseValue: 100,
            unit: 'mg/kg',
            concentration: 100,
            concentrationUnit: 'mg/mL',
            route: 'Slow IV'
        },
        {
            use: 'Hyperkalemia',
            drug: 'Regular insulin',
            dose: '0.1 U/kg',
            doseValue: 0.1,
            unit: 'U/kg',
            concentration: 100,
            concentrationUnit: 'U/mL',
            route: 'IV'
        },
        {
            use: 'Hypoglycemia',
            drug: 'Dextrose 50% (dilute)',
            dose: '1 mL/kg',
            doseValue: 1,
            unit: 'mL/kg',
            concentration: null,
            concentrationUnit: '',
            route: 'IV'
        },
        {
            use: 'Seizure control',
            drug: 'Diazepam',
            dose: '0.5 mg/kg',
            doseValue: 0.5,
            unit: 'mg/kg',
            concentration: 5,
            concentrationUnit: 'mg/mL',
            route: 'IV/IN'
        },
        {
            use: 'Seizure control',
            drug: 'Midazolam',
            dose: '0.2 mg/kg',
            doseValue: 0.2,
            unit: 'mg/kg',
            concentration: 5,
            concentrationUnit: 'mg/mL',
            route: 'IV/IM/IN'
        },
        {
            use: 'Status epilepticus',
            drug: 'Levetiracetam',
            dose: '60 mg/kg',
            doseValue: 60,
            unit: 'mg/kg',
            concentration: 100,
            concentrationUnit: 'mg/mL',
            route: 'IV loading'
        },
        {
            use: 'Anaphylaxis adjunct',
            drug: 'Diphenhydramine',
            dose: '2 mg/kg',
            doseValue: 2,
            unit: 'mg/kg',
            concentration: 50,
            concentrationUnit: 'mg/mL',
            route: 'IM/IV'
        }
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

    function calculateDose(weight, item) {
        if (item.unit === 'mg/kg') {
            return weight * item.doseValue;
        }

        if (item.unit === 'U/kg') {
            return weight * item.doseValue;
        }

        if (item.unit === 'mL/kg') {
            return weight * item.doseValue;
        }

        return NaN;
    }

    function calculateVolume(doseValue, item) {
        if (!Number.isFinite(doseValue)) {
            return NaN;
        }

        if (!item.concentration || !item.concentrationUnit) {
            if (item.unit === 'mL/kg') {
                return doseValue;
            }
            return NaN;
        }

        return doseValue / item.concentration;
    }

    function renderChart(weight, species) {
        var tbody = document.getElementById('er-drug-rows');
        var note = document.getElementById('er-drug-note');

        if (!tbody || !note) {
            return;
        }

        if (!Number.isFinite(weight) || weight <= 0) {
            tbody.innerHTML = '';
            note.textContent = 'Enter weight and update to render doses.';
            return;
        }

        var rows = [];
        for (var i = 0; i < DRUGS.length; i += 1) {
            var item = DRUGS[i];
            var doseValue = calculateDose(weight, item);
            var volumeValue = calculateVolume(doseValue, item);

            var doseSuffix = item.unit.indexOf('mg') === 0 ? ' mg' : item.unit.indexOf('U') === 0 ? ' U' : ' mL';
            var calculatedDose = format(doseValue, 2) + doseSuffix;
            var calculatedVolume = Number.isFinite(volumeValue)
                ? format(volumeValue, 2) + ' mL'
                : '-';

            rows.push(
                '<tr>' +
                    '<td>' + item.use + '</td>' +
                    '<td>' + item.drug + '</td>' +
                    '<td>' + item.dose + '</td>' +
                    '<td>' + calculatedDose + '</td>' +
                    '<td>' + calculatedVolume + '</td>' +
                    '<td>' + item.route + '</td>' +
                '</tr>'
            );
        }

        tbody.innerHTML = rows.join('');
        note.textContent = 'Dose estimates generated for a ' + format(weight, 1) + ' kg ' + species + '. Re-check concentrations before administration.';
    }

    function init() {
        var form = document.getElementById('er-dose-form');
        var weightInput = document.getElementById('er-weight');
        var speciesSelect = document.getElementById('er-species');

        if (!form || !weightInput || !speciesSelect) {
            return;
        }

        form.addEventListener('submit', function (event) {
            event.preventDefault();
            renderChart(toNumber(weightInput.value), String(speciesSelect.value || 'dog'));
        });

        weightInput.addEventListener('input', function () {
            renderChart(toNumber(weightInput.value), String(speciesSelect.value || 'dog'));
        });

        speciesSelect.addEventListener('change', function () {
            renderChart(toNumber(weightInput.value), String(speciesSelect.value || 'dog'));
        });

        renderChart(NaN, 'dog');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
