(function () {
    'use strict';

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

    function setAlert(message, level) {
        var node = document.getElementById('gc-alert');
        if (!node) {
            return;
        }

        if (!message) {
            node.hidden = true;
            node.textContent = '';
            node.className = 'pc-calculator-warning';
            return;
        }

        node.hidden = false;
        node.textContent = message;
        node.className = 'pc-calculator-warning';
        if (level === 'danger') {
            node.classList.add('pc-calculator-warning--danger');
        } else if (level === 'caution') {
            node.classList.add('pc-calculator-warning--caution');
        }
    }

    function parseSeries(input) {
        var raw = String(input || '').split(',');
        var output = [];
        for (var i = 0; i < raw.length; i += 1) {
            var value = toNumber(raw[i].trim());
            if (!Number.isFinite(value)) {
                return null;
            }
            output.push(value);
        }
        return output;
    }

    function getInterpretation(min, max, range) {
        if (min < 80) {
            return {
                grade: 'High Risk (Hypoglycemia)',
                note: 'Nadir is below 80 mg/dL. Consider reducing insulin dose by 10-25% and reassess soon.',
                alert: { level: 'danger', text: 'Potential hypoglycemia/Somogyi pattern.' }
            };
        }

        if (max > 400) {
            return {
                grade: 'Poor Control',
                note: 'Peak glucose remains high. Review insulin handling, dose timing, injection technique, and concurrent disease.',
                alert: { level: 'caution', text: 'Persistent hyperglycemia detected.' }
            };
        }

        if (range < 100) {
            return {
                grade: 'Too Flat',
                note: 'Limited curve excursion. Verify sampling consistency and insulin action window.',
                alert: { level: 'caution', text: 'Curve variation is low.' }
            };
        }

        return {
            grade: 'Acceptable Control',
            note: 'Curve shape is generally acceptable. Continue monitoring trend and clinical signs.',
            alert: null
        };
    }

    function renderTable(timePoints, values) {
        var tbody = document.getElementById('gc-table-body');
        if (!tbody) {
            return;
        }

        var rows = [];
        for (var i = 0; i < values.length; i += 1) {
            var status = 'Within target (100-250 mg/dL)';
            if (values[i] < 100) {
                status = 'Below target';
            } else if (values[i] > 250) {
                status = 'Above target';
            }

            rows.push(
                '<tr>' +
                    '<td>' + format(timePoints[i], 1) + '</td>' +
                    '<td>' + format(values[i], 0) + '</td>' +
                    '<td>' + status + '</td>' +
                '</tr>'
            );
        }

        tbody.innerHTML = rows.join('');
    }

    function generate(event) {
        if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
        }

        var insulinType = String(document.getElementById('gc-insulin-type').value || 'other');
        var insulinDose = toNumber(document.getElementById('gc-insulin-dose').value);
        var timePoints = parseSeries(document.getElementById('gc-timepoints').value);
        var values = parseSeries(document.getElementById('gc-values').value);

        if (!timePoints || !values || timePoints.length !== values.length || timePoints.length < 3) {
            setAlert('Provide matching comma-separated time and glucose lists with at least 3 points.', 'danger');
            setText('gc-note', 'Input validation failed.');
            return;
        }

        for (var i = 1; i < timePoints.length; i += 1) {
            if (timePoints[i] <= timePoints[i - 1]) {
                setAlert('Time points must be strictly increasing.', 'danger');
                setText('gc-note', 'Input validation failed.');
                return;
            }
        }

        var max = Math.max.apply(null, values);
        var min = Math.min.apply(null, values);
        var range = max - min;
        var sum = 0;
        for (var j = 0; j < values.length; j += 1) {
            sum += values[j];
        }
        var avg = sum / values.length;
        var nadirIndex = values.indexOf(min);
        var nadirTime = timePoints[nadirIndex];

        var interp = getInterpretation(min, max, range);

        setText('gc-max', format(max, 0, ' mg/dL'));
        setText('gc-min', format(min, 0, ' mg/dL'));
        setText('gc-avg', format(avg, 1, ' mg/dL'));
        setText('gc-range', format(range, 0, ' mg/dL'));
        setText('gc-nadir-time', format(nadirTime, 1, ' h'));
        setText('gc-grade', interp.grade);

        var doseText = Number.isFinite(insulinDose) && insulinDose > 0
            ? ' Current dose: ' + format(insulinDose, 2) + ' U/kg.'
            : '';
        var note = 'Insulin: ' + insulinType + '. ' + interp.note + doseText;

        setText('gc-note', note);
        setAlert(interp.alert ? interp.alert.text : '', interp.alert ? interp.alert.level : '');

        renderTable(timePoints, values);
    }

    function init() {
        var form = document.getElementById('gc-form');
        if (!form) {
            return;
        }

        form.addEventListener('submit', generate);
        form.addEventListener('change', generate);
        generate();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
