(function () {
    var STORAGE_KEY = 'pc_study_plan';

    var PLAN_PRESETS = {
        '6week': {
            label: '6-Week Intensive',
            dailyTaskTarget: 8
        },
        '10week': {
            label: '10-Week Standard',
            dailyTaskTarget: 6
        },
        custom: {
            label: 'Custom Plan',
            dailyTaskTarget: 5
        }
    };

    var TOPICS = [
        {
            id: 'species_bovine',
            title: 'Species: Bovine',
            description: 'Cardio, GI, neuro, respiratory, repro, and herd-level bovine disease patterns.',
            items: [
                { id: 'bovine_master_list', title: 'Review Bovine Master Bullet List', type: 'resource', url: '/study/wordweb/#species-bovine', estimatedTime: '35min' },
                { id: 'bovine_key_differentials', title: 'Memorize Bovine High-Yield Differentials', type: 'resource', url: '/study/wordweb/#species-bovine', estimatedTime: '20min' },
                { id: 'bovine_case_mastitis', title: 'Apply to Bovine Mastitis Case', type: 'case', url: '/bridge/case-studies/bovine-mastitis.html', estimatedTime: '25min' }
            ]
        },
        {
            id: 'species_equine',
            title: 'Species: Equine',
            description: 'Colic, laminitis, respiratory, neuro, endocrine, and foal emergency anchors.',
            items: [
                { id: 'equine_master_list', title: 'Review Equine Master Bullet List', type: 'resource', url: '/study/wordweb/#species-equine', estimatedTime: '35min' },
                { id: 'equine_colic_algorithm', title: 'Drill Equine Colic Decision Points', type: 'resource', url: '/study/wordweb/#diagnostic-templates', estimatedTime: '20min' },
                { id: 'equine_neuro_resp_patterns', title: 'Review Equine Neuro and Respiratory Patterns', type: 'resource', url: '/study/wordweb/#species-equine', estimatedTime: '20min' }
            ]
        },
        {
            id: 'species_canine',
            title: 'Species: Canine',
            description: 'Core canine cardiology, endocrine, GI, neuro, respiratory, and skin disease clusters.',
            items: [
                { id: 'canine_master_list', title: 'Review Canine Master Bullet List', type: 'resource', url: '/study/wordweb/#species-canine', estimatedTime: '35min' },
                { id: 'canine_case_chf', title: 'Apply to Canine CHF Case', type: 'case', url: '/bridge/case-studies/chf-dog.html', estimatedTime: '30min' },
                { id: 'canine_case_dka', title: 'Apply to Canine DKA Case', type: 'case', url: '/bridge/case-studies/dka-dog.html', estimatedTime: '30min' },
                { id: 'canine_top20_recall', title: 'Run Canine Top-20 Rapid Recall', type: 'resource', url: '/study/wordweb/#top-checklists', estimatedTime: '15min' }
            ]
        },
        {
            id: 'species_feline',
            title: 'Species: Feline',
            description: 'CKD, hyperthyroid, diabetes, FLUTD, HCM, and feline inflammatory disease integration.',
            items: [
                { id: 'feline_master_list', title: 'Review Feline Master Bullet List', type: 'resource', url: '/study/wordweb/#species-feline', estimatedTime: '30min' },
                { id: 'feline_case_hyperthyroid', title: 'Apply to Feline Hyperthyroid Case', type: 'case', url: '/bridge/case-studies/feline-hyperthyroid.html', estimatedTime: '30min' },
                { id: 'feline_obstruction_protocol', title: 'Drill Feline Urethral Obstruction Protocol', type: 'resource', url: '/study/wordweb/#treatment-algorithms', estimatedTime: '20min' }
            ]
        },
        {
            id: 'species_small_ruminant',
            title: 'Species: Small Ruminants',
            description: 'Haemonchus, enterotoxemia, pregnancy toxemia, CLA/CAE/OPP, and abortion panels.',
            items: [
                { id: 'small_ruminant_master_list', title: 'Review Small Ruminant Bullet List', type: 'resource', url: '/study/wordweb/#species-small-ruminant', estimatedTime: '25min' },
                { id: 'small_ruminant_abortions', title: 'Review Small Ruminant Abortion Causes', type: 'resource', url: '/study/wordweb/#systems-reproductive', estimatedTime: '20min' },
                { id: 'small_ruminant_parasite_drill', title: 'Drill Haemonchus and Parasite Control', type: 'resource', url: '/study/wordweb/#species-small-ruminant', estimatedTime: '20min' }
            ]
        },
        {
            id: 'species_porcine',
            title: 'Species: Porcine',
            description: 'PRRS/PCV2 respiratory-reproductive blocks and swine GI/infectious disease priorities.',
            items: [
                { id: 'porcine_master_list', title: 'Review Porcine Bullet List', type: 'resource', url: '/study/wordweb/#species-porcine', estimatedTime: '25min' },
                { id: 'porcine_reportables', title: 'Review ASF and Classical Swine Fever Rules', type: 'resource', url: '/study/wordweb/#ethics', estimatedTime: '15min' },
                { id: 'porcine_prrs_pathway', title: 'Review PRRS and Respiratory-Repro Pathways', type: 'resource', url: '/study/wordweb/#species-porcine', estimatedTime: '20min' }
            ]
        },
        {
            id: 'species_poultry_aquatics',
            title: 'Species: Poultry and Aquatics',
            description: 'Reportables, production diseases, water-quality medicine, and zoonotic fish risks.',
            items: [
                { id: 'poultry_master_list', title: 'Review Poultry Bullet List', type: 'resource', url: '/study/wordweb/#species-poultry', estimatedTime: '25min' },
                { id: 'aquatics_master_list', title: 'Review Aquatics Bullet List', type: 'resource', url: '/study/wordweb/#species-aquatics', estimatedTime: '20min' },
                { id: 'poultry_reportables', title: 'Drill Poultry Reportable Diseases', type: 'resource', url: '/study/wordweb/#species-poultry', estimatedTime: '20min' }
            ]
        },
        {
            id: 'systems_core',
            title: 'Systems: Cardio to Integument',
            description: 'Cross-species system integration from cardiovascular through integumentary medicine.',
            items: [
                { id: 'systems_cardio', title: 'Cardiovascular System Pass', type: 'resource', url: '/study/wordweb/#systems-cardiovascular', estimatedTime: '20min' },
                { id: 'systems_resp', title: 'Respiratory System Pass', type: 'resource', url: '/study/wordweb/#systems-respiratory', estimatedTime: '20min' },
                { id: 'systems_gi', title: 'GI System Pass', type: 'resource', url: '/study/wordweb/#systems-gastrointestinal', estimatedTime: '20min' },
                { id: 'systems_urinary', title: 'Urinary System Pass', type: 'resource', url: '/study/wordweb/#systems-urinary', estimatedTime: '20min' },
                { id: 'systems_repro', title: 'Reproductive System Pass', type: 'resource', url: '/study/wordweb/#systems-reproductive', estimatedTime: '20min' },
                { id: 'systems_neuro', title: 'Nervous System Pass', type: 'resource', url: '/study/wordweb/#systems-nervous', estimatedTime: '20min' },
                { id: 'systems_msk', title: 'Musculoskeletal System Pass', type: 'resource', url: '/study/wordweb/#systems-musculoskeletal', estimatedTime: '20min' },
                { id: 'systems_skin', title: 'Integumentary System Pass', type: 'resource', url: '/study/wordweb/#systems-integumentary', estimatedTime: '20min' },
                { id: 'systems_cross_link_review', title: 'Cross-Link Systems with Species Differentials', type: 'resource', url: '/study/wordweb/#how-to-use', estimatedTime: '20min' }
            ]
        },
        {
            id: 'critical_care',
            title: 'High-Yield: Emergency and Critical Care',
            description: 'Shock, CPCR, toxicosis, fluids/electrolytes, anesthesia, transfusion, and imaging/pathology drills.',
            items: [
                { id: 'high_yield_emergency', title: 'Emergency and Critical Care Drill', type: 'resource', url: '/study/wordweb/#high-yield-emergency', estimatedTime: '35min' },
                { id: 'fluids_electrolytes', title: 'Fluids and Electrolytes Drill', type: 'resource', url: '/study/wordweb/#fluids-electrolytes', estimatedTime: '25min' },
                { id: 'anesthesia_drill', title: 'Anesthesia and Sedation Drill', type: 'resource', url: '/study/wordweb/#anesthesia', estimatedTime: '25min' },
                { id: 'transfusion_drill', title: 'Transfusion Medicine Drill', type: 'resource', url: '/study/wordweb/#transfusion', estimatedTime: '20min' },
                { id: 'imaging_pathology_drill', title: 'Imaging and Pathology Pattern Drill', type: 'resource', url: '/study/wordweb/#imaging', estimatedTime: '25min' },
                { id: 'clinical_pathology_drill', title: 'CBC/Chem/UA Pattern Drill', type: 'resource', url: '/study/wordweb/#pathology', estimatedTime: '25min' }
            ]
        },
        {
            id: 'ethics_and_exam',
            title: 'Ethics, Public Health, and Exam Strategy',
            description: 'VCPR, legal and public-health duties, formulas, checklists, and test-taking frameworks.',
            items: [
                { id: 'ethics_public_health', title: 'Ethics and Public Health Review', type: 'resource', url: '/study/wordweb/#ethics', estimatedTime: '30min' },
                { id: 'top_checklists', title: 'Must-Know Disease Checklists', type: 'resource', url: '/study/wordweb/#top-checklists', estimatedTime: '25min' },
                { id: 'diagnostic_templates', title: 'Diagnostic Template Drill', type: 'resource', url: '/study/wordweb/#diagnostic-templates', estimatedTime: '20min' },
                { id: 'treatment_algorithms', title: 'Treatment Algorithm Drill', type: 'resource', url: '/study/wordweb/#treatment-algorithms', estimatedTime: '25min' },
                { id: 'high_yield_drug_review', title: 'High-Yield Drug and Contraindication Review', type: 'resource', url: '/study/wordweb/#high-yield-drugs', estimatedTime: '30min' },
                { id: 'test_strategy_review', title: 'NAVLE Test Strategy and Final Checklist', type: 'resource', url: '/study/wordweb/#test-strategy', estimatedTime: '20min' },
                { id: 'pattern_recognition_review', title: 'Pattern Recognition and Commonly Confused Concepts', type: 'resource', url: '/study/wordweb/#pattern-recognition', estimatedTime: '25min' }
            ]
        },
        {
            id: 'reference_and_calculations',
            title: 'Reference Pack: Doses, Normals, Formulas',
            description: 'Quick-reference anchors for emergency doses, normal parameters, formulas, and abbreviations.',
            items: [
                { id: 'emergency_dose_sheet', title: 'Emergency Dose Quick Sheet', type: 'resource', url: '/study/wordweb/#emergency-doses', estimatedTime: '15min' },
                { id: 'normal_parameters_sheet', title: 'Normal Parameters by Species', type: 'resource', url: '/study/wordweb/#normal-parameters', estimatedTime: '15min' },
                { id: 'clinical_formula_sheet', title: 'Clinical Formula and Calculation Drill', type: 'resource', url: '/study/wordweb/#clinical-formulas', estimatedTime: '20min' },
                { id: 'abbreviation_sheet', title: 'Clinical and Prescription Abbreviation Drill', type: 'resource', url: '/study/wordweb/#abbreviations', estimatedTime: '15min' },
                { id: 'breed_predisposition_sheet', title: 'Breed Predisposition Rapid Review', type: 'resource', url: '/study/wordweb/#breed-predispositions', estimatedTime: '20min' }
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

    function triggerBackgroundSync(trigger) {
        if (!window.pcSync || typeof window.pcSync.syncToServer !== 'function') {
            return;
        }

        window.pcSync.syncToServer({ trigger: trigger || 'study_update' }).catch(function () {
            // Study updates stay local-first if sync fails.
        });
    }

    function savePlan(plan, options) {
        var settings = options || {};
        state.plan = plan;
        safeSetItem(STORAGE_KEY, JSON.stringify(plan));

        if (settings.markDirty === true && window.pcStorage && typeof window.pcStorage.touchField === 'function') {
            window.pcStorage.touchField('study_plan');
        }

        if (settings.sync === true) {
            triggerBackgroundSync(settings.syncTrigger || 'study_progress_update');
        }
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

            html += '<article class="pc-study-topic pc-study-plan-card">';
            html += '<label class="pc-topic-checkbox">';
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
                html += '<label class="pc-topic-checkbox' + (checked ? ' pc-topic-checkbox--completed' : '') + '">';
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

        savePlan(state.plan, {
            markDirty: true,
            sync: true,
            syncTrigger: 'study_topic_update'
        });
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

        savePlan(state.plan, {
            markDirty: true,
            sync: true,
            syncTrigger: 'study_item_update'
        });
        renderAll();
    }

    function applyPlan(planId) {
        state.plan = createPlan(planId, state.plan);
        savePlan(state.plan, {
            markDirty: true,
            sync: true,
            syncTrigger: 'study_plan_switch'
        });
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
        savePlan(state.plan, {
            markDirty: false,
            sync: false
        });

        bindEvents();
        renderAll();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
