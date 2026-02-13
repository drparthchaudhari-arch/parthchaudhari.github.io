(function () {
    'use strict';

    function text(id) {
        var node = document.getElementById(id);
        return node ? String(node.value || '').trim() : '';
    }

    function buildLabel() {
        var patient = text('label-patient') || 'Patient';
        var med = text('label-med') || 'Medication';
        var dose = text('label-dose') || 'As prescribed';
        var frequency = text('label-frequency') || 'As directed';
        var duration = text('label-duration') || '7';
        var instructions = text('label-instructions') || 'Complete the full prescribed course unless directed otherwise.';

        return [
            'VETERINARY MEDICATION LABEL',
            'Patient: ' + patient,
            'Medication: ' + med,
            'Dose: ' + dose,
            'Frequency: ' + frequency,
            'Duration: ' + duration + ' day(s)',
            'Instructions: ' + instructions,
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
