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

    function render(event) {
        if (event) {
            event.preventDefault();
        }

        var species = String(document.getElementById('sbp-species').value || 'dog');
        var weight = toNumber(document.getElementById('sbp-weight').value);
        var lactate = toNumber(document.getElementById('sbp-lactate').value);
        var map = toNumber(document.getElementById('sbp-map').value);

        if (!Number.isFinite(weight) || weight <= 0) {
            setText('sbp-note', 'Enter a valid patient weight.');
            return;
        }

        var isCat = species === 'cat';
        var bolusLowPerKg = isCat ? 5 : 10;
        var bolusHighPerKg = isCat ? 10 : 20;
        var shockLowPerKg = isCat ? 40 : 80;
        var shockHighPerKg = isCat ? 60 : 90;

        var bolusLow = weight * bolusLowPerKg;
        var bolusHigh = weight * bolusHighPerKg;
        var shockLow = weight * shockLowPerKg;
        var shockHigh = weight * shockHighPerKg;

        var reassessWindow = 15;
        var highRiskCount = 0;
        if (Number.isFinite(lactate) && lactate >= 4) {
            highRiskCount += 1;
        }
        if (Number.isFinite(map) && map < 60) {
            highRiskCount += 1;
        }
        if (highRiskCount >= 2) {
            reassessWindow = 10;
        } else if (highRiskCount === 0) {
            reassessWindow = 20;
        }

        setText(
            'sbp-fluid',
            format(bolusLow, 0, '') + ' - ' + format(bolusHigh, 0, ' mL aliquot') +
            ' | Shock ceiling ' + format(shockLow, 0, '') + '-' + format(shockHigh, 0, ' mL total')
        );
        setText('sbp-reassess', reassessWindow + ' min reassessment cycle (per bolus)');

        var perfusionFlags = [];
        if (Number.isFinite(lactate) && lactate >= 4) {
            perfusionFlags.push('Lactate suggests severe perfusion deficit.');
        } else if (Number.isFinite(lactate) && lactate >= 2.5) {
            perfusionFlags.push('Lactate is elevated; trend every 2-4 hours.');
        }
        if (Number.isFinite(map) && map < 60) {
            perfusionFlags.push('MAP is low; vasopressor planning may be needed if fluid response is limited.');
        } else if (Number.isFinite(map) && map < 65) {
            perfusionFlags.push('MAP is borderline; monitor closely during each reassessment cycle.');
        }
        if (!perfusionFlags.length) {
            perfusionFlags.push('Use perfusion trend (mentation, pulse quality, lactate, urine output) to drive next step.');
        }

        setText('sbp-antimicrobials', 'Collect culture/cytology samples if this does not delay treatment, then begin broad-spectrum antimicrobials within the first hour.');
        setText('sbp-source', 'Define likely source early (abdomen, urinary, respiratory, wound, line-related), and plan source control (drainage/debridement/surgery) in parallel.');
        setText('sbp-note', perfusionFlags.join(' '));
    }

    function init() {
        var form = document.getElementById('sbp-form');
        if (!form) {
            return;
        }
        form.addEventListener('submit', render);
        form.addEventListener('input', render);
        form.addEventListener('change', render);
        render();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
