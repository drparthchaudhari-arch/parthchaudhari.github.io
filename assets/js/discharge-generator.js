(function () {
    'use strict';

    var TEMPLATES = [
        {
            id: 'spay-neuter',
            label: 'Spay/Neuter',
            care: 'Restrict activity for 10-14 days. Keep incision clean and dry. Use e-collar continuously.',
            redFlags: 'Incision swelling, discharge, opening, vomiting, lethargy, no appetite >24h.'
        },
        {
            id: 'dental',
            label: 'Dental Procedure',
            care: 'Feed soft food for 24-48 hours. Avoid hard chews. Continue oral meds as prescribed.',
            redFlags: 'Persistent oral bleeding, facial swelling, refusal to eat, severe halitosis with pain.'
        },
        {
            id: 'gi',
            label: 'GI Upset',
            care: 'Offer small, frequent bland meals and water access. Transition diet gradually over 3-5 days.',
            redFlags: 'Repeated vomiting, bloody stool, collapse, inability to keep water down.'
        },
        {
            id: 'otitis',
            label: 'Otitis',
            care: 'Apply ear medication exactly as instructed after gentle cleaning. Prevent scratching/shaking.',
            redFlags: 'Head tilt, loss of balance, severe pain, worsening odor/discharge.'
        },
        {
            id: 'wound',
            label: 'Wound Care',
            care: 'Keep bandage/incision clean and dry. Prevent licking. Recheck as scheduled.',
            redFlags: 'Bandage slippage, foul odor, increased redness/swelling, bleeding through bandage.'
        },
        {
            id: 'uti',
            label: 'UTI',
            care: 'Give antibiotics for full course. Encourage water intake and frequent urination opportunities.',
            redFlags: 'Straining with no urine, blood worsening, vomiting, lethargy.'
        },
        {
            id: 'pancreatitis',
            label: 'Pancreatitis',
            care: 'Feed low-fat diet only. Give antiemetics/analgesics as prescribed. Keep activity calm.',
            redFlags: 'Persistent vomiting, abdominal pain, weakness, no appetite >24h.'
        }
    ];

    function escapeText(value) {
        return String(value || '').trim();
    }

    function getTemplateById(id) {
        for (var i = 0; i < TEMPLATES.length; i += 1) {
            if (TEMPLATES[i].id === id) {
                return TEMPLATES[i];
            }
        }
        return TEMPLATES[0];
    }

    function generateText() {
        var templateId = String(document.getElementById('dc-template').value || TEMPLATES[0].id);
        var template = getTemplateById(templateId);

        var patient = escapeText(document.getElementById('dc-name').value) || 'Your pet';
        var species = escapeText(document.getElementById('dc-species').value) || 'patient';
        var followUp = escapeText(document.getElementById('dc-followup').value) || '7';
        var meds = escapeText(document.getElementById('dc-meds').value) || 'As prescribed by your veterinarian.';
        var notes = escapeText(document.getElementById('dc-notes').value);

        var text = [
            'Discharge Instructions - ' + template.label,
            'Patient: ' + patient + ' (' + species + ')',
            '',
            'Home Care:',
            template.care,
            '',
            'Medication Plan:',
            meds,
            '',
            'Return Immediately If:',
            template.redFlags,
            '',
            'Follow-up: Recheck in ' + followUp + ' day(s).'
        ];

        if (notes) {
            text.push('');
            text.push('Additional Notes:');
            text.push(notes);
        }

        return text.join('\n');
    }

    function setOutput(text) {
        var output = document.getElementById('dc-output');
        if (output) {
            output.value = text;
        }
    }

    function copyOutput() {
        var output = document.getElementById('dc-output');
        var note = document.getElementById('dc-note');
        if (!output || !output.value.trim()) {
            if (note) {
                note.textContent = 'Generate instructions first before copying.';
            }
            return;
        }

        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            navigator.clipboard.writeText(output.value);
        } else {
            output.select();
            document.execCommand('copy');
        }

        if (note) {
            note.textContent = 'Instructions copied to clipboard.';
        }
    }

    function populateTemplates() {
        var select = document.getElementById('dc-template');
        if (!select) {
            return;
        }

        for (var i = 0; i < TEMPLATES.length; i += 1) {
            var option = document.createElement('option');
            option.value = TEMPLATES[i].id;
            option.textContent = TEMPLATES[i].label;
            select.appendChild(option);
        }
    }

    function init() {
        var form = document.getElementById('discharge-form');
        var copyButton = document.getElementById('dc-copy');

        if (!form || !copyButton) {
            return;
        }

        populateTemplates();

        form.addEventListener('submit', function (event) {
            event.preventDefault();
            setOutput(generateText());
            var note = document.getElementById('dc-note');
            if (note) {
                note.textContent = 'Instructions generated. Review before sharing.';
            }
        });

        copyButton.addEventListener('click', copyOutput);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
