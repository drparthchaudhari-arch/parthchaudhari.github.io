(function () {
    'use strict';

    var COMPONENTS = {
        prbc: {
            label: 'Packed RBC',
            doseRange: '10-20 mL/kg',
            startRate: '1 mL/kg/hr for first 15 min, then 5-10 mL/kg/hr as tolerated',
            guidance: 'Primary for anemia and oxygen-carrying support.',
            minMlKg: 10,
            maxMlKg: 20,
            startMlKgHr: 1,
            maxMlKgHr: 10
        },
        ffp: {
            label: 'Fresh Frozen Plasma',
            doseRange: '10-20 mL/kg',
            startRate: '0.5-1 mL/kg/hr for first 15 min, then up to 5-10 mL/kg/hr',
            guidance: 'For coagulopathy and selected protein deficits.',
            minMlKg: 10,
            maxMlKg: 20,
            startMlKgHr: 1,
            maxMlKgHr: 10
        },
        platelet: {
            label: 'Platelet-rich product',
            doseRange: '10 mL/kg',
            startRate: 'As tolerated',
            guidance: 'For severe thrombocytopenia or active bleeding.',
            minMlKg: 8,
            maxMlKg: 12,
            startMlKgHr: 1,
            maxMlKgHr: 8
        },
        cryo: {
            label: 'Cryoprecipitate',
            doseRange: '1 unit / 10-15 kg',
            startRate: '1-5 mL/kg/hr',
            guidance: 'Targeted fibrinogen/vWF replacement.',
            minMlKg: null,
            maxMlKg: null,
            startMlKgHr: 1,
            maxMlKgHr: 5
        }
    };

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
        var node = document.getElementById('tx-alert');
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

    function calculate(event) {
        if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
        }

        var species = String(document.getElementById('tx-species').value || 'dog');
        var component = String(document.getElementById('tx-component').value || 'prbc');
        var weight = toNumber(document.getElementById('tx-weight').value);
        var current = toNumber(document.getElementById('tx-current').value);
        var target = toNumber(document.getElementById('tx-target').value);
        var donor = toNumber(document.getElementById('tx-donor').value);
        var plannedVolumeInput = toNumber(document.getElementById('tx-planned').value);
        var previousTransfusion = document.getElementById('tx-prev').checked;
        var crossmatchDone = document.getElementById('tx-crossmatch').checked;

        if (!Number.isFinite(weight) || weight <= 0 || !Number.isFinite(current) || !Number.isFinite(target) || !Number.isFinite(donor) || donor <= 0) {
            setAlert('Enter valid weight and PCV values.', 'danger');
            setText('tx-note', 'Input validation failed.');
            return;
        }

        var bloodVolumeFactor = species === 'cat' ? 60 : 90;
        var totalBloodVolume = bloodVolumeFactor * weight;

        var pcvDeficit = target - current;
        var volumeNeeded = Number.isFinite(pcvDeficit) && pcvDeficit > 0
            ? (pcvDeficit * totalBloodVolume) / donor
            : NaN;

        var plannedVolume = Number.isFinite(plannedVolumeInput) && plannedVolumeInput > 0
            ? plannedVolumeInput
            : volumeNeeded;

        var expectedRise = Number.isFinite(plannedVolume)
            ? (donor * plannedVolume) / totalBloodVolume
            : NaN;

        var componentData = COMPONENTS[component] || COMPONENTS.prbc;
        var initialRate = weight * componentData.startMlKgHr;
        var maxRate = weight * componentData.maxMlKgHr;
        var maintenanceRate = Number.isFinite(plannedVolume) ? Math.min(plannedVolume / 4, maxRate) : NaN;
        var maintenanceLabel = Number.isFinite(maintenanceRate)
            ? format(maintenanceRate, 1) + ' mL/hr (capped at ' + format(maxRate, 1) + ' mL/hr)'
            : '-';

        setText('tx-volume', format(volumeNeeded, 1, ' mL'));
        setText('tx-rise', format(expectedRise, 1, '%'));
        setText('tx-initial', format(initialRate, 1, ' mL/hr'));
        setText('tx-maint', maintenanceLabel);

        setText('tx-component-dose', componentData.doseRange);

        var compatText = 'No prior transfusion flagged.';
        var alertMessage = '';
        var alertLevel = '';

        if (previousTransfusion && !crossmatchDone) {
            compatText = 'Crossmatch required before transfusion.';
            alertMessage = 'Previous transfusion history detected without crossmatch. Stop and perform compatibility testing.';
            alertLevel = 'danger';
        } else if (previousTransfusion && crossmatchDone) {
            compatText = 'Crossmatch documented.';
            alertMessage = 'Crossmatch confirmed. Continue with close reaction monitoring.';
            alertLevel = 'caution';
        }

        setText('tx-compat', compatText);

        if (!alertMessage && (!Number.isFinite(volumeNeeded) || volumeNeeded <= 0)) {
            alertMessage = 'Target PCV is not above current PCV. Volume-needed equation requires positive PCV deficit.';
            alertLevel = 'caution';
        }

        if (Number.isFinite(plannedVolume) && componentData.maxMlKg && plannedVolume > componentData.maxMlKg * weight) {
            alertMessage = 'Planned volume exceeds typical ' + componentData.label + ' range (' + componentData.doseRange + '). Re-check endpoint and component choice.';
            alertLevel = 'caution';
        }

        if (Number.isFinite(expectedRise) && expectedRise > 15) {
            alertMessage = 'Large predicted PCV rise. Consider staged transfusion and recheck PCV before completing full volume.';
            alertLevel = 'caution';
        }

        setAlert(alertMessage, alertLevel);

        var note = componentData.label + ': ' + componentData.guidance + ' Suggested start rate ' + componentData.startRate + '. ';
        if (Number.isFinite(plannedVolume) && plannedVolume > 0) {
            note += 'Planned volume ' + format(plannedVolume, 1) + ' mL with expected PCV rise about ' + format(expectedRise, 1) + '%. ';
        }
        note += 'Recheck perfusion and post-transfusion PCV/TS as clinically indicated.';
        setText('tx-note', note);
    }

    function init() {
        var form = document.getElementById('transfusion-form');
        if (!form) {
            return;
        }

        form.addEventListener('submit', calculate);
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
