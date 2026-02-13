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

    function getAdditiveBand(currentK) {
        if (currentK < 2.5) {
            return { low: 60, high: 80 };
        }
        if (currentK < 3) {
            return { low: 40, high: 60 };
        }
        if (currentK < 3.5) {
            return { low: 20, high: 40 };
        }
        return { low: 10, high: 20 };
    }

    function render(event) {
        if (event) {
            event.preventDefault();
        }

        var weight = toNumber(document.getElementById('erp-weight').value);
        var currentK = toNumber(document.getElementById('erp-current-k').value);
        var targetK = toNumber(document.getElementById('erp-target-k').value);
        var fluidRate = toNumber(document.getElementById('erp-fluid-rate').value);

        if (!Number.isFinite(weight) || weight <= 0 ||
            !Number.isFinite(currentK) || !Number.isFinite(targetK) ||
            !Number.isFinite(fluidRate) || fluidRate <= 0) {
            setText('erp-note', 'Enter valid weight, potassium values, and fluid rate.');
            return;
        }

        var deficit = targetK - currentK;
        if (deficit <= 0) {
            setText('erp-deficit', format(0, 2, ' mEq/L gap'));
            setText('erp-additive', '0 mEq/L (no active supplementation)');
            setText('erp-hourly', format(0, 2, ' mEq/hr delivered'));
            setText('erp-note', 'Current potassium is at or above the selected target. Recheck trend and avoid unnecessary potassium supplementation.');
            return;
        }

        var band = getAdditiveBand(currentK);
        var midpoint = (band.low + band.high) / 2;
        var maxSafe = 0.5 * weight;
        var maxAdditiveByRate = (maxSafe * 1000) / fluidRate;

        var effectiveLow = Math.min(band.low, maxAdditiveByRate);
        var effectiveHigh = Math.min(band.high, maxAdditiveByRate);
        var suggestedAdditive = Math.min(midpoint, maxAdditiveByRate);
        var hourlyLoad = (suggestedAdditive / 1000) * fluidRate;
        var kclMlPerHour = hourlyLoad / 2;
        var hourlyLabel = format(hourlyLoad, 2) + ' mEq/hr (~' + format(kclMlPerHour, 2) + ' mL/hr of 2 mEq/mL KCl)';

        setText('erp-deficit', format(deficit, 2, ' mEq/L gap'));
        setText('erp-additive', format(effectiveLow, 0, '') + '-' + format(effectiveHigh, 0, ' mEq/L in fluids'));
        setText('erp-hourly', hourlyLabel);

        var note = 'Check serum potassium every 2-4 hours during active correction.';
        if (maxAdditiveByRate < band.low) {
            note += ' Infusion-rate safety cap limits additive below the usual band; consider lowering fluid rate, central-line protocol, or staged correction.';
        } else {
            note += ' Suggested mid-band target is ' + format(suggestedAdditive, 0, ' mEq/L with max safe ceiling ' + format(maxAdditiveByRate, 0, ' mEq/L at current fluid rate.'));
        }
        setText('erp-note', note);
    }

    function init() {
        var form = document.getElementById('erp-form');
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
