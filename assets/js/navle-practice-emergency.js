(function () {
    'use strict';

    var SESSION_KEY = 'pc_navle_practice_emergency_session_v1';
    var USAGE_KEY = 'pc_navle_free_usage_v1';
    var LEGACY_FREE_PREFIX = 'pc_free_questions_';
    var PAID_FLAG_KEY = 'pc_navle_paid';
    var FREE_BANK_URL = '/content/navle/questions.json';
    var PAID_STOCK_BANK_URL = '/content/navle/questions-paid-stock.json';
    var PREMIUM_STATUSES = ['premium', 'active', 'paid', 'pro'];
    var FREE_DAILY_LIMIT = 5;
    var FREE_BANK_MAX = 50;

    var currentQuestion = null;
    var questionIndex = 0;
    var questions = [];
    var freeUsed = 0;
    var wasLoggedIn = false;
    var authHydrationInFlight = false;
    var isPaidUser = false;

    function byId(id) {
        return document.getElementById(id);
    }

    function safeParse(value, fallback) {
        try {
            var parsed = JSON.parse(value);
            return parsed !== null ? parsed : fallback;
        } catch (error) {
            return fallback;
        }
    }

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
            return true;
        } catch (error) {
            return false;
        }
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function getTodayKey() {
        return new Date().toISOString().split('T')[0];
    }

    function getCurrentPath() {
        return window.location.pathname + window.location.search;
    }

    function rememberLearningLocation() {
        safeSet('pc_last_learning_url_v1', getCurrentPath());
        safeSet('pc_last_learning_seen_at_v1', new Date().toISOString());
    }

    function readUsage() {
        var today = getTodayKey();
        var usage = safeParse(safeGet(USAGE_KEY) || '{}', {});

        if (usage && String(usage.date || '') === today && Number.isFinite(Number(usage.used))) {
            return Math.max(0, Number(usage.used));
        }

        var legacy = parseInt(safeGet(LEGACY_FREE_PREFIX + today) || '0', 10);
        if (Number.isFinite(legacy) && legacy >= 0) {
            return legacy;
        }

        return 0;
    }

    function writeUsage(used) {
        var normalized = Math.max(0, Number(used) || 0);
        var today = getTodayKey();
        safeSet(USAGE_KEY, JSON.stringify({ date: today, used: normalized }));
        safeSet(LEGACY_FREE_PREFIX + today, String(normalized));
    }

    function readSessionIndex() {
        var today = getTodayKey();
        var session = safeParse(safeGet(SESSION_KEY) || '{}', {});
        if (session && String(session.date || '') === today && Number.isFinite(Number(session.index))) {
            return Math.max(0, Number(session.index));
        }
        return 0;
    }

    function writeSessionIndex(index) {
        var normalized = Math.max(0, Number(index) || 0);
        safeSet(SESSION_KEY, JSON.stringify({ date: getTodayKey(), index: normalized }));
    }

    function queueProgressSync() {
        if (!window.pcSync || typeof window.pcSync.getCurrentUser !== 'function' || typeof window.pcSync.syncToServer !== 'function') {
            return;
        }

        var user = window.pcSync.getCurrentUser();
        if (!user) {
            return;
        }

        window.pcSync.syncToServer({ trigger: 'practice_progress' }).catch(function () {
            // Keep local experience uninterrupted.
        });
    }

    function getTopicLabel(topic) {
        var normalized = String(topic || 'general').replace(/[-_]+/g, ' ').trim();
        if (!normalized) {
            return 'General';
        }
        return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    }

    function getQuestionCounter(index) {
        if (!questions.length) {
            return { current: 1, total: 1 };
        }

        var current = Math.min(Math.max(index + 1, 1), questions.length);
        return {
            current: current,
            total: questions.length
        };
    }

    function setProgress(index) {
        var progress = byId('question-progress');
        var fill = byId('practice-progress-fill');

        if (isPaidUser) {
            var paidCounter = getQuestionCounter(index);
            if (progress) {
                progress.textContent = 'Question ' + paidCounter.current + ' of ' + paidCounter.total + ' (Paid Stock)';
            }
            if (fill) {
                fill.style.width = String((paidCounter.current / paidCounter.total) * 100) + '%';
            }
            return;
        }

        var current = Math.min(index + 1, FREE_DAILY_LIMIT);
        if (progress) {
            progress.textContent = 'Question ' + current + ' of ' + FREE_DAILY_LIMIT + ' (Free)';
        }
        if (fill) {
            fill.style.width = String((current / FREE_DAILY_LIMIT) * 100) + '%';
        }
    }

    function parseQuestions(data) {
        if (!Array.isArray(data)) {
            return [];
        }

        return data.filter(function (item) {
            if (!item || typeof item !== 'object' || !item.stem || !item.options || !item.correct) {
                return false;
            }

            var optionKeys = Object.keys(item.options);
            return optionKeys.length >= 2 && optionKeys.indexOf(String(item.correct)) !== -1;
        });
    }

    function readUrlPlanHint() {
        try {
            var params = new URLSearchParams(window.location.search || '');
            var bank = String(params.get('bank') || '').toLowerCase();
            var plan = String(params.get('plan') || '').toLowerCase();
            return bank || plan;
        } catch (error) {
            return '';
        }
    }

    function hasPaidOverride() {
        var localFlag = String(safeGet(PAID_FLAG_KEY) || '').toLowerCase().trim();
        if (localFlag === 'true' || localFlag === '1' || localFlag === 'paid') {
            return true;
        }

        var planHint = readUrlPlanHint();
        return PREMIUM_STATUSES.indexOf(planHint) !== -1;
    }

    function hasPaidMetadata() {
        if (!window.pcSync || typeof window.pcSync.getCurrentUser !== 'function') {
            return false;
        }

        var user = window.pcSync.getCurrentUser();
        if (!user) {
            return false;
        }

        var userMeta = user.user_metadata && typeof user.user_metadata === 'object' ? user.user_metadata : {};
        var appMeta = user.app_metadata && typeof user.app_metadata === 'object' ? user.app_metadata : {};
        var status = String(userMeta.subscription_status || appMeta.subscription_status || '').toLowerCase().trim();
        if (PREMIUM_STATUSES.indexOf(status) !== -1) {
            return true;
        }

        var plan = String(userMeta.plan || appMeta.plan || '').toLowerCase().trim();
        if (PREMIUM_STATUSES.indexOf(plan) !== -1) {
            return true;
        }

        var subscription = String(userMeta.subscription || appMeta.subscription || '').toLowerCase().trim();
        return PREMIUM_STATUSES.indexOf(subscription) !== -1;
    }

    function detectPaidAccess() {
        return hasPaidOverride() || hasPaidMetadata();
    }

    async function fetchQuestionBank(url) {
        var response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error('HTTP ' + response.status + ' on ' + url);
        }

        return response.json();
    }

    async function loadQuestionBankData() {
        var banks = isPaidUser
            ? [PAID_STOCK_BANK_URL, FREE_BANK_URL]
            : [FREE_BANK_URL];

        var lastError = null;

        for (var i = 0; i < banks.length; i += 1) {
            try {
                return await fetchQuestionBank(banks[i]);
            } catch (error) {
                lastError = error;
            }
        }

        throw lastError || new Error('No question bank available');
    }

    function renderLimitReached() {
        if (isPaidUser) {
            return;
        }

        var container = byId('question-container');
        if (container) {
            container.innerHTML = '<p class="pc-calculator-note">Daily free limit reached. Create a free account to unlock all remaining questions.</p>';
        }
        setProgress(FREE_DAILY_LIMIT - 1);
        showGateModal();
    }

    function renderList(items) {
        if (!Array.isArray(items) || !items.length) {
            return '';
        }

        var content = items.map(function (item) {
            return '<li>' + escapeHtml(item) + '</li>';
        }).join('');

        return '<ul class="pc-question-explanation-list">' + content + '</ul>';
    }

    function renderEliminationMap(question, selectedOption) {
        var map = question && question.eliminate_wrong;
        if (!map || typeof map !== 'object') {
            return '';
        }

        var keys = Object.keys(map);
        if (!keys.length) {
            return '';
        }

        var highlighted = '';
        if (selectedOption && map[selectedOption]) {
            highlighted = '<p><strong>Your Option ' + escapeHtml(selectedOption) + ':</strong> ' + escapeHtml(map[selectedOption]) + '</p>';
        }

        var lines = keys.map(function (key) {
            return '<li><strong>' + escapeHtml(key) + '.</strong> ' + escapeHtml(map[key]) + '</li>';
        }).join('');

        return '<h5>❌ Eliminate Wrong Answers</h5>' + highlighted + '<ul class="pc-question-explanation-list">' + lines + '</ul>';
    }

    function renderExplanationHtml(question, selectedOption) {
        var parts = [];

        if (question.decision_framework) {
            parts.push('<h5>🧠 Decision Framework</h5><p>' + escapeHtml(question.decision_framework) + '</p>');
        }

        if (Array.isArray(question.key_triggers) && question.key_triggers.length) {
            parts.push('<h5>Key Triggers</h5>' + renderList(question.key_triggers));
        }

        var eliminationHtml = renderEliminationMap(question, selectedOption);
        if (eliminationHtml) {
            parts.push(eliminationHtml);
        }

        if (question.explanation) {
            parts.push('<h5>✅ Correct Answer Logic</h5><p>' + escapeHtml(question.explanation) + '</p>');
        }

        if (question.speed_training) {
            parts.push('<h5>⏱️ Speed Training</h5><p>' + escapeHtml(question.speed_training) + '</p>');
        }

        if (question.navle_rule) {
            parts.push('<p><strong>NAVLE Rule:</strong> ' + escapeHtml(question.navle_rule) + '</p>');
        }

        if (question.source_doc) {
            parts.push('<p class="pc-text-small">Source format: ' + escapeHtml(question.source_doc) + '</p>');
        }

        if (!parts.length) {
            parts.push('<p>No explanation available for this question yet.</p>');
        }

        return parts.join('');
    }

    async function loadQuestions() {
        var container = byId('question-container');

        try {
            isPaidUser = detectPaidAccess();
            var data = await loadQuestionBankData();
            questions = parseQuestions(data);

            if (!isPaidUser) {
                questions = questions.slice(0, FREE_BANK_MAX);
            }

            if (!questions.length) {
                throw new Error('No questions available');
            }

            freeUsed = readUsage();
            if (!isPaidUser && freeUsed >= FREE_DAILY_LIMIT) {
                renderLimitReached();
                return;
            }

            var resumeIndex = readSessionIndex();
            if (resumeIndex >= questions.length) {
                resumeIndex = 0;
            }

            showQuestion(resumeIndex);
        } catch (error) {
            console.error('Failed to load questions:', error);
            if (container) {
                container.innerHTML = '<p class="pc-calculator-warning">Error loading questions. Please refresh.</p>';
            }
        }
    }

    function showQuestion(index) {
        var container = byId('question-container');
        if (!container) {
            return;
        }

        if (index >= questions.length) {
            container.innerHTML = '<h3>You\'ve completed all available questions!</h3>';
            writeSessionIndex(0);
            return;
        }

        if (!isPaidUser && freeUsed >= FREE_DAILY_LIMIT) {
            renderLimitReached();
            return;
        }

        currentQuestion = questions[index];
        questionIndex = index;
        writeSessionIndex(index);

        var optionsHtml = Object.entries(currentQuestion.options).map(function (pair) {
            var key = pair[0];
            var text = pair[1];
            return '' +
                '<button class="pc-option-btn" type="button" onclick="selectOption(\'' + key + '\')" data-option="' + key + '">' +
                '<span class="pc-option-key">' + escapeHtml(key) + '</span>' +
                '<span class="pc-option-text">' + escapeHtml(text) + '</span>' +
                '</button>';
        }).join('');

        container.innerHTML = '' +
            '<div class="pc-question-card">' +
            '<div class="pc-question-header">' +
            '<span class="pc-question-number">Question ' + (index + 1) + '</span>' +
            '<span class="pc-question-topic">' + escapeHtml(getTopicLabel(currentQuestion.topic || 'general')) + '</span>' +
            '</div>' +
            '<p class="pc-question-stem">' + escapeHtml(currentQuestion.stem) + '</p>' +
            '<div class="pc-question-options">' + optionsHtml + '</div>' +
            '<div class="pc-question-feedback" id="feedback" style="display:none;"></div>' +
            '</div>';

        setProgress(index);
        rememberLearningLocation();
    }

    function selectOption(option) {
        if (!currentQuestion) {
            return;
        }

        var buttons = document.querySelectorAll('.pc-option-btn');
        buttons.forEach(function (btn) {
            btn.disabled = true;
            if (btn.dataset.option === currentQuestion.correct) {
                btn.classList.add('pc-option--correct');
            } else if (btn.dataset.option === option && option !== currentQuestion.correct) {
                btn.classList.add('pc-option--incorrect');
            }
        });

        var feedback = byId('feedback');
        if (!feedback) {
            return;
        }

        var isCorrect = option === currentQuestion.correct;
        feedback.style.display = 'block';
        feedback.className = 'pc-question-feedback ' + (isCorrect ? 'pc-feedback--correct' : 'pc-feedback--incorrect');
        feedback.innerHTML = '' +
            '<h4>' + (isCorrect ? '✓ Correct!' : '✗ Not the Best Choice') + '</h4>' +
            renderExplanationHtml(currentQuestion, option) +
            '<button class="pc-btn pc-btn--primary" type="button" onclick="nextQuestion()">Next Question</button>';

        if (!isPaidUser) {
            freeUsed += 1;
            writeUsage(freeUsed);
            if (freeUsed >= FREE_DAILY_LIMIT) {
                window.setTimeout(showGateModal, 1200);
            }
        }

        writeSessionIndex(questionIndex + 1);
        queueProgressSync();
    }

    function nextQuestion() {
        if (!isPaidUser && freeUsed >= FREE_DAILY_LIMIT) {
            renderLimitReached();
            return;
        }

        var nextIndex = questionIndex + 1;
        writeSessionIndex(nextIndex);
        showQuestion(nextIndex);
    }

    function showGateModal() {
        if (isPaidUser) {
            return;
        }

        var modal = byId('gate-modal');
        if (modal) {
            modal.style.display = 'grid';
        }
    }

    async function sendMagicLinkFromGate() {
        var emailInput = byId('gate-email');
        var message = byId('gate-message');
        var submit = byId('gate-submit');

        var email = emailInput ? String(emailInput.value || '').trim() : '';
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            if (message) {
                message.textContent = 'Enter a valid email address.';
                message.classList.add('pc-is-error');
            }
            return;
        }

        if (submit) {
            submit.disabled = true;
        }

        if (message) {
            message.textContent = 'Sending magic link...';
            message.classList.remove('pc-is-error');
            message.classList.remove('pc-is-success');
        }

        try {
            if (window.pcSync && typeof window.pcSync.sendMagicLink === 'function') {
                var result = await window.pcSync.sendMagicLink(email, {
                    redirectTo: window.location.origin + getCurrentPath()
                });

                if (result && result.ok) {
                    if (message) {
                        message.textContent = 'Magic link sent. Open it on any device to continue from synced progress.';
                        message.classList.add('pc-is-success');
                    }
                } else if (message) {
                    message.textContent = 'Could not send magic link right now. Please try again.';
                    message.classList.add('pc-is-error');
                }
            } else if (message) {
                message.textContent = 'Could not send magic link right now. Please try again.';
                message.classList.add('pc-is-error');
            }
        } catch (error) {
            if (message) {
                message.textContent = 'Could not send magic link right now. Please try again.';
                message.classList.add('pc-is-error');
            }
        }

        if (submit) {
            submit.disabled = false;
        }
    }

    function bindGateEvents() {
        var submit = byId('gate-submit');
        if (submit) {
            submit.addEventListener('click', function (event) {
                event.preventDefault();
                sendMagicLinkFromGate();
            });
        }
    }

    async function hydrateFromServerIfLoggedIn() {
        if (!window.pcSync) {
            return;
        }

        if (typeof window.pcSync.refreshCurrentUser === 'function') {
            await window.pcSync.refreshCurrentUser();
        }

        if (typeof window.pcSync.getCurrentUser !== 'function') {
            return;
        }

        var user = window.pcSync.getCurrentUser();
        wasLoggedIn = !!user;

        if (!user || typeof window.pcSync.syncFromServer !== 'function') {
            return;
        }

        await window.pcSync.syncFromServer();
    }

    function bindAuthResume() {
        window.addEventListener('pc-auth-status-change', function (event) {
            var loggedIn = !!(event && event.detail && event.detail.loggedIn);
            if (!loggedIn || wasLoggedIn || authHydrationInFlight) {
                wasLoggedIn = loggedIn;
                return;
            }

            authHydrationInFlight = true;
            wasLoggedIn = true;

            Promise.resolve()
                .then(function () {
                    if (window.pcSync && typeof window.pcSync.syncFromServer === 'function') {
                        return window.pcSync.syncFromServer();
                    }
                    return null;
                })
                .then(function () {
                    return loadQuestions();
                })
                .finally(function () {
                    authHydrationInFlight = false;
                });
        });
    }

    async function init() {
        if (!byId('question-container')) {
            return;
        }

        bindGateEvents();
        bindAuthResume();
        rememberLearningLocation();

        await hydrateFromServerIfLoggedIn();
        await loadQuestions();
    }

    window.selectOption = selectOption;
    window.nextQuestion = nextQuestion;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            init().catch(function () {
                // Keep page stable even if init fails.
            });
        }, { once: true });
    } else {
        init().catch(function () {
            // Keep page stable even if init fails.
        });
    }
})();
