(function () {
    'use strict';

    var SCRIPTS = [
        {
            id: 'vomit-diarrhea',
            label: 'Vomiting / Diarrhea',
            opening: 'Can you confirm your pet’s age, weight, and when signs started?',
            questions: 'Frequency of vomit/diarrhea, blood present, able to keep water down, toxin exposure, current medications.',
            erNow: 'Repeated vomiting with collapse, blood + weakness, severe abdominal pain, puppy/kitten with rapid decline.',
            guidance: 'Offer small water amounts only, no human meds unless advised, bring stool/vomit photo if possible.',
            window: 'Same day exam; immediate ER if red flags present.'
        },
        {
            id: 'breathing-distress',
            label: 'Breathing Difficulty',
            opening: 'Is your pet open-mouth breathing, blue/pale gums, or unable to settle?',
            questions: 'Respiratory rate, posture (neck extended), cough history, known heart/lung disease, trauma.',
            erNow: 'Any increased effort breathing, cyanosis, collapse, severe anxiety with respiratory effort.',
            guidance: 'Minimize handling and stress, keep cool, transport immediately.',
            window: 'Immediate ER now.'
        },
        {
            id: 'toxin-ingestion',
            label: 'Toxin Ingestion',
            opening: 'What product was ingested, how much, and approximately when?',
            questions: 'Exact product name/strength, body weight, current signs, prior vomiting, co-ingestants.',
            erNow: 'Any xylitol/lily exposure, neurologic signs, collapse, uncontrolled vomiting, unknown toxin amount.',
            guidance: 'Bring packaging, do not induce vomiting unless directed by veterinarian.',
            window: 'Immediate triage call and urgent exam.'
        },
        {
            id: 'urinary-block',
            label: 'Male Cat Urinary Strain',
            opening: 'Is he repeatedly trying to urinate with little or no urine produced?',
            questions: 'Frequency of litter box attempts, vocalization, abdominal discomfort, vomiting, appetite changes.',
            erNow: 'Non-productive straining, lethargy, vomiting, painful abdomen, collapse.',
            guidance: 'Do not delay overnight, transport to ER now.',
            window: 'Immediate ER now.'
        },
        {
            id: 'post-op',
            label: 'Post-op Concern',
            opening: 'What procedure was done and when was the last normal check?',
            questions: 'Incision discharge/swelling, appetite, pain control, urination/defecation, temperature if available.',
            erNow: 'Continuous bleeding, wound dehiscence, marked lethargy, uncontrolled pain, repeated vomiting.',
            guidance: 'Restrict activity, use e-collar, avoid topical creams unless prescribed.',
            window: 'Same day review; immediate ER for red flags.'
        }
    ];

    function setText(id, text) {
        var node = document.getElementById(id);
        if (node) {
            node.textContent = text || '-';
        }
    }

    function renderScript(script) {
        if (!script) {
            return;
        }

        setText('triage-opening', script.opening);
        setText('triage-questions', script.questions);
        setText('triage-er', script.erNow);
        setText('triage-guidance', script.guidance);
        setText('triage-window', script.window);
    }

    function copyScript(script) {
        if (!script) {
            return;
        }

        var text = [
            'Phone Triage Script: ' + script.label,
            'Opening: ' + script.opening,
            'Key Questions: ' + script.questions,
            'ER Now If: ' + script.erNow,
            'Interim Guidance: ' + script.guidance,
            'Appointment Window: ' + script.window
        ].join('\n');

        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            navigator.clipboard.writeText(text);
            return;
        }

        var area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', 'readonly');
        area.style.position = 'absolute';
        area.style.left = '-9999px';
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        document.body.removeChild(area);
    }

    function init() {
        var select = document.getElementById('triage-type');
        var copyButton = document.getElementById('triage-copy');

        if (!select || !copyButton) {
            return;
        }

        for (var i = 0; i < SCRIPTS.length; i += 1) {
            var option = document.createElement('option');
            option.value = SCRIPTS[i].id;
            option.textContent = SCRIPTS[i].label;
            select.appendChild(option);
        }

        function getCurrent() {
            var value = String(select.value || SCRIPTS[0].id);
            for (var j = 0; j < SCRIPTS.length; j += 1) {
                if (SCRIPTS[j].id === value) {
                    return SCRIPTS[j];
                }
            }
            return SCRIPTS[0];
        }

        select.addEventListener('change', function () {
            renderScript(getCurrent());
        });

        copyButton.addEventListener('click', function () {
            copyScript(getCurrent());
        });

        renderScript(SCRIPTS[0]);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
