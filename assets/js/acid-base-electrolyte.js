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

    function setText(id, value) {
        var node = document.getElementById(id);
        if (node) {
            node.textContent = value;
        }
    }

    function calculate(event) {
        event.preventDefault();

        var na = toNumber(document.getElementById('ab-na').value);
        var k = toNumber(document.getElementById('ab-k').value);
        var cl = toNumber(document.getElementById('ab-cl').value);
        var hco3 = toNumber(document.getElementById('ab-hco3').value);
        var glucose = toNumber(document.getElementById('ab-glucose').value);
        var bun = toNumber(document.getElementById('ab-bun').value);
        var ca = toNumber(document.getElementById('ab-ca').value);
        var albumin = toNumber(document.getElementById('ab-albumin').value);

        var anionGap = Number.isFinite(na) && Number.isFinite(k) && Number.isFinite(cl) && Number.isFinite(hco3)
            ? (na + k) - (cl + hco3)
            : NaN;

        var correctedNa = Number.isFinite(na) && Number.isFinite(glucose)
            ? na + Math.max(0, ((glucose - 100) / 100) * 1.6)
            : NaN;

        var correctedCa = Number.isFinite(ca) && Number.isFinite(albumin)
            ? ca + (0.8 * (3.5 - albumin))
            : NaN;

        var osmolality = Number.isFinite(na) && Number.isFinite(k) && Number.isFinite(glucose) && Number.isFinite(bun)
            ? (2 * (na + k)) + (glucose / 18) + (bun / 2.8)
            : NaN;

        setText('ab-gap', format(anionGap, 1));
        setText('ab-cna', format(correctedNa, 1) + (Number.isFinite(correctedNa) ? ' mEq/L' : ''));
        setText('ab-cca', format(correctedCa, 1) + (Number.isFinite(correctedCa) ? ' mg/dL' : ''));
        setText('ab-osm', format(osmolality, 1) + (Number.isFinite(osmolality) ? ' mOsm/kg' : ''));

        var notes = [];
        if (Number.isFinite(anionGap)) {
            if (anionGap > 20) {
                notes.push('High anion gap pattern.');
            } else if (anionGap < 12) {
                notes.push('Low/normal anion gap pattern.');
            } else {
                notes.push('Anion gap within common reference range.');
            }
        }

        if (Number.isFinite(correctedNa) && Number.isFinite(na) && Math.abs(correctedNa - na) >= 2) {
            notes.push('Sodium shifts after glucose correction are clinically relevant.');
        }

        if (Number.isFinite(osmolality) && osmolality > 320) {
            notes.push('Marked hyperosmolar state estimate.');
        }

        setText('ab-note', notes.length ? notes.join(' ') : 'Provide full chemistry/electrolyte panel for interpretation support.');
    }

    function init() {
        var form = document.getElementById('ab-form');
        if (!form) {
            return;
        }

        form.addEventListener('submit', calculate);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
