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
            dose: '0.2 U/kg (+ dextrose 1-2 g per U insulin)',
            doseValue: 0.2,
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

    var state = {
        customConcentrations: {},
        lastWeight: NaN,
        lastSpecies: 'dog'
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

    function formatForInput(value) {
        if (!Number.isFinite(value)) {
            return '';
        }
        return String(value).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
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

    function getDoseSuffix(unit) {
        if (unit.indexOf('mg') === 0) {
            return ' mg';
        }
        if (unit.indexOf('U') === 0) {
            return ' U';
        }
        return ' mL';
    }

    function getDefaultConcentration(item) {
        if (!Number.isFinite(item.concentration) || item.concentration <= 0) {
            return NaN;
        }
        return item.concentration;
    }

    function getActiveConcentration(item, index) {
        var custom = state.customConcentrations[index];
        if (Number.isFinite(custom) && custom > 0) {
            return custom;
        }
        return getDefaultConcentration(item);
    }

    function calculateVolume(doseValue, item, concentrationValue) {
        if (!Number.isFinite(doseValue)) {
            return NaN;
        }

        if (item.unit === 'mL/kg') {
            return doseValue;
        }

        if (!Number.isFinite(concentrationValue) || concentrationValue <= 0) {
            return NaN;
        }

        return doseValue / concentrationValue;
    }

    function countOverrides() {
        var count = 0;
        for (var key in state.customConcentrations) {
            if (Object.prototype.hasOwnProperty.call(state.customConcentrations, key)) {
                count += 1;
            }
        }
        return count;
    }

    function buildConcentrationCell(item, index) {
        if (item.unit === 'mL/kg' || !item.concentrationUnit) {
            return '<span class="pc-er-concentration-na">N/A (volume-based)</span>';
        }

        var defaultConcentration = getDefaultConcentration(item);
        var activeConcentration = getActiveConcentration(item, index);
        var defaultLabel = Number.isFinite(defaultConcentration)
            ? formatForInput(defaultConcentration) + ' ' + item.concentrationUnit
            : '-';

        return '' +
            '<label class="pc-er-concentration-control">' +
                '<input type="number" class="pc-input pc-er-concentration-input" data-er-index="' + index + '" min="0.001" step="any" value="' + formatForInput(activeConcentration) + '">' +
                '<span class="pc-er-concentration-unit">' + escapeHtml(item.concentrationUnit) + '</span>' +
            '</label>' +
            '<small class="pc-er-default">default ' + escapeHtml(defaultLabel) + '</small>';
    }

    function renderChart(weight, species) {
        var tbody = document.getElementById('er-drug-rows');
        var note = document.getElementById('er-drug-note');

        if (!tbody || !note) {
            return;
        }

        state.lastWeight = weight;
        state.lastSpecies = species;

        if (!Number.isFinite(weight) || weight <= 0) {
            tbody.innerHTML = '';
            note.textContent = 'Enter weight and update to render doses.';
            return;
        }

        var rows = [];
        for (var i = 0; i < DRUGS.length; i += 1) {
            var item = DRUGS[i];
            var doseValue = calculateDose(weight, item);
            var concentrationValue = getActiveConcentration(item, i);
            var volumeValue = calculateVolume(doseValue, item, concentrationValue);

            var doseSuffix = getDoseSuffix(item.unit);
            var calculatedDose = format(doseValue, 2) + doseSuffix;
            var calculatedVolume = Number.isFinite(volumeValue)
                ? format(volumeValue, 2) + ' mL'
                : '-';

            rows.push(
                '<tr>' +
                    '<td>' + item.use + '</td>' +
                    '<td>' + item.drug + '</td>' +
                    '<td>' + item.dose + '</td>' +
                    '<td>' + buildConcentrationCell(item, i) + '</td>' +
                    '<td>' + calculatedDose + '</td>' +
                    '<td>' + calculatedVolume + '</td>' +
                    '<td>' + item.route + '</td>' +
                '</tr>'
            );
        }

        tbody.innerHTML = rows.join('');
        var overrideCount = countOverrides();
        var overrideText = overrideCount
            ? ' Includes ' + overrideCount + ' custom concentration override' + (overrideCount === 1 ? '' : 's') + '.'
            : '';
        note.textContent = 'Dose estimates generated for a ' + format(weight, 1) + ' kg ' + species + '. Re-check concentrations before administration.' + overrideText;
    }

    function updateConcentration(index, rawValue) {
        if (!Number.isInteger(index) || index < 0 || index >= DRUGS.length) {
            return;
        }

        var item = DRUGS[index];
        if (item.unit === 'mL/kg' || !item.concentrationUnit) {
            return;
        }

        var value = toNumber(rawValue);
        var defaultConcentration = getDefaultConcentration(item);

        if (Number.isFinite(value) && value > 0) {
            if (Number.isFinite(defaultConcentration) && Math.abs(value - defaultConcentration) < 0.000001) {
                delete state.customConcentrations[index];
            } else {
                state.customConcentrations[index] = value;
            }
            return;
        }

        delete state.customConcentrations[index];
    }

    function resetConcentrations() {
        state.customConcentrations = {};
        renderChart(state.lastWeight, state.lastSpecies);
    }

    function buildPrintableRows(weight) {
        var rows = [];

        for (var i = 0; i < DRUGS.length; i += 1) {
            var item = DRUGS[i];
            var doseValue = calculateDose(weight, item);
            var concentrationValue = getActiveConcentration(item, i);
            var volumeValue = calculateVolume(doseValue, item, concentrationValue);
            var concentrationText = (item.unit === 'mL/kg' || !item.concentrationUnit)
                ? 'N/A (volume-based)'
                : formatForInput(concentrationValue) + ' ' + item.concentrationUnit;

            rows.push(
                '<tr>' +
                    '<td>' + escapeHtml(item.use) + '</td>' +
                    '<td>' + escapeHtml(item.drug) + '</td>' +
                    '<td>' + escapeHtml(item.dose) + '</td>' +
                    '<td>' + escapeHtml(concentrationText) + '</td>' +
                    '<td>' + escapeHtml(format(doseValue, 2) + getDoseSuffix(item.unit)) + '</td>' +
                    '<td>' + escapeHtml(Number.isFinite(volumeValue) ? (format(volumeValue, 2) + ' mL') : '-') + '</td>' +
                    '<td>' + escapeHtml(item.route) + '</td>' +
                '</tr>'
            );
        }

        return rows.join('');
    }

    function printChart() {
        var note = document.getElementById('er-drug-note');

        if (!Number.isFinite(state.lastWeight) || state.lastWeight <= 0) {
            if (note) {
                note.textContent = 'Enter a valid weight first, then print the chart.';
            }
            return;
        }

        var popup = window.open('', '_blank', 'width=1200,height=800');
        if (!popup) {
            if (note) {
                note.textContent = 'Popup blocked. Allow popups to print the chart.';
            }
            return;
        }

        var generatedAt = new Date().toLocaleString();
        var tableRows = buildPrintableRows(state.lastWeight);

        var documentHtml = '' +
            '<!DOCTYPE html>' +
            '<html lang="en">' +
            '<head>' +
                '<meta charset="UTF-8">' +
                '<title>Emergency Drug Dose Chart</title>' +
                '<style>' +
                    'body{font-family:Arial,sans-serif;color:#111827;margin:24px;}' +
                    'h1{margin:0 0 10px 0;font-size:24px;}' +
                    'p{margin:6px 0 0 0;font-size:14px;}' +
                    'table{width:100%;border-collapse:collapse;margin-top:16px;}' +
                    'th,td{border:1px solid #d1d5db;padding:8px;text-align:left;font-size:12px;vertical-align:top;}' +
                    'th{background:#f3f4f6;font-weight:700;}' +
                    '.footer{margin-top:12px;color:#4b5563;font-size:12px;}' +
                '</style>' +
            '</head>' +
            '<body>' +
                '<h1>Emergency Drug Dose Chart</h1>' +
                '<p><strong>Patient:</strong> ' + escapeHtml(format(state.lastWeight, 1) + ' kg ' + state.lastSpecies) + '</p>' +
                '<p><strong>Generated:</strong> ' + escapeHtml(generatedAt) + '</p>' +
                '<table>' +
                    '<thead>' +
                        '<tr>' +
                            '<th>Use Case</th>' +
                            '<th>Drug</th>' +
                            '<th>Standard Dose</th>' +
                            '<th>Concentration</th>' +
                            '<th>Calculated Dose</th>' +
                            '<th>Approx Volume</th>' +
                            '<th>Route</th>' +
                        '</tr>' +
                    '</thead>' +
                    '<tbody>' + tableRows + '</tbody>' +
                '</table>' +
                '<p class="footer">Educational use only. Verify all doses, concentrations, routes, and patient-specific contraindications before administration.</p>' +
            '</body>' +
            '</html>';

        popup.document.open();
        popup.document.write(documentHtml);
        popup.document.close();
        popup.focus();
        popup.print();
    }

    function init() {
        var form = document.getElementById('er-dose-form');
        var weightInput = document.getElementById('er-weight');
        var speciesSelect = document.getElementById('er-species');
        var printButton = document.getElementById('er-print');
        var resetButton = document.getElementById('er-reset-concentration');
        var tableBody = document.getElementById('er-drug-rows');

        if (!form || !weightInput || !speciesSelect || !tableBody || !printButton || !resetButton) {
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

        tableBody.addEventListener('change', function (event) {
            var target = event.target;
            if (!target || !target.classList || !target.classList.contains('pc-er-concentration-input')) {
                return;
            }

            var index = Number(target.getAttribute('data-er-index'));
            updateConcentration(index, target.value);
            renderChart(state.lastWeight, state.lastSpecies);
        });

        printButton.addEventListener('click', printChart);
        resetButton.addEventListener('click', resetConcentrations);

        renderChart(NaN, 'dog');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
