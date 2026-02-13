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

    function calculate(event) {
        event.preventDefault();

        var species = String(document.getElementById('tx-species').value || 'dog');
        var weight = toNumber(document.getElementById('tx-weight').value);
        var current = toNumber(document.getElementById('tx-current').value);
        var target = toNumber(document.getElementById('tx-target').value);
        var donor = toNumber(document.getElementById('tx-donor').value);

        if (!Number.isFinite(weight) || weight <= 0 || !Number.isFinite(current) || !Number.isFinite(target) || !Number.isFinite(donor) || donor <= 0) {
            setText('tx-note', 'Enter valid weight and PCV values.');
            return;
        }

        if (target <= current) {
            setText('tx-note', 'Target PCV should be higher than current PCV for this calculation.');
            return;
        }

        var bloodVolumeFactor = species === 'cat' ? 60 : 90;
        var totalMl = bloodVolumeFactor * weight * ((target - current) / donor);
        var initialRate = weight * 0.5;
        var maintenanceRate = totalMl / 4;

        setText('tx-volume', format(totalMl, 1, ' mL'));
        setText('tx-initial', format(initialRate, 1, ' mL/hr'));
        setText('tx-maint', format(maintenanceRate, 1, ' mL/hr'));
        setText('tx-note', 'Estimate for ' + species + ' (' + weight.toFixed(1) + ' kg). Reassess PCV and perfusion after transfusion.');
    }

    function init() {
        var form = document.getElementById('transfusion-form');
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
