(function () {
    'use strict';

    var drugsData = [];

    function byId(id) {
        return document.getElementById(id);
    }

    function parseConcentration(value) {
        var match = String(value || '').match(/([0-9]*\.?[0-9]+)/);
        if (!match) {
            return NaN;
        }
        var parsed = Number(match[1]);
        return Number.isFinite(parsed) ? parsed : NaN;
    }

    function getDoseFrequencyMultiplier(frequency) {
        var text = String(frequency || '').toUpperCase();
        if (text.indexOf('Q4H') !== -1 || text.indexOf('QID') !== -1) {
            return 4;
        }
        if (text.indexOf('Q6H') !== -1) {
            return 4;
        }
        if (text.indexOf('TID') !== -1 || text.indexOf('Q8H') !== -1) {
            return 3;
        }
        if (text.indexOf('Q12H') !== -1) {
            return 2;
        }
        if (text.indexOf('BID') !== -1) {
            return 2;
        }
        if (text.indexOf('QOD') !== -1) {
            return 0.5;
        }
        return 1;
    }

    function setResults(mg, ml, total, warning) {
        var mgNode = byId('result-mg');
        var mlNode = byId('result-ml');
        var totalNode = byId('result-total');
        var warningNode = byId('result-warning');

        if (mgNode) {
            mgNode.textContent = mg;
        }
        if (mlNode) {
            mlNode.textContent = ml;
        }
        if (totalNode) {
            totalNode.textContent = total;
        }
        if (warningNode) {
            warningNode.textContent = warning || '';
            warningNode.classList.remove('pc-calculator-warning--danger');
            if (warning) {
                warningNode.classList.add('pc-calculator-warning--danger');
            }
        }
    }

    function setFormMessage(message, isError) {
        var node = byId('dose-form-message');
        if (!node) {
            return;
        }
        node.textContent = message || '';
        node.classList.remove('pc-is-error');
        node.classList.remove('pc-is-success');
        if (message) {
            node.classList.add(isError ? 'pc-is-error' : 'pc-is-success');
        }
    }

    function setFieldInvalid(field, message) {
        if (!field) {
            return;
        }
        field.setAttribute('aria-invalid', message ? 'true' : 'false');
    }

    function validateRequiredFields(fields) {
        var firstInvalid = null;
        for (var i = 0; i < fields.length; i += 1) {
            var field = fields[i];
            var invalid = !field || !String(field.value || '').trim();
            setFieldInvalid(field, invalid);
            if (invalid && !firstInvalid) {
                firstInvalid = field;
            }
        }
        return firstInvalid;
    }

    function renderConcentrationOptions(drug) {
        var list = byId('dose-concentration-list');
        var hint = byId('concentration-hint');

        if (!list) {
            return;
        }

        list.innerHTML = '';

        if (!drug || !Array.isArray(drug.concentrations) || !drug.concentrations.length) {
            if (hint) {
                hint.textContent = 'No preset concentrations for this drug. Enter concentration manually.';
            }
            return;
        }

        for (var i = 0; i < drug.concentrations.length; i += 1) {
            var option = document.createElement('option');
            option.value = String(drug.concentrations[i]);
            list.appendChild(option);
        }

        if (hint) {
            var categoryLabel = drug.category ? ('Category: ' + drug.category + '. ') : '';
            var doseLabel = Number.isFinite(Number(drug.dose_mg_kg))
                ? ('Standard dose: ' + Number(drug.dose_mg_kg) + ' mg/kg')
                : 'Standard dose unavailable';
            var frequencyLabel = drug.frequency ? (' (' + drug.frequency + ')') : '';
            hint.textContent = categoryLabel + doseLabel + frequencyLabel + '. Available concentrations: ' + drug.concentrations.join(', ') + '.';
        }
    }

    async function loadDrugs() {
        try {
            var response = await fetch('/content/drugs.json', { cache: 'no-store' });
            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }

            var data = await response.json();
            drugsData = Array.isArray(data) ? data : [];
            drugsData.sort(function (left, right) {
                var leftCategory = String(left && left.category || '').toLowerCase();
                var rightCategory = String(right && right.category || '').toLowerCase();
                if (leftCategory !== rightCategory) {
                    return leftCategory.localeCompare(rightCategory);
                }
                return String(left && left.name || '').localeCompare(String(right && right.name || ''));
            });

            var select = byId('drug-select');
            if (!select) {
                return;
            }

            select.innerHTML = '<option value="">Select drug...</option>' +
                drugsData.map(function (drug) {
                    var categoryLabel = drug.category ? (' - ' + drug.category) : '';
                    return '<option value="' + drug.name + '">' + drug.name + categoryLabel + '</option>';
                }).join('');

            if (drugsData.length) {
                select.value = drugsData[0].name;
                updateConcentrations();
            }
        } catch (error) {
            console.error('Failed to load drugs:', error);
            var selectNode = byId('drug-select');
            if (selectNode) {
                selectNode.innerHTML = '<option value="">Unable to load drugs</option>';
            }
        }
    }

    function updateConcentrations() {
        var drugName = byId('drug-select') ? byId('drug-select').value : '';
        var concentrationInput = byId('concentration');
        var referenceHint = byId('drug-reference-hint');
        var drug = drugsData.find(function (item) {
            return item.name === drugName;
        });

        renderConcentrationOptions(drug);

        if (referenceHint) {
            if (drug && drug.reference) {
                referenceHint.textContent = 'Reference baseline: ' + drug.reference + '.';
            } else if (drug) {
                referenceHint.textContent = 'Reference baseline: DailyMed + Merck Vet Manual + approved site reference map.';
            } else {
                referenceHint.textContent = 'Choose a drug to see reference context.';
            }
        }

        if (!drug || !Array.isArray(drug.concentrations) || !drug.concentrations.length || !concentrationInput) {
            return;
        }

        var defaultConcentration = parseConcentration(drug.concentrations[0]);
        if (Number.isFinite(defaultConcentration)) {
            concentrationInput.value = String(defaultConcentration);
        }
    }

    function calculateDose(event) {
        if (event) {
            event.preventDefault();
        }

        var species = byId('species') ? byId('species').value : '';
        var weight = parseFloat(byId('weight') ? byId('weight').value : '');
        var drugName = byId('drug-select') ? byId('drug-select').value : '';
        var concentration = parseFloat(byId('concentration') ? byId('concentration').value : '');
        var firstInvalid = validateRequiredFields([byId('weight'), byId('drug-select'), byId('concentration')]);

        if (firstInvalid || !species || !weight || !drugName || !concentration) {
            setFormMessage('Please complete species, weight, drug, and concentration before calculating.', true);
            if (firstInvalid && typeof firstInvalid.focus === 'function') {
                firstInvalid.focus();
            }
            return;
        }
        setFormMessage('', false);

        var drug = drugsData.find(function (item) {
            return item.name === drugName;
        });

        if (!drug) {
            setFormMessage('Selected drug is unavailable. Refresh and try again.', true);
            return;
        }

        var mgPerDose = weight * Number(drug.dose_mg_kg || 0);
        var mlPerDose = mgPerDose / concentration;
        var totalDaily = mgPerDose * getDoseFrequencyMultiplier(drug.frequency);

        setResults(
            mgPerDose.toFixed(2) + ' mg',
            mlPerDose.toFixed(2) + ' mL',
            totalDaily.toFixed(2) + ' mg/day',
            ''
        );
        setFormMessage('Calculation complete.', false);

        var maxDose = weight * Number(drug.max_mg_kg || 0);
        if (mgPerDose > maxDose && maxDose > 0) {
            setResults(
                mgPerDose.toFixed(2) + ' mg',
                mlPerDose.toFixed(2) + ' mL',
                totalDaily.toFixed(2) + ' mg/day',
                'Warning: Dose exceeds typical maximum (' + maxDose.toFixed(2) + ' mg). Verify with veterinarian.'
            );
        }
    }

    function init() {
        var form = byId('dose-form');
        var drugSelect = byId('drug-select');

        if (!form || !drugSelect) {
            return;
        }

        loadDrugs();

        form.addEventListener('submit', calculateDose);
        drugSelect.addEventListener('change', updateConcentrations);
        form.addEventListener('change', calculateDose);
    }

    window.updateConcentrations = updateConcentrations;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
