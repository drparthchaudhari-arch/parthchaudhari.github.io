(function () {
    'use strict';

    function text(id) {
        var node = document.getElementById(id);
        return node ? String(node.value || '').trim() : '';
    }

    function buildLabel() {
        var clinic = text('label-clinic') || 'Veterinary Clinic';
        var patient = text('label-patient') || 'Patient';
        var med = text('label-med') || 'Medication';
        var formType = text('label-form-type') || 'Liquid';
        var dose = text('label-dose') || 'As prescribed';
        var frequency = text('label-frequency') || 'As directed';
        var duration = text('label-duration') || '7';
        var totalAmount = text('label-total-amount') || 'As dispensed';
        var instructions = text('label-instructions') || 'Complete the full prescribed course unless directed otherwise.';
        var formHint = '';

        if (formType === 'Liquid') {
            formHint = 'Shake well before each use.';
        } else if (formType === 'Tablets') {
            formHint = 'Do not crush or split unless directed by veterinarian.';
        } else if (formType === 'Injection') {
            formHint = 'Administer exactly as instructed by veterinarian.';
        }

        var finalInstructions = instructions;
        if (formHint) {
            finalInstructions += ' ' + formHint;
        }

        return [
            'VETERINARY MEDICATION LABEL',
            'Clinic: ' + clinic,
            'Patient: ' + patient,
            'Medication: ' + med,
            'Dosage Form: ' + formType,
            'Dose: ' + dose,
            'Frequency: ' + frequency,
            'Duration: ' + duration + ' day(s)',
            'Total Dispensed: ' + totalAmount,
            'Instructions: ' + finalInstructions,
            'Warnings: Keep out of reach of children. Contact clinic for adverse effects.'
        ].join('\n');
    }

    function setOutput(value) {
        var output = document.getElementById('label-output');
        if (output) {
            output.value = value;
        }
    }

    function setNote(value) {
        var note = document.getElementById('label-note');
        if (note) {
            note.textContent = value;
        }
    }

    function copy() {
        var output = document.getElementById('label-output');
        if (!output || !output.value.trim()) {
            setNote('Generate a label first.');
            return;
        }

        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            navigator.clipboard.writeText(output.value);
        } else {
            output.select();
            document.execCommand('copy');
        }

        setNote('Label copied to clipboard.');
    }

    function printLabel() {
        var output = document.getElementById('label-output');
        if (!output || !output.value.trim()) {
            setNote('Generate a label first.');
            return;
        }

        var popup = window.open('', '_blank', 'width=720,height=620');
        if (!popup) {
            setNote('Popup blocked. Allow popups to print label.');
            return;
        }

        popup.document.write('<pre style="font-family:monospace;white-space:pre-wrap;padding:1rem;">' +
            output.value.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>');
        popup.document.close();
        popup.focus();
        popup.print();
    }

    function init() {
        var form = document.getElementById('label-form');
        var copyButton = document.getElementById('label-copy');
        var printButton = document.getElementById('label-print');

        if (!form || !copyButton || !printButton) {
            return;
        }

        form.addEventListener('submit', function (event) {
            event.preventDefault();
            setOutput(buildLabel());
            setNote('Label generated. Review before printing.');
        });

        copyButton.addEventListener('click', copy);
        printButton.addEventListener('click', printLabel);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
