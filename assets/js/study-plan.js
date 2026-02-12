(function () {
    var STORAGE_KEY = 'pc_study_plan';

    var PLAN_PRESETS = {
        '6week': {
            label: '6-Week Intensive',
            dailyTaskTarget: 5
        },
        '10week': {
            label: '10-Week Standard',
            dailyTaskTarget: 4
        },
        custom: {
            label: 'Custom Plan',
            dailyTaskTarget: 3
        }
    };

    var TOPICS = [
        {
            id: 'cardiology',
            title: 'Cardiology',
            description: 'CHF reasoning and cardiology vocabulary loops.',
            items: [
                { id: 'chf_case', title: 'Read CHF Case Study', type: 'case', url: '/bridge/case-studies/chf-dog.html', estimatedTime: '30min' },
                { id: 'wordvet_cardio', title: 'Play WordVet Cardiology Set', type: 'game', url: '/play/wordvet/', estimatedTime: '15min' },
                { id: 'chf_radiographs', title: 'Review CHF Radiograph Findings', type: 'resource', url: '/bridge/case-studies/chf-dog.html', estimatedTime: '20min' }
            ]
        },
        {
            id: 'endocrine',
            title: 'Endocrine',
            description: 'DKA and hyperthyroid differential framing.',
            items: [
                { id: 'dka_case', title: 'Read Canine DKA Case', type: 'case', url: '/bridge/case-studies/dka-dog.html', estimatedTime: '30min' },
                { id: 'hyperthyroid_case', title: 'Read Feline Hyperthyroid Case', type: 'case', url: '/bridge/case-studies/feline-hyperthyroid.html', estimatedTime: '30min' },
                { id: 'endocrine_wordvet', title: 'Play WordVet Endocrine Terms', type: 'game', url: '/play/wordvet/', estimatedTime: '15min' }
            ]
        },
        {
            id: 'emergency',
            title: 'Emergency',
            description: 'Stabilization-first priorities for acute cases.',
            items: [
                { id: 'dka_stabilization', title: 'Review DKA Stabilization Priorities', type: 'resource', url: '/bridge/case-studies/dka-dog.html', estimatedTime: '20min' },
                { id: 'sudoku_logic', title: 'Play Sudoku: Logic for Diagnostics', type: 'game', url: '/play/sudoku/', estimatedTime: '15min' }
            ]
        },
        {
            id: 'production',
            title: 'Production',
            description: 'Herd-level and milk quality decision making.',
            items: [
                { id: 'mastitis_case', title: 'Read Bovine Mastitis Case', type: 'case', url: '/bridge/case-studies/bovine-mastitis.html', estimatedTime: '25min' },
                { id: 'mastitis_treatment', title: 'Review Mastitis Treatment Pathway', type: 'resource', url: '/bridge/case-studies/bovine-mastitis.html', estimatedTime: '20min' }
            ]
        },
        {
            id: 'anatomy',
            title: 'Anatomy',
            description: 'Visual recall and structure reinforcement.',
            items: [
                { id: 'memory_anatomy', title: 'Play Memory Match Anatomy Loop', type: 'game', url: '/play/memory-match/', estimatedTime: '15min' },
                { id: 'anatomy_review', title: 'Review Case Anatomy Notes', type: 'resource', url: '/bridge/case-studies/', estimatedTime: '20min' }
            ]
        },
        {
            id: 'pharmacology',
            title: 'Pharmacology',
            description: 'Medication sequence and treatment prioritization.',
            items: [
                { id: 'pharm_2048', title: 'Play 2048 Prioritization Drill', type: 'game', url: '/play/2048/', estimatedTime: '15min' },
                { id: 'pharm_case_review', title: 'Review Drug Classes in Cases', type: 'resource', url: '/bridge/case-studies/', estimatedTime: '20min' }
            ]
        },
        {
            id: 'surgery',
            title: 'Surgery',
            description: 'Decision sequencing and procedural planning.',
            items: [
                { id: 'surgery_logic', title: 'Play Tic-Tac-Toe Strategy Drill', type: 'game', url: '/play/tictactoe/', estimatedTime: '15min' },
                { id: 'surgery_checklist', title: 'Review Surgical Checklist Framework', type: 'resource', url: '/bridge/case-studies/', estimatedTime: '20min' }
            ]
        }
    ];

    var state = {
        plan: null
    };

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function safeGetItem(key) {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            return null;
        }
    }

    function safeSetItem(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (error) {
            return false;
        }
    }

    function safeParse(value, fallback) {
        if (!value) {
            return fallback;
        }

        try {
            var parsed = JSON.parse(value);
            return parsed && typeof parsed === 'object' ? parsed : fallback;
        } catch (error) {
            return fallback;
        }
    }

    function toDayStamp(date) {
        var year = date.getFullYear();
        var month = String(date.getMonth() + 1).padStart(2, '0');
        var day = String(date.getDate()).padStart(2, '0');
        return year + '-' + month + '-' + day;
    }

    function getYesterdayStamp() {
        var yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return toDayStamp(yesterday);
    }

    function normalizePlanId(planId) {
        if (PLAN_PRESETS[planId]) {
            return planId;
        }
        return '10week';
    }

    function indexItemsById(items) {
        var index = {};
        if (Object.prototype.toString.call(items) !== '[object Array]') {
            return index;
        }

        for (var i = 0; i < items.length; i += 1) {
            var item = items[i];
            if (item && item.id) {
                index[item.id] = item;
            }
        }
        return index;
    }

    function topicEnabledFromItems(items, topicId) {
        var enabled = true;

        for (var i = 0; i < items.length; i += 1) {
            if (items[i].topicId === topicId) {
                enabled = items[i].enabled !== false;
                break;
            }
        }

        return enabled;
    }

    function buildItems(existingItems) {
        var byId = indexItemsById(existingItems);
        var items = [];

        for (var i = 0; i < TOPICS.length; i += 1) {
            var topic = TOPICS[i];
            var topicEnabled = topicEnabledFromItems(existingItems || [], topic.id);

            for (var j = 0; j < topic.items.length; j += 1) {
                var template = topic.items[j];
                var existing = byId[template.id] || {};

                items.push({
                    id: template.id,
                    title: template.title,
                    type: template.type,
                    url: template.url,
                    topicId: topic.id,
                    estimatedTime: template.estimatedTime,
                    completed: existing.completed === true,
                    completedAt: existing.completedAt || '',
                    enabled: existing.enabled !== undefined ? existing.enabled !== false : topicEnabled
                });
            }
        }

        return items;
    }

    function createPlan(planId, previousPlan) {
        var safePlanId = normalizePlanId(planId);
        var today = toDayStamp(new Date());
        var oldPlan = previousPlan || {};

        return {
            planId: safePlanId,
            startDate: safePlanId !== oldPlan.planId ? today : (oldPlan.startDate || today),
            items: buildItems(oldPlan.items),
            currentStreak: Number(oldPlan.currentStreak) > 0 ? Number(oldPlan.currentStreak) : 0,
            lastStudyDate: oldPlan.lastStudyDate || ''
        };
    }

    function getStoredPlan() {
        var raw = safeParse(safeGetItem(STORAGE_KEY), null);
        if (!raw || !raw.items) {
            return null;
        }

        return createPlan(raw.planId, raw);
    }

    function savePlan(plan) {
        state.plan = plan;
        safeSetItem(STORAGE_KEY, JSON.stringify(plan));
    }

    function getElements() {
        return {
            topicGrid: document.getElementById('pc-study-topic-grid'),
            planButtons: document.querySelectorAll('[data-pc-plan]'),
            progressPercent: document.getElementById('pc-study-progress-percent'),
            progressFill: document.getElementById('pc-study-progress-fill'),
            progressSummary: document.getElementById('pc-study-progress-summary'),
            streak: document.getElementById('pc-study-streak'),
            todayList: document.getElementById('pc-study-today-list'),
            studyBreak: document.getElementById('pc-study-break')
        };
    }

    function getTopicById(topicId) {
        for (var i = 0; i < TOPICS.length; i += 1) {
            if (TOPICS[i].id === topicId) {
                return TOPICS[i];
            }
        }
        return null;
    }

    function getItemsForTopic(topicId) {
        var list = [];
        for (var i = 0; i < state.plan.items.length; i += 1) {
            if (state.plan.items[i].topicId === topicId) {
                list.push(state.plan.items[i]);
            }
        }
        return list;
    }

    function isTopicEnabled(topicId) {
        var items = getItemsForTopic(topicId);
        if (!items.length) {
            return false;
        }

        for (var i = 0; i < items.length; i += 1) {
            if (items[i].enabled !== false) {
                return true;
            }
        }

        return false;
    }

    function renderTopics() {
        var elements = getElements();
        if (!elements.topicGrid) {
            return;
        }

        var html = '';

        for (var i = 0; i < TOPICS.length; i += 1) {
            var topic = TOPICS[i];
            var topicItems = getItemsForTopic(topic.id);
            var enabled = isTopicEnabled(topic.id);

            html += '<article class="pc-study-topic">';
            html += '<label>';
            html += '<input type="checkbox" data-pc-topic-toggle data-topic-id="' + topic.id + '" ' + (enabled ? 'checked' : '') + '>';
            html += '<strong>' + escapeHtml(topic.title) + '</strong>';
            html += '</label>';
            html += '<p class="pc-study-topic-meta">' + escapeHtml(topic.description) + '</p>';
            html += '<ul class="pc-study-items">';

            for (var j = 0; j < topicItems.length; j += 1) {
                var item = topicItems[j];
                var disabled = item.enabled === false;
                var checked = item.completed === true;

                html += '<li class="pc-study-item">';
                html += '<label>';
                html += '<input type="checkbox" data-pc-item-toggle data-item-id="' + item.id + '" ' + (checked ? 'checked' : '') + ' ' + (disabled ? 'disabled' : '') + '>';
                html += '<span>';
                html += '<span class="pc-study-item-title">' + escapeHtml(item.title) + '</span>';
                html += '<span class="pc-study-item-meta">';
                html += '<span>' + escapeHtml(item.estimatedTime) + '</span>';
                html += '<a href="' + item.url + '">Open</a>';
                html += '</span>';
                html += '</span>';
                html += '</label>';
                html += '</li>';
            }

            html += '</ul>';
            html += '</article>';
        }

        elements.topicGrid.innerHTML = html;
    }

    function getEnabledItems() {
        return state.plan.items.filter(function (item) {
            return item.enabled !== false;
        });
    }

    function getCompletedTodayCount() {
        var today = toDayStamp(new Date());
        var count = 0;

        for (var i = 0; i < state.plan.items.length; i += 1) {
            var item = state.plan.items[i];
            if (!item.completedAt) {
                continue;
            }

            var completedDate = new Date(item.completedAt);
            if (isNaN(completedDate.getTime())) {
                continue;
            }

            if (toDayStamp(completedDate) === today) {
                count += 1;
            }
        }

        return count;
    }

    function renderProgress() {
        var elements = getElements();
        var enabledItems = getEnabledItems();
        var completed = enabledItems.filter(function (item) {
            return item.completed === true;
        }).length;

        var total = enabledItems.length;
        var percent = total ? Math.round((completed / total) * 100) : 0;

        if (elements.progressPercent) {
            elements.progressPercent.textContent = percent + '%';
        }

        if (elements.progressFill) {
            elements.progressFill.style.width = percent + '%';
        }

        if (elements.progressSummary) {
            elements.progressSummary.textContent = completed + ' / ' + total + ' tasks complete';
        }

        if (elements.streak) {
            var streakValue = Number(state.plan.currentStreak) || 0;
            elements.streak.textContent = '🔥 ' + streakValue + ' day streak';
        }
    }

    function renderTodaysTasks() {
        var elements = getElements();
        if (!elements.todayList) {
            return;
        }

        var preset = PLAN_PRESETS[state.plan.planId] || PLAN_PRESETS['10week'];
        var limit = preset.dailyTaskTarget;

        var pending = getEnabledItems().filter(function (item) {
            return item.completed !== true;
        }).slice(0, limit);

        if (!pending.length) {
            elements.todayList.innerHTML = '<li>All selected tasks are complete. Nice consistency.</li>';
        } else {
            var html = '';
            for (var i = 0; i < pending.length; i += 1) {
                html += '<li><a href="' + pending[i].url + '">' + escapeHtml(pending[i].title) + '</a> (' + escapeHtml(pending[i].estimatedTime) + ')</li>';
            }
            elements.todayList.innerHTML = html;
        }

        if (elements.studyBreak) {
            elements.studyBreak.hidden = getCompletedTodayCount() < 3;
        }
    }

    function renderPlanButtons() {
        var elements = getElements();
        for (var i = 0; i < elements.planButtons.length; i += 1) {
            var button = elements.planButtons[i];
            var planId = button.getAttribute('data-pc-plan');
            var isActive = planId === state.plan.planId;
            button.classList.toggle('pc-is-active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
        }
    }

    function renderAll() {
        renderPlanButtons();
        renderTopics();
        renderProgress();
        renderTodaysTasks();
    }

    function updateStreakForCompletion() {
        var today = toDayStamp(new Date());
        var yesterday = getYesterdayStamp();

        if (state.plan.lastStudyDate === today) {
            return;
        }

        if (state.plan.lastStudyDate === yesterday) {
            state.plan.currentStreak = (Number(state.plan.currentStreak) || 0) + 1;
        } else {
            state.plan.currentStreak = 1;
        }

        state.plan.lastStudyDate = today;
    }

    function setTopicEnabled(topicId, enabled) {
        for (var i = 0; i < state.plan.items.length; i += 1) {
            if (state.plan.items[i].topicId === topicId) {
                state.plan.items[i].enabled = enabled;
            }
        }

        savePlan(state.plan);
        renderAll();
    }

    function setItemCompleted(itemId, completed) {
        for (var i = 0; i < state.plan.items.length; i += 1) {
            var item = state.plan.items[i];
            if (item.id !== itemId || item.enabled === false) {
                continue;
            }

            if (completed) {
                if (item.completed !== true) {
                    item.completed = true;
                    item.completedAt = new Date().toISOString();
                    updateStreakForCompletion();
                }
            } else {
                item.completed = false;
                item.completedAt = '';
            }

            break;
        }

        savePlan(state.plan);
        renderAll();
    }

    function applyPlan(planId) {
        state.plan = createPlan(planId, state.plan);
        savePlan(state.plan);
        renderAll();
    }

    function bindEvents() {
        var elements = getElements();

        if (elements.topicGrid) {
            elements.topicGrid.addEventListener('change', function (event) {
                var target = event.target;
                if (!target) {
                    return;
                }

                if (target.hasAttribute('data-pc-topic-toggle')) {
                    var topicId = target.getAttribute('data-topic-id');
                    setTopicEnabled(topicId, target.checked);
                    return;
                }

                if (target.hasAttribute('data-pc-item-toggle')) {
                    var itemId = target.getAttribute('data-item-id');
                    setItemCompleted(itemId, target.checked);
                }
            });
        }

        for (var i = 0; i < elements.planButtons.length; i += 1) {
            elements.planButtons[i].addEventListener('click', function (event) {
                var planId = event.currentTarget.getAttribute('data-pc-plan');
                applyPlan(planId);
            });
        }
    }

    function init() {
        var topicGrid = document.getElementById('pc-study-topic-grid');
        if (!topicGrid) {
            return;
        }

        state.plan = getStoredPlan() || createPlan('10week');
        savePlan(state.plan);

        bindEvents();
        renderAll();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
