(function () {
    function safeGet(key) {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            return null;
        }
    }

    function safeSet(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            // Ignore storage failures.
        }
    }

    function initDiagnoseBlock(block) {
        var form = block.querySelector('[data-pc-diagnose-form]');
        var button = block.querySelector('[data-pc-check-answer]');
        var feedback = block.querySelector('[data-pc-feedback]');
        var completedBadge = block.querySelector('[data-pc-completed]');

        if (!form || !button || !feedback) {
            return;
        }

        var caseKey = form.getAttribute('data-case-key') || '';
        var correctOption = form.getAttribute('data-correct') || '';
        var correctLabel = form.getAttribute('data-correct-label') || 'Correct option';
        var explanation = form.getAttribute('data-explanation') || '';
        var teaching = form.getAttribute('data-teaching') || '';
        var studyLink = form.getAttribute('data-study-link') || '/study/wordweb/';
        var studyLabel = form.getAttribute('data-study-label') || 'Open WordWeb NAVLE Topic List';

        if (caseKey && safeGet(caseKey) === 'completed' && completedBadge) {
            completedBadge.hidden = false;
        }

        button.addEventListener('click', function () {
            var selected = form.querySelector('input[name="pc_diagnosis"]:checked');
            feedback.hidden = false;

            if (!selected) {
                feedback.innerHTML = '<p><strong>Select one option.</strong> Choose A, B, or C and check again.</p>';
                return;
            }

            var selectedText = selected.parentElement ? selected.parentElement.textContent.trim() : selected.value;
            var intro = selected.value === correctOption
                ? '<p><strong>Correct answer: ' + correctLabel + '</strong></p>'
                : '<p><strong>Correct answer: ' + correctLabel + '</strong> You selected ' + selectedText + '.</p>';

            feedback.innerHTML = intro +
                '<p>' + explanation + '</p>' +
                '<p><strong>NAVLE Teaching Point:</strong> ' + teaching + '</p>' +
                '<div class="pc-panel-actions"><a class="pc-btn pc-btn--secondary" href="' + studyLink + '">' + studyLabel + '</a></div>';

            if (caseKey) {
                safeSet(caseKey, 'completed');
                if (completedBadge) {
                    completedBadge.hidden = false;
                }
            }
        });
    }

    function initBridgeInteractions() {
        var blocks = document.querySelectorAll('[data-pc-diagnose]');
        for (var i = 0; i < blocks.length; i += 1) {
            initDiagnoseBlock(blocks[i]);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBridgeInteractions, { once: true });
    } else {
        initBridgeInteractions();
    }
})();
