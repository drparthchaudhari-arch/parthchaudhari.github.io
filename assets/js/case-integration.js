(function () {
    'use strict';

    var CASE_CONFIG = {
        'dka-dog.html': {
            caseId: 'dka_canine_001',
            title: 'Canine Diabetic Ketoacidosis',
            patient: {
                species: 'canine',
                weightKg: 28,
                dehydrationPercent: 8
            },
            decisionPoints: [
                'Step 1: Confirm fluid deficit and first-hour fluid target.',
                'Step 2: Start insulin only after initial fluid stabilization.',
                'Step 3: Recheck BG and electrolytes every 2-4 hours.'
            ],
            tools: [
                {
                    id: 'fluid_calculator',
                    label: 'Fluid Calculator',
                    href: '/tools/fluid-calculator.html',
                    summary: 'Preloaded for this 28 kg patient with 8% dehydration.',
                    params: { weight: 28, dehydration: 8, maintenance: 60, auto: 1 }
                },
                {
                    id: 'insulin_cri',
                    label: 'Insulin CRI Planner',
                    href: '/tools/insulin-cri-planner.html',
                    summary: 'Prefilled insulin CRI baseline for DKA workflow.',
                    params: { weight: 28, dose: 0.08, bag: 250, units: 2.5, bg: 450, auto: 1 }
                },
                {
                    id: 'acid_base',
                    label: 'Acid-Base Electrolyte Tool',
                    href: '/tools/acid-base-electrolyte.html',
                    summary: 'Use this after initial stabilization to interpret derangements.',
                    params: {}
                },
                {
                    id: 'potassium_planner',
                    label: 'Electrolyte Replacement Planner',
                    href: '/tools/electrolyte-replacement-planner.html',
                    summary: 'Plan potassium/phosphorus support alongside insulin.',
                    params: {}
                }
            ]
        },
        'chf-dog.html': {
            caseId: 'chf_canine_001',
            title: 'Canine Congestive Heart Failure',
            patient: {
                species: 'canine',
                weightKg: 33
            },
            decisionPoints: [
                'Step 1: Confirm cardiogenic pattern versus primary respiratory disease.',
                'Step 2: Estimate immediate congestion severity and stage pattern.',
                'Step 3: Define recheck interval based on response and risk.'
            ],
            tools: [
                {
                    id: 'chf_stage',
                    label: 'CHF Staging Planner',
                    href: '/tools/chf-staging-planner.html',
                    summary: 'Preloaded with symptomatic CHF-compatible findings.',
                    params: { signs: 1, edema: 1, remodeling: 1, auto: 1 }
                },
                {
                    id: 'emergency_chart',
                    label: 'Emergency Drug Chart',
                    href: '/tools/emergency-drug-chart.html',
                    summary: 'Cardiopulmonary emergency references for clinic use.',
                    params: {}
                },
                {
                    id: 'sepsis_bundle',
                    label: 'Sepsis Bundle Planner',
                    href: '/tools/sepsis-bundle-planner.html',
                    summary: 'Rule-in/rule-out systemic instability in dyspneic patients.',
                    params: {}
                }
            ]
        },
        'feline-hyperthyroid.html': {
            caseId: 'hyperthyroid_feline_001',
            title: 'Feline Hyperthyroidism',
            patient: {
                species: 'feline',
                weightKg: 4.2
            },
            decisionPoints: [
                'Step 1: Confirm endocrine diagnosis and baseline risk profile.',
                'Step 2: Track body condition and nutritional recovery targets.',
                'Step 3: Monitor blood pressure and systemic consequences.'
            ],
            tools: [
                {
                    id: 'nutrition',
                    label: 'Nutrition RER/MER Calculator',
                    href: '/tools/nutrition-rer-mer-calculator.html',
                    summary: 'Estimate intake targets during endocrine stabilization.',
                    params: {}
                },
                {
                    id: 'normal_values',
                    label: 'Normal Lab Values',
                    href: '/reference/normal-values.html',
                    summary: 'Quick lab baseline context for interpretation.',
                    params: {}
                },
                {
                    id: 'topic_guide',
                    label: 'Hypertension Target Organ Damage Guide',
                    href: '/systemic-hypertension-target-organ-damage/',
                    summary: 'Case-linked study guide for cardiovascular complications.',
                    params: {}
                }
            ]
        },
        'bovine-mastitis.html': {
            caseId: 'mastitis_bovine_001',
            title: 'Bovine Clinical Mastitis',
            patient: {
                species: 'bovine'
            },
            decisionPoints: [
                'Step 1: Confirm quarter-level diagnosis and severity.',
                'Step 2: Collect sterile milk sample before final antimicrobial choice.',
                'Step 3: Align individual treatment with herd-level prevention.'
            ],
            tools: [
                {
                    id: 'unit_converter',
                    label: 'Unit Converter',
                    href: '/tools/unit-converter.html',
                    summary: 'Convert concentrations and dosing units rapidly.',
                    params: {}
                },
                {
                    id: 'discharge',
                    label: 'Discharge Generator',
                    href: '/tools/discharge-generator.html',
                    summary: 'Create owner communication and follow-up structure.',
                    params: {}
                },
                {
                    id: 'lab_protocols',
                    label: 'Lab Interpretation Caveats',
                    href: '/lab-interpretation-caveats/',
                    summary: 'Reference interpretation pitfalls while awaiting culture data.',
                    params: {}
                }
            ]
        }
    };

    function getPageKey() {
        var path = window.location.pathname || '';
        var parts = path.split('/');
        return parts.length ? parts[parts.length - 1] : '';
    }

    function getConfig() {
        return CASE_CONFIG[getPageKey()] || null;
    }

    function renderStats(encounterId, node) {
        if (!node || !window.pcIntegration || typeof window.pcIntegration.getEncounter !== 'function') {
            return;
        }

        var encounter = window.pcIntegration.getEncounter(encounterId);
        if (!encounter) {
            node.textContent = 'Encounter not found.';
            return;
        }

        var calcCount = Array.isArray(encounter.calculations) ? encounter.calculations.length : 0;
        var eventCount = Array.isArray(encounter.events) ? encounter.events.length : 0;
        node.textContent = 'Encounter log: ' + calcCount + ' calculations and ' + eventCount + ' timeline events captured.';
    }

    function createPanel(config, encounter) {
        var panel = document.createElement('section');
        panel.className = 'pc-case-section pc-card pc-case-intel';
        panel.setAttribute('aria-labelledby', 'pc-case-intel-title');

        var header = document.createElement('header');
        header.className = 'pc-case-intel__header';
        header.innerHTML =
            '<p class="pc-kicker">Phase 4 Live</p>' +
            '<h2 id="pc-case-intel-title">Case-Linked Calculator Workspace</h2>' +
            '<p class="pc-case-intel__meta">Encounter ID: <code>' + encounter.id + '</code></p>';

        var grid = document.createElement('div');
        grid.className = 'pc-case-intel__grid';

        var toolsCard = document.createElement('article');
        toolsCard.className = 'pc-tool-module';
        toolsCard.innerHTML = '<h3>Recommended Calculators</h3>';
        var toolsList = document.createElement('ul');
        toolsList.className = 'pc-case-intel__list';

        var decisionsCard = document.createElement('article');
        decisionsCard.className = 'pc-tool-module';
        decisionsCard.innerHTML = '<h3>Decision Checkpoints</h3>';
        var decisionsList = document.createElement('ol');
        decisionsList.className = 'pc-case-intel__list pc-case-intel__list--ordered';

        var i;
        for (i = 0; i < config.tools.length; i += 1) {
            var tool = config.tools[i];
            var item = document.createElement('li');
            item.className = 'pc-case-intel__item';

            var link = document.createElement('a');
            link.className = 'pc-link-chip pc-link-chip--primary';
            link.textContent = tool.label;

            if (window.pcIntegration && typeof window.pcIntegration.buildPrefillUrl === 'function') {
                link.href = window.pcIntegration.buildPrefillUrl(tool.href, tool.params || {}, {
                    caseId: config.caseId,
                    encounterId: encounter.id
                });
            } else {
                link.href = tool.href;
            }

            (function (selectedTool, targetHref) {
                link.addEventListener('click', function () {
                    if (window.pcIntegration && typeof window.pcIntegration.logCaseAction === 'function') {
                        window.pcIntegration.logCaseAction({
                            encounterId: encounter.id,
                            caseId: config.caseId,
                            caseTitle: config.title,
                            action: 'calculator_launch',
                            source: 'case_workspace',
                            details: {
                                calculatorId: selectedTool.id,
                                calculatorLabel: selectedTool.label,
                                href: targetHref
                            }
                        });
                    }
                });
            })(tool, link.href);

            var detail = document.createElement('p');
            detail.className = 'pc-case-intel__summary';
            detail.textContent = tool.summary;

            item.appendChild(link);
            item.appendChild(detail);
            toolsList.appendChild(item);
        }

        for (i = 0; i < config.decisionPoints.length; i += 1) {
            var decision = document.createElement('li');
            decision.className = 'pc-case-intel__item';
            decision.textContent = config.decisionPoints[i];
            decisionsList.appendChild(decision);
        }

        toolsCard.appendChild(toolsList);
        decisionsCard.appendChild(decisionsList);
        grid.appendChild(toolsCard);
        grid.appendChild(decisionsCard);

        var actions = document.createElement('div');
        actions.className = 'pc-panel-actions';
        actions.innerHTML =
            '<button type="button" class="pc-btn pc-btn--secondary" data-pc-export-json>Export Encounter JSON</button>' +
            '<button type="button" class="pc-btn pc-btn--secondary" data-pc-export-csv>Export Encounter CSV</button>';

        var stats = document.createElement('p');
        stats.className = 'pc-calculator-note';
        stats.setAttribute('data-pc-encounter-stats', '');

        panel.appendChild(header);
        panel.appendChild(grid);
        panel.appendChild(actions);
        panel.appendChild(stats);

        renderStats(encounter.id, stats);

        actions.querySelector('[data-pc-export-json]').addEventListener('click', function () {
            if (window.pcIntegration && typeof window.pcIntegration.exportEncounter === 'function') {
                window.pcIntegration.exportEncounter(encounter.id, 'json');
                renderStats(encounter.id, stats);
            }
        });

        actions.querySelector('[data-pc-export-csv]').addEventListener('click', function () {
            if (window.pcIntegration && typeof window.pcIntegration.exportEncounter === 'function') {
                window.pcIntegration.exportEncounter(encounter.id, 'csv');
                renderStats(encounter.id, stats);
            }
        });

        window.addEventListener('focus', function () {
            renderStats(encounter.id, stats);
        });

        return panel;
    }

    function insertPanel(panel) {
        var article = document.querySelector('.pc-case-article');
        if (!article) {
            return;
        }

        var diagnoseBox = article.querySelector('.pc-diagnose-box');
        if (diagnoseBox && diagnoseBox.parentNode) {
            if (diagnoseBox.nextSibling) {
                diagnoseBox.parentNode.insertBefore(panel, diagnoseBox.nextSibling);
            } else {
                diagnoseBox.parentNode.appendChild(panel);
            }
            return;
        }

        var disclaimer = article.querySelector('.pc-disclaimer');
        if (disclaimer && disclaimer.parentNode) {
            disclaimer.parentNode.insertBefore(panel, disclaimer);
            return;
        }

        article.appendChild(panel);
    }

    function bindDiagnoseTracking(config, encounter) {
        var buttons = document.querySelectorAll('[id$="-check-btn"]');
        var i;

        for (i = 0; i < buttons.length; i += 1) {
            buttons[i].addEventListener('click', function () {
                var button = this;

                window.setTimeout(function () {
                    var container = button.closest('.pc-diagnose-container');
                    if (!container || !window.pcIntegration || typeof window.pcIntegration.logCaseAction !== 'function') {
                        return;
                    }

                    var selected = container.querySelector('input[type="radio"]:checked');
                    var questionNode = container.querySelector('.pc-diagnose-question');
                    var feedbackTitle = container.querySelector('.pc-diagnose-feedback h4');
                    var feedbackText = feedbackTitle ? String(feedbackTitle.textContent || '').toLowerCase() : '';
                    var outcome = 'unknown';

                    if (feedbackText.indexOf('correct') !== -1) {
                        outcome = 'correct';
                    } else if (feedbackText.indexOf('not the best') !== -1 || feedbackText.indexOf('not') !== -1) {
                        outcome = 'incorrect';
                    }

                    window.pcIntegration.logCaseAction({
                        encounterId: encounter.id,
                        caseId: config.caseId,
                        caseTitle: config.title,
                        action: 'diagnose_submit',
                        source: 'diagnose_block',
                        details: {
                            selectedOption: selected ? selected.value : '',
                            outcome: outcome,
                            question: questionNode ? questionNode.textContent.trim() : ''
                        }
                    });
                }, 80);
            });
        }
    }

    function init() {
        if (!window.pcIntegration || typeof window.pcIntegration.ensureEncounter !== 'function') {
            return;
        }

        var config = getConfig();
        if (!config) {
            return;
        }

        var encounter = window.pcIntegration.ensureEncounter({
            caseId: config.caseId,
            caseTitle: config.title,
            patient: config.patient,
            source: 'case_page'
        });

        if (!encounter) {
            return;
        }

        window.pcIntegration.logCaseOpen({
            caseId: config.caseId,
            caseTitle: config.title,
            encounterId: encounter.id,
            patient: config.patient
        });

        var panel = createPanel(config, encounter);
        insertPanel(panel);
        bindDiagnoseTracking(config, encounter);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
