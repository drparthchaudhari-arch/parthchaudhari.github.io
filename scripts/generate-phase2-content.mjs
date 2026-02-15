import { mkdirSync, writeFileSync } from 'node:fs'

const LAST_REVIEWED = 'February 13, 2026'
const BASE_URL = 'https://parthchaudhari.com'

const approvedReferences = [
  'Drug label search (DailyMed)',
  'IRIS stages',
  'Normal lab values',
  'Heartworm treatment protocol',
  'Lab test protocols',
  'Microchip lookup',
  'Vertebral Heart Score',
  'BCS charts',
  'ACVIM cardiology consensus guideline references',
  'Dental charts',
  'AAHA vaccination guidelines',
  'Flea/tick product info',
  'Dog/cat breed search',
  'RECOVER CPR guidelines',
]

function toPath(slug) {
  return slug === '/' ? '/' : `/${slug.replace(/^\/|\/$/g, '')}/`
}

function dirFromSlug(slug) {
  return slug.replace(/^\//, '').replace(/\/$/, '')
}

function wrapPage({
  title,
  description,
  canonicalPath,
  bodyClass,
  mainClass,
  jsonLd,
  content,
}) {
  const canonical = `${BASE_URL}${canonicalPath}`
  const ld = jsonLd
    ? `\n    <script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 4)}\n    </script>`
    : ''
  return `<!DOCTYPE html>
<html lang="en" data-mode="pro" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/svg+xml" href="/assets/img/vet-favicon.svg">
    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:url" content="${canonical}">
    <link rel="canonical" href="${canonical}">${ld}
    <link rel="preload" href="/assets/css/tokens.css" as="style">
    <link rel="preload" href="/assets/css/portal.css" as="style">
    <link rel="stylesheet" href="/assets/css/tokens.css">
    <link rel="stylesheet" href="/assets/css/portal.css">
    <script src="/assets/js/theme-toggle.js" defer></script>
    <script src="/assets/js/nav-status.js" defer></script>
</head>
<body class="${bodyClass}">
    <a class="pc-skip-link" href="#pc-main">Skip to main content</a>
    <nav class="pc-portal-nav" aria-label="Global portal navigation">
        <div class="pc-portal-nav__inner">
            <a class="pc-logo" href="/">VetLudics</a>
            <div class="pc-nav-group">
                <button type="button" class="pc-nav-toggle" data-pc-mode-toggle aria-label="Toggle professional or play mode">
                    <span class="pc-nav-toggle__label" data-pc-mode-label>Mode: Professional</span>
                </button>
                <button type="button" class="pc-nav-toggle" data-pc-theme-toggle aria-label="Toggle day or night theme">
                    <span class="pc-nav-toggle__label" data-pc-theme-label>Theme: Day</span>
                </button>
            </div>
        </div>
    </nav>

    <main id="pc-main" class="${mainClass}" role="main">
${content}
    </main>
</body>
</html>
`
}

function listItems(items) {
  return items.map((item) => `                <li>${item}</li>`).join('\n')
}

function linkListItems(items) {
  return items
    .map(
      (item) =>
        `                <li><a href="${item.href}">${item.label}</a></li>`
    )
    .join('\n')
}

function renderSources() {
  return `        <section class="pc-bridge-section" aria-label="Sources and review notes">
            <h2 class="pc-bridge-title">Sources and Review Notes</h2>
            <ul class="pc-link-list">
${listItems(approvedReferences)}
            </ul>
            <p class="pc-last-reviewed">Last reviewed: ${LAST_REVIEWED}</p>
            <div class="pc-note-box">
                <p>Educational only. This page is designed for study and does not replace case-specific diagnosis, local protocols, or direct supervision.</p>
            </div>
        </section>`
}

function renderTopicGuidePage(page, siblings) {
  const siblingLinks = siblings.map((item) => ({
    href: toPath(item.slug),
    label: item.h1,
  }))
  const related = [
    {
      href: toPath(page.pillar.slug),
      label: `Return to pillar: ${page.pillar.h1}`,
    },
    ...siblingLinks,
    { href: page.tool.href, label: page.tool.label },
    {
      href: '/study/navle/practice/',
      label: 'Try 5 free practice questions on this topic',
    },
    { href: '/pricing/', label: 'Unlock unlimited practice (Premium)' },
  ]

  const content = `        <section class="pc-bridge-hero">
            <p class="pc-kicker">${page.kicker}</p>
            <h1 class="pc-fork-title">${page.h1}</h1>
            <p class="pc-fork-copy">${page.intro}</p>
            <p class="pc-fork-copy">Use this guide to move from first-pass pattern recognition to structured diagnostic and treatment logic. The flow is designed for NAVLE-style decision sequencing and practical ward preparation.</p>
            <div class="pc-cta-banner" aria-label="Primary study CTA">
                <p class="pc-cta-banner__text">Start here: answer 5 free practice questions on this topic, then upgrade for unlimited question sets and deeper tracking.</p>
                <div class="pc-panel-actions">
                    <a class="pc-btn" href="/study/navle/practice/">Try 5 Free Questions</a>
                    <a class="pc-btn pc-btn--secondary" href="/pricing/">Premium Benefits</a>
                </div>
            </div>
        </section>

        <section class="pc-bridge-section" aria-label="Rapid algorithm">
            <h2 class="pc-bridge-title">Rapid Algorithm</h2>
            <ul class="pc-link-list">
${listItems(page.algorithm)}
            </ul>
        </section>

        <section class="pc-bridge-section" aria-label="Diagnostic flow">
            <h2 class="pc-bridge-title">Diagnostic Flow</h2>
            <ul class="pc-link-list">
${listItems(page.diagnostics)}
            </ul>
        </section>

        <section class="pc-bridge-section" aria-label="Treatment flow">
            <h2 class="pc-bridge-title">Treatment Flow</h2>
            <ul class="pc-link-list">
${listItems(page.treatment)}
            </ul>
        </section>

        <section class="pc-bridge-section" aria-label="Exam traps">
            <h2 class="pc-bridge-title">Exam Traps</h2>
            <ul class="pc-link-list">
${listItems(page.examTraps)}
            </ul>
        </section>

        <section class="pc-bridge-section" aria-label="Practice prompts">
            <h2 class="pc-bridge-title">Practice Prompts</h2>
            <ul class="pc-link-list">
${page.prompts.map((prompt) => `                <li><a href="/study/navle/practice/">${prompt}</a></li>`).join('\n')}
            </ul>
        </section>

        <section class="pc-bridge-section" aria-label="Related content">
            <h2 class="pc-bridge-title">Related Content</h2>
            <ul class="pc-link-list">
${linkListItems(related)}
            </ul>
        </section>

${renderSources()}`

  return wrapPage({
    title: page.title,
    description: page.description,
    canonicalPath: toPath(page.slug),
    bodyClass: 'pc-page pc-page--study',
    mainClass: 'pc-bridge-shell',
    content,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: page.h1,
      description: page.description,
      author: {
        '@type': 'Person',
        name: 'Parth Chaudhari',
      },
      dateModified: '2026-02-13',
      datePublished: '2026-02-13',
    },
  })
}

function renderToolGuidePage(page, siblings) {
  const siblingLinks = siblings.map((item) => ({
    href: toPath(item.slug),
    label: item.h1,
  }))
  const related = [
    {
      href: toPath(page.pillar.slug),
      label: `Return to pillar: ${page.pillar.h1}`,
    },
    ...siblingLinks,
    { href: page.tool.href, label: page.tool.label },
    ...page.topicLinks,
    page.referenceLink,
    { href: '/pricing/', label: 'Unlock unlimited practice (Premium)' },
  ]

  const inputRows = page.inputs
    .map(
      (row) =>
        `                        <tr><td>${row.name}</td><td>${row.definition}</td></tr>`
    )
    .join('\n')
  const outputRows = page.outputs
    .map(
      (row) =>
        `                        <tr><td>${row.name}</td><td>${row.definition}</td></tr>`
    )
    .join('\n')

  const content = `        <section class="pc-bridge-hero">
            <p class="pc-kicker">Clinical Calculator Guide</p>
            <h1 class="pc-fork-title">${page.h1}</h1>
            <p class="pc-fork-copy">${page.intro}</p>
            <div class="pc-panel-actions">
                <a class="pc-btn" href="${page.tool.href}">${page.tool.label}</a>
                <a class="pc-btn pc-btn--secondary" href="/study/navle/practice/">Study the Concept</a>
                <a class="pc-btn pc-btn--secondary" href="/pricing/">Unlock Unlimited Practice (Premium)</a>
            </div>
            <p class="pc-last-reviewed">Last reviewed: ${LAST_REVIEWED}</p>
        </section>

        <section class="pc-bridge-section" aria-label="What this guide does">
            <h2 class="pc-bridge-title">What This Guide Does</h2>
            <p class="pc-fork-copy">${page.whatItDoes}</p>
            <p class="pc-fork-copy">The objective is to reduce arithmetic errors, improve clinical consistency, and connect each formula to a practical interpretation step.</p>
        </section>

        <section class="pc-bridge-section" aria-label="How to use this guide">
            <h2 class="pc-bridge-title">How to Use This Guide in Study Blocks</h2>
            <p class="pc-fork-copy">Run one worked example manually, then verify it in the linked tool. Next, answer practice questions that force you to apply the same concept under time pressure. This sequence builds speed and reliability for exam scenarios while also improving day-to-day calculation safety in supervised clinical settings.</p>
        </section>

        <section class="pc-bridge-section" aria-label="Inputs and outputs">
            <h2 class="pc-bridge-title">Inputs and Outputs</h2>
            <div class="pc-table-wrap">
                <table class="pc-table">
                    <thead>
                        <tr><th>Input</th><th>Definition</th></tr>
                    </thead>
                    <tbody>
${inputRows}
                    </tbody>
                </table>
            </div>
            <div class="pc-table-wrap" style="margin-top: 0.8rem;">
                <table class="pc-table">
                    <thead>
                        <tr><th>Output</th><th>Definition</th></tr>
                    </thead>
                    <tbody>
${outputRows}
                    </tbody>
                </table>
            </div>
        </section>

        <section class="pc-bridge-section" aria-label="Formula summary">
            <h2 class="pc-bridge-title">Formula Summary (High Level)</h2>
            <p class="pc-fork-copy">${page.formulaSummary}</p>
        </section>

        <section class="pc-bridge-section" aria-label="Worked example">
            <h2 class="pc-bridge-title">Example Calculation</h2>
            <ol class="pc-link-list">
${listItems(page.exampleSteps)}
            </ol>
        </section>

        <section class="pc-bridge-section" aria-label="Pitfalls and safety">
            <h2 class="pc-bridge-title">Common Pitfalls and Safety Checks</h2>
            <ul class="pc-link-list">
${listItems(page.pitfalls)}
            </ul>
        </section>

        <section class="pc-bridge-section" aria-label="Related content">
            <h2 class="pc-bridge-title">Related Content</h2>
            <ul class="pc-link-list">
${linkListItems(related)}
            </ul>
        </section>

${renderSources()}`

  return wrapPage({
    title: page.title,
    description: page.description,
    canonicalPath: toPath(page.slug),
    bodyClass: 'pc-page pc-page--study',
    mainClass: 'pc-bridge-shell',
    content,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: page.h1,
      description: page.description,
      author: {
        '@type': 'Person',
        name: 'Parth Chaudhari',
      },
      dateModified: '2026-02-13',
      datePublished: '2026-02-13',
    },
  })
}

function renderPillarPage(pillar, supportPages, extraLinks) {
  const supportList = supportPages
    .map((page) => ({
      href: toPath(page.slug),
      label: page.h1,
      desc: page.summary,
    }))
    .map(
      (item) =>
        `                <article class="pc-bridge-card"><h3><a href="${item.href}">${item.label}</a></h3><p>${item.desc}</p></article>`
    )
    .join('\n')

  const content = `        <section class="pc-bridge-hero">
            <p class="pc-kicker">Pillar Guide</p>
            <h1 class="pc-fork-title">${pillar.h1}</h1>
            <p class="pc-fork-copy">${pillar.intro}</p>
            <div class="pc-cta-banner" aria-label="Pillar CTA">
                <p class="pc-cta-banner__text">Start here: follow this page in order, then move into linked support guides. Premium unlocks unlimited practice and deeper progress tracking.</p>
                <div class="pc-panel-actions">
                    <a class="pc-btn" href="/study/navle/practice/">Start Here</a>
                    <a class="pc-btn pc-btn--secondary" href="/pricing/">Premium Benefits</a>
                </div>
            </div>
            <p class="pc-last-reviewed">Last reviewed: ${LAST_REVIEWED}</p>
        </section>

        <section class="pc-bridge-section" aria-label="Core workflow">
            <h2 class="pc-bridge-title">Core Workflow</h2>
            <ol class="pc-link-list">
${listItems(pillar.workflow)}
            </ol>
        </section>

        <section class="pc-bridge-section" aria-label="How to use this pillar">
            <h2 class="pc-bridge-title">How to Use This Pillar Efficiently</h2>
            <p class="pc-fork-copy">Use the pillar as your weekly orientation map, then complete two or three support pages in depth. Follow each reading block with targeted practice questions and one practical tool session. This loop turns broad review into measurable progress and keeps internal links aligned with real learning outcomes.</p>
        </section>

        <section class="pc-bridge-section" aria-label="Support guides in this cluster">
            <h2 class="pc-bridge-title">Support Guides in This Cluster</h2>
            <div class="pc-bridge-card-grid">
${supportList}
            </div>
        </section>

        <section class="pc-bridge-section" aria-label="Recommended next steps">
            <h2 class="pc-bridge-title">Recommended Next Steps</h2>
            <ul class="pc-link-list">
${linkListItems(extraLinks)}
            </ul>
        </section>

${renderSources()}`

  return wrapPage({
    title: pillar.title,
    description: pillar.description,
    canonicalPath: toPath(pillar.slug),
    bodyClass: 'pc-page pc-page--study',
    mainClass: 'pc-bridge-shell',
    content,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: pillar.h1,
      description: pillar.description,
      author: {
        '@type': 'Person',
        name: 'Parth Chaudhari',
      },
      dateModified: '2026-02-13',
      datePublished: '2026-02-13',
    },
  })
}

const emergencyPillar = {
  slug: 'navle-emergency-critical-care',
  title: 'NAVLE Emergency and Critical Care Guide – VetLudics',
  description:
    'Use this NAVLE emergency and critical care pillar to move from triage through stabilization and treatment priorities with linked veterinary support guides.',
  h1: 'NAVLE Emergency and Critical Care: Triage, Stabilize, Treat',
  intro:
    'This pillar page is built for veterinary learners who need a practical emergency framework that is both exam-ready and clinically useful. Start with triage logic, move to stabilization priorities, and then apply treatment sequencing using the linked support pages.',
  workflow: [
    'Identify airway, breathing, circulation threats before choosing a disease label.',
    'Stabilize oxygen delivery, perfusion, and immediate life-threatening derangements first.',
    'Use focused diagnostics to confirm priorities rather than delay treatment decisions.',
    'Reassess frequently and escalate if perfusion, mentation, or respiratory effort worsens.',
  ],
}

const emergencySupports = [
  {
    slug: 'gdv-approach',
    title: 'GDV Approach in Dogs – VetLudics',
    description:
      'Review canine GDV triage, decompression timing, shock stabilization, and surgery preparation with NAVLE-focused exam traps, prompts, and linked emergency tools.',
    h1: 'GDV Approach in Dogs: Triage to Surgical Stabilization',
    summary:
      'Rapid triage, decompression priorities, shock resuscitation, and surgical timing for suspected GDV.',
    kicker: 'NAVLE Emergency Guide',
    intro:
      'GDV is a high-consequence emergency where delays in stabilization can rapidly worsen perfusion and tissue injury. This guide helps you prioritize decompression, perfusion support, and surgical readiness in a repeatable sequence.',
    algorithm: [
      'Recognize abdominal distension, unproductive retching, and progressive shock risk immediately.',
      'Provide oxygen and place large-bore IV access while preparing decompression supplies.',
      'Start perfusion-guided fluid resuscitation in aliquots and reassess mentation and pulse quality after each bolus.',
      'Decompress the stomach as soon as feasible with orogastric tube or trocarization when indicated.',
      'Transition to definitive surgery planning after initial stabilization milestones are met.',
    ],
    diagnostics: [
      'Confirm perfusion status with serial heart rate, pulse quality, lactate trend, and blood pressure.',
      'Thoracic and abdominal imaging support diagnosis and concurrent risk assessment once the patient is safer.',
      'ECG monitoring is important because ventricular arrhythmias may emerge during reperfusion.',
      'Baseline CBC, chemistry, and acid-base data help guide ongoing fluid and electrolyte adjustments.',
      'Monitor urine output and mentation trajectory as practical shock response indicators.',
    ],
    treatment: [
      'Treat shock early and reassess each intervention before increasing fluid intensity.',
      'Provide analgesia and stress-minimizing handling during stabilization and prep.',
      'Coordinate antiemetic and gastroprotective support after hemodynamic priorities are addressed.',
      'Prepare for anesthesia with awareness of reperfusion injury and arrhythmia risk.',
      'Plan postoperative monitoring for rhythm changes, pain, and gastric motility concerns.',
    ],
    examTraps: [
      'Waiting for full diagnostics before decompression in an unstable dog is a common exam error.',
      'Large single fluid boluses without reassessment can miss evolving cardiopulmonary limits.',
      'Ignoring ECG monitoring after decompression can delay arrhythmia recognition.',
      'Confusing chronic bloat history with lower acute risk can cause under-triage.',
      'Assuming early improvement removes surgical need can produce management drift.',
    ],
    prompts: [
      'Which first-hour step is most time-sensitive in unstable GDV with poor perfusion?',
      'How do you sequence decompression and fluid therapy when blood pressure is low?',
      'What ECG trend most changes your immediate stabilization plan in GDV?',
      'Which findings support transition from stabilization to anesthetic planning?',
      'What are the most common post-op complications to monitor after GDV surgery?',
    ],
    tool: {
      href: '/tools/fluid-calculator.html',
      label: 'Use the Fluid Calculator for shock aliquots',
    },
    pillar: emergencyPillar,
    primaryQuery: 'gdv approach dog',
    secondaryQueries: [
      'dog bloat emergency protocol',
      'gdv stabilization steps',
      'gdv first hour management',
    ],
    paa: [
      'What is the first step in suspected GDV?',
      'When should decompression happen in GDV?',
      'How much fluid should be given in GDV shock?',
    ],
    intent: 'informational',
  },
  {
    slug: 'shock-types-veterinary',
    title: 'Veterinary Shock Types and Approach – VetLudics',
    description:
      'Understand hypovolemic, distributive, cardiogenic, and obstructive shock patterns with practical triage and treatment sequencing for NAVLE preparation.',
    h1: 'Veterinary Shock Types: Practical Triage and Treatment Flow',
    summary:
      'Differentiate shock phenotypes quickly and choose first-line stabilization actions.',
    kicker: 'NAVLE Emergency Guide',
    intro:
      'Shock questions often test whether you can separate perfusion failure patterns and act before complete diagnostic certainty. This guide focuses on the practical differences that change treatment in the first hour.',
    algorithm: [
      'Identify perfusion failure using mentation, pulse quality, capillary refill trends, temperature gradients, and blood pressure.',
      'Classify likely shock pattern: hypovolemic, distributive, cardiogenic, or obstructive.',
      'Start targeted stabilization while avoiding interventions that worsen the likely phenotype.',
      'Use dynamic reassessment to refine diagnosis as monitoring data accumulates.',
      'Escalate support when perfusion markers remain poor after first-line interventions.',
    ],
    diagnostics: [
      'Point-of-care lactate and serial trends can be useful but should not delay initial support.',
      'Focused ultrasound and thoracic imaging can reveal obstructive or cardiogenic contributors.',
      'Baseline CBC and chemistry guide fluid, transfusion, and electrolyte decisions.',
      'Urine output and blood pressure trajectories provide objective response checkpoints.',
      'Recheck perfusion markers after each major intervention to avoid false reassurance.',
    ],
    treatment: [
      'Hypovolemic shock usually needs volume replacement plus source control of fluid or blood loss.',
      'Distributive shock often requires early antimicrobials when sepsis is suspected and perfusion-guided fluids.',
      'Cardiogenic shock requires caution with fluid loading and early support of cardiac output strategies.',
      'Obstructive shock demands rapid identification and relief of the mechanical barrier.',
      'Use vasopressors or inotropes when perfusion remains poor after appropriate first-line measures.',
    ],
    examTraps: [
      'Applying the same fluid plan to every shock phenotype is a frequent scoring loss.',
      'Overvaluing a single blood pressure reading without clinical context can mislead decisions.',
      'Failing to reassess after each bolus prevents phenotype correction when the response diverges.',
      'Delaying sepsis-directed actions while waiting for culture confirmation can harm outcomes.',
      'Ignoring obstructive causes in sudden decompensation leads to repeated ineffective boluses.',
    ],
    prompts: [
      'How does your first-line plan differ between hypovolemic and cardiogenic shock?',
      'Which findings shift your concern toward obstructive shock?',
      'When should vasopressors be considered in distributive shock?',
      'What reassessment metrics matter most after the first bolus?',
      'How can serial lactate improve decision quality without overreliance?',
    ],
    tool: {
      href: '/tools/fluid-calculator.html',
      label: 'Use the Fluid Calculator for perfusion-guided boluses',
    },
    pillar: emergencyPillar,
    primaryQuery: 'types of shock in veterinary medicine',
    secondaryQueries: [
      'veterinary shock algorithm',
      'hypovolemic vs cardiogenic shock dog',
      'shock treatment steps vet',
    ],
    paa: [
      'How do you tell shock types apart in dogs?',
      'What is the first treatment for shock in veterinary patients?',
      'When should vasopressors be used in shock?',
    ],
    intent: 'informational',
  },
  {
    slug: 'sepsis-sirs-veterinary',
    title: 'Sepsis and SIRS in Veterinary Patients – VetLudics',
    description:
      'Study sepsis and SIRS triage, diagnostic reasoning, and hour-one treatment priorities for veterinary emergency workflows and NAVLE exam prep.',
    h1: 'Sepsis and SIRS in Veterinary Patients: Hour-One Priorities',
    summary:
      'Recognize sepsis risk, start early support, and avoid delayed source-control decisions.',
    kicker: 'NAVLE Emergency Guide',
    intro:
      'Sepsis questions reward structured timing: early recognition, perfusion support, and source control planning. This page gives a practical sequence for first-hour decisions and common exam pitfalls.',
    algorithm: [
      'Screen for infection risk with systemic instability rather than waiting for complete confirmation.',
      'Stabilize perfusion and oxygen delivery while collecting critical baseline diagnostics.',
      'Start broad-spectrum antimicrobial therapy when sepsis probability is high.',
      'Initiate source-control planning early and reassess feasibility continuously.',
      'Track response using serial perfusion markers and organ function trends.',
    ],
    diagnostics: [
      'CBC, chemistry, lactate, and coagulation trends help define severity and progression.',
      'Blood culture timing should support, not delay, urgently indicated treatment decisions.',
      'Imaging and focused ultrasound can identify drainable or surgically relevant sources.',
      'Urine output and mentation trajectory offer practical bedside response markers.',
      'Repeat data at clinically relevant intervals to detect response failure early.',
    ],
    treatment: [
      'Use perfusion-guided fluids with careful reassessment to avoid fluid overload drift.',
      'Start empiric antimicrobials based on likely source and local stewardship context.',
      'Escalate to vasopressor support when perfusion remains inadequate after fluid optimization.',
      'Pursue source control through drainage, debridement, or procedural intervention when needed.',
      'Support organ systems proactively, including glucose, electrolyte, and thermal management.',
    ],
    examTraps: [
      'Waiting for definitive culture results before treatment in unstable patients is a classic error.',
      'Assuming normal early blood pressure excludes sepsis progression can delay escalation.',
      'Treating lactate as a stand-alone endpoint without clinical context causes management errors.',
      'Deferring source control planning until after prolonged medical therapy lowers momentum.',
      'Ignoring urine output trends can hide evolving organ dysfunction.',
    ],
    prompts: [
      'What triggers immediate sepsis treatment even before full diagnostics return?',
      'How do fluid and vasopressor decisions change when perfusion remains poor?',
      'Which source-control options matter most in abdominal sepsis scenarios?',
      'What data should be trended in the first 6 hours?',
      'How can stewardship principles coexist with urgent empiric treatment?',
    ],
    tool: {
      href: '/tools/sepsis-bundle-planner.html',
      label: 'Use the Sepsis Bundle Planner',
    },
    pillar: emergencyPillar,
    primaryQuery: 'sepsis veterinary approach',
    secondaryQueries: [
      'sirs criteria dog cat',
      'sepsis bundle veterinary',
      'septic shock treatment vet',
    ],
    paa: [
      'How is sepsis recognized in veterinary patients?',
      'What is the first-hour sepsis plan in dogs and cats?',
      'When should vasopressors be used in septic shock?',
    ],
    intent: 'informational',
  },
  {
    slug: 'dka-approach-veterinary',
    title: 'DKA Approach in Dogs and Cats – VetLudics',
    description:
      'Review a practical DKA approach for dogs and cats: stabilization priorities, insulin timing, electrolyte corrections, and common NAVLE pitfalls.',
    h1: 'DKA Approach in Dogs and Cats: Stabilization Before Insulin',
    summary:
      'First-hour DKA sequence with fluid-first logic and potassium-aware insulin planning.',
    kicker: 'NAVLE Emergency Guide',
    intro:
      'DKA management is a sequencing problem: fluids first, electrolyte safety, then controlled insulin strategy. This guide emphasizes decision order and reassessment points that frequently appear in NAVLE-style questions.',
    algorithm: [
      'Confirm likely DKA pattern using compatible history, hyperglycemia, ketone evidence, and acid-base derangement.',
      'Stabilize perfusion first with isotonic fluids and clinical reassessment.',
      'Evaluate potassium and electrolytes before insulin initiation whenever possible.',
      'Start insulin infusion using structured glucose and electrolyte monitoring intervals.',
      'Treat trigger conditions while adjusting therapy according to response trajectory.',
    ],
    diagnostics: [
      'Serial glucose, potassium, and acid-base trends guide safe transitions in therapy intensity.',
      'Urinalysis and ketone assessment help confirm and monitor metabolic resolution direction.',
      'Baseline chemistry supports interpretation of dehydration, azotemia, and electrolyte deficits.',
      'CBC and focused infection workup can identify concurrent inflammatory triggers.',
      'Trend mentation and hydration markers alongside lab values to avoid tunnel vision.',
    ],
    treatment: [
      'Use fluid resuscitation to improve perfusion before aggressive metabolic correction.',
      'Replace potassium proactively according to serial lab and ECG-informed risk assessment.',
      'Begin insulin using controlled infusion protocols after initial stabilization steps.',
      'Add dextrose support when glucose falls into target transition range during insulin therapy.',
      'Address concurrent disease drivers such as pancreatitis, infection, or endocrine stressors.',
    ],
    examTraps: [
      'Starting insulin before correcting or planning potassium support is a common critical error.',
      'Assuming glucose normalization equals DKA resolution can miss persistent ketotic acidosis.',
      'Large fluid shifts without reassessment may worsen neurologic and perfusion risk.',
      'Ignoring concurrent trigger disease reduces long-term stability and recurrence prevention.',
      'Failing to define monitoring intervals creates avoidable therapy drift.',
    ],
    prompts: [
      'Why is fluid-first sequencing central in DKA stabilization?',
      'How should potassium trends alter insulin decision timing?',
      'When is dextrose added during insulin infusion protocols?',
      'Which findings suggest DKA is improving versus partially corrected?',
      'How do concurrent trigger diseases affect recurrence risk?',
    ],
    tool: {
      href: '/tools/insulin-cri-planner.html',
      label: 'Use the Insulin CRI Planner',
    },
    pillar: emergencyPillar,
    primaryQuery: 'dka approach dog cat',
    secondaryQueries: [
      'veterinary dka treatment sequence',
      'insulin cri dka vet',
      'dka potassium correction dog',
    ],
    paa: [
      'Do you give insulin before fluids in DKA?',
      'How often should electrolytes be checked in veterinary DKA?',
      'When should dextrose be added during DKA treatment?',
    ],
    intent: 'informational',
  },
  {
    slug: 'heatstroke-veterinary',
    title: 'Heatstroke in Veterinary Patients – VetLudics',
    description:
      'Learn a practical veterinary heatstroke approach with controlled cooling strategy, perfusion support, and monitoring priorities for high-risk complications.',
    h1: 'Heatstroke in Dogs and Cats: Controlled Cooling and Critical Monitoring',
    summary:
      'Recognize heat injury early and run a controlled cooling plus perfusion workflow.',
    kicker: 'NAVLE Emergency Guide',
    intro:
      'Heatstroke is a time-sensitive emergency where overcorrection can be as risky as under-treatment. This guide focuses on controlled cooling, perfusion support, and complication surveillance priorities.',
    algorithm: [
      'Identify hyperthermia with systemic dysfunction and initiate immediate cooling protocol.',
      'Stabilize airway, breathing, circulation, and perfusion while reducing heat load.',
      'Use controlled cooling and stop at target range to prevent rebound hypothermia.',
      'Monitor coagulation, neurologic status, and organ function for delayed deterioration.',
      'Escalate intensive care when perfusion, mentation, or hemostatic markers worsen.',
    ],
    diagnostics: [
      'Serial temperature trends guide cooling intensity and stop points.',
      'CBC, chemistry, and coagulation profiles help detect multi-organ injury progression.',
      'Blood gas and lactate trends support perfusion and ventilation interpretation.',
      'Urine output and renal markers are important because AKI can develop after initial stabilization.',
      'Frequent neurologic reassessment helps identify cerebral complications early.',
    ],
    treatment: [
      'Use cool water and airflow methods that allow measured, monitored temperature descent.',
      'Provide perfusion-guided IV support and oxygen according to clinical response.',
      'Stop active cooling at target threshold and transition to monitoring-focused support.',
      'Address coagulation instability, GI injury risk, and neurologic complications proactively.',
      'Plan staged reassessment because delayed deterioration is common in severe cases.',
    ],
    examTraps: [
      'Aggressive cooling below target can create rebound hypothermia and instability.',
      'Treating heatstroke as resolved after temperature normalization misses delayed injury.',
      'Ignoring coagulation trends can delay recognition of life-threatening complications.',
      'Under-monitoring neurologic status may miss progressive CNS compromise.',
      'Insufficient owner education on recurrence prevention weakens long-term outcomes.',
    ],
    prompts: [
      'What is the safest endpoint for active cooling in canine heatstroke?',
      'Which complications should be monitored after initial stabilization?',
      'How does coagulation monitoring change management urgency?',
      'What findings indicate escalation to critical care support?',
      'Which prevention counseling points should be prioritized at discharge?',
    ],
    tool: {
      href: '/tools/er-algorithms.html',
      label: 'Open the ER Algorithms Library',
    },
    pillar: emergencyPillar,
    primaryQuery: 'heatstroke treatment dog veterinary',
    secondaryQueries: [
      'controlled cooling heatstroke dogs',
      'heatstroke complications vet',
      'heatstroke triage protocol',
    ],
    paa: [
      'How fast should you cool a dog with heatstroke?',
      'When should active cooling be stopped?',
      'What delayed complications occur after heatstroke?',
    ],
    intent: 'informational',
  },
  {
    slug: 'transfusion-basics-veterinary',
    title: 'Veterinary Transfusion Basics – VetLudics',
    description:
      'Study veterinary transfusion basics including indications, product selection, monitoring, and reaction response for exam preparation and clinical review.',
    h1: 'Veterinary Transfusion Basics: Product Choice, Monitoring, and Reactions',
    summary:
      'Core transfusion decision flow for emergency and inpatient veterinary settings.',
    kicker: 'NAVLE Emergency Guide',
    intro:
      'Transfusion questions test decision matching: product selection, dosing strategy, and reaction monitoring. This guide gives a practical framework that supports both exam logic and safe bedside execution.',
    algorithm: [
      'Confirm transfusion indication based on oxygen delivery risk, bleeding status, and clinical signs.',
      'Select blood product type that matches the immediate clinical deficit.',
      'Calculate dose and rate strategy with reassessment checkpoints.',
      'Monitor for acute reactions during initiation and throughout infusion.',
      'Document response and plan follow-up diagnostics for ongoing management.',
    ],
    diagnostics: [
      'Baseline PCV/TS, coagulation context, and hemodynamic data support product selection.',
      'Crossmatch and typing considerations depend on species, history, and urgency.',
      'Serial perfusion and oxygenation indicators guide transfusion effectiveness.',
      'Track temperature, heart rate, respiratory effort, and blood pressure during infusion.',
      'Post-transfusion labs help assess durability of response and next-step needs.',
    ],
    treatment: [
      'Choose packed red cells when oxygen-carrying capacity is the dominant deficit.',
      'Use plasma-centered products when coagulation support is primary.',
      'Start infusion cautiously and increase rate after initial tolerance is confirmed.',
      'Pause and reassess immediately if reaction signs emerge.',
      'Integrate source-control and definitive disease management alongside transfusion support.',
    ],
    examTraps: [
      'Selecting product type without matching the physiologic deficit is a common error.',
      'Skipping early reaction surveillance in unstable patients can delay intervention.',
      'Assuming one transfusion resolves ongoing loss without source control reduces effectiveness.',
      'Overreliance on a single post-transfusion value can miss dynamic trends.',
      'Ignoring species and prior transfusion history can raise reaction risk.',
    ],
    prompts: [
      'Which blood product is preferred for severe anemia without coagulopathy?',
      'How should transfusion rate be adjusted in fragile cardiopulmonary patients?',
      'What are the first signs of acute transfusion reactions to watch for?',
      'How do you determine whether another transfusion is needed?',
      'What supporting diagnostics improve transfusion decision quality?',
    ],
    tool: {
      href: '/tools/transfusion-helper.html',
      label: 'Use the Transfusion Helper',
    },
    pillar: emergencyPillar,
    primaryQuery: 'veterinary transfusion basics',
    secondaryQueries: [
      'dog cat blood transfusion indications',
      'transfusion reactions veterinary',
      'packed rbc vs plasma vet',
    ],
    paa: [
      'When is a transfusion indicated in veterinary patients?',
      'How are transfusion reactions recognized early?',
      'Which blood product should be selected first?',
    ],
    intent: 'informational',
  },
  {
    slug: 'rodenticide-bleeding-veterinary',
    title: 'Rodenticide Bleeding Approach in Veterinary Medicine – VetLudics',
    description:
      'Review rodenticide-associated bleeding triage, diagnostic confirmation, stabilization, and follow-up strategy for canine and feline emergency care.',
    h1: 'Rodenticide Bleeding in Dogs and Cats: Triage and Stabilization Plan',
    summary:
      'Handle suspected anticoagulant rodenticide bleeding with structured triage and monitoring.',
    kicker: 'NAVLE Emergency Guide',
    intro:
      'Rodenticide cases often require action before full confirmation because hemorrhage risk can escalate quickly. This guide focuses on bleeding risk triage, stabilization, and practical follow-up planning.',
    algorithm: [
      'Assess bleeding severity and perfusion status immediately in suspected exposure cases.',
      'Stabilize oxygen delivery, perfusion, and hemorrhage consequences first.',
      'Gather targeted diagnostics that support toxin suspicion and severity grading.',
      'Start indicated reversal and supportive therapies while monitoring response.',
      'Plan serial reassessment and owner communication on delayed bleeding risk.',
    ],
    diagnostics: [
      'History timing and exposure probability strongly shape early decision urgency.',
      'Coagulation testing, PCV trends, and imaging can identify internal bleeding burden.',
      'Thoracic and abdominal assessments are useful when respiratory compromise or distension is present.',
      'Serial perfusion and hematologic monitoring detect progression despite initial stabilization.',
      'Track reassessment intervals clearly to avoid delayed recognition of recurrence.',
    ],
    treatment: [
      'Stabilize hemodynamics and oxygen delivery before focusing on long-range toxin counseling.',
      'Use blood products or plasma support when bleeding severity warrants immediate correction.',
      'Initiate reversal strategies appropriate to likely toxin mechanism and clinical status.',
      'Provide strict activity and monitoring guidance during recovery windows.',
      'Confirm follow-up plan with recheck timing and escalation criteria.',
    ],
    examTraps: [
      'Delaying stabilization while chasing complete toxin identification can be unsafe.',
      'Assuming normal early appearance excludes meaningful delayed hemorrhage risk.',
      'Insufficient follow-up planning may miss rebound coagulopathy.',
      'Overlooking thoracic bleeding signs can delay life-saving support.',
      'Missing owner communication details increases post-discharge failure risk.',
    ],
    prompts: [
      'What first-hour findings raise urgency in suspected rodenticide cases?',
      'When should blood product support be prioritized over outpatient planning?',
      'Which follow-up tests matter most after initial stabilization?',
      'How can delayed bleeding risk be explained clearly to owners?',
      'What signs should trigger immediate emergency re-evaluation?',
    ],
    tool: {
      href: '/tools/toxin-decontamination-planner.html',
      label: 'Use the Toxin Decontamination Planner',
    },
    pillar: emergencyPillar,
    primaryQuery: 'rodenticide bleeding dog treatment',
    secondaryQueries: [
      'anticoagulant rodenticide vet approach',
      'coagulopathy dog poison triage',
      'rodenticide hemorrhage management',
    ],
    paa: [
      'How do you triage rodenticide bleeding in dogs?',
      'When should plasma be considered in rodenticide poisoning?',
      'How long should rodenticide cases be monitored?',
    ],
    intent: 'informational',
  },
  {
    slug: 'pleural-effusion-differentials-veterinary',
    title: 'Pleural Effusion Differentials in Veterinary Patients – VetLudics',
    description:
      'Learn a practical pleural effusion differential framework for dogs and cats, including triage priorities, diagnostics, and stabilization decisions.',
    h1: 'Pleural Effusion Differentials in Dogs and Cats: Practical Triage Framework',
    summary:
      'Differentiate pleural disease causes and prioritize respiratory stabilization steps.',
    kicker: 'NAVLE Emergency Guide',
    intro:
      'Pleural effusion presentations require rapid respiratory prioritization before complete etiologic workup. This guide helps you organize differential reasoning while protecting ventilation and perfusion.',
    algorithm: [
      'Recognize respiratory distress pattern and prioritize oxygen plus low-stress handling immediately.',
      'Confirm pleural space involvement and decide whether therapeutic drainage is needed now.',
      'Generate differential tiers using signalment, history, and fluid-character clues.',
      'Stabilize first, then pursue targeted diagnostics for underlying cause confirmation.',
      'Define monitoring and escalation criteria based on recurrence risk and respiratory trajectory.',
    ],
    diagnostics: [
      'Focused thoracic imaging differentiates pleural space disease from primary parenchymal failure.',
      'Fluid characterization helps separate transudate, exudate, chylous, and hemorrhagic patterns.',
      'CBC, chemistry, and relevant infectious or neoplastic workups refine differential ranking.',
      'Cardiac and vascular assessment is important when CHF or obstructive causes are plausible.',
      'Track respiratory rate and effort trends after intervention to assess durability of response.',
    ],
    treatment: [
      'Use oxygen and stress-reduced handling while preparing procedural stabilization when indicated.',
      'Perform therapeutic thoracocentesis when respiratory compromise persists.',
      'Select adjunctive therapy based on likely etiology after immediate ventilation priorities are addressed.',
      'Plan recurrence monitoring because repeat accumulation can occur quickly.',
      'Escalate to specialty diagnostics for unresolved or recurrent cases.',
    ],
    examTraps: [
      'Delaying respiratory stabilization while over-prioritizing definitive diagnosis lowers safety.',
      'Assuming all pleural effusion is cardiogenic can misdirect early treatment choices.',
      'Under-monitoring post-procedural respiratory effort may miss rapid recurrence.',
      'Ignoring fluid analysis interpretation weakens differential narrowing.',
      'Failure to map recurrence risk can create unsafe discharge planning.',
    ],
    prompts: [
      'What findings support immediate thoracocentesis in dyspneic patients?',
      'How do fluid characteristics shift your top differentials?',
      'What is the fastest way to separate pleural from pulmonary causes?',
      'Which recurrence indicators should be monitored after drainage?',
      'How do you triage suspected CHF versus non-cardiac pleural disease?',
    ],
    tool: {
      href: '/tools/chf-staging-planner.html',
      label: 'Use the CHF Staging Planner',
    },
    pillar: emergencyPillar,
    primaryQuery: 'pleural effusion differentials dog cat',
    secondaryQueries: [
      'vet pleural effusion workup',
      'thoracocentesis indications dog cat',
      'pleural effusion vs edema',
    ],
    paa: [
      'How do you differentiate pleural effusion causes in dogs and cats?',
      'When should thoracocentesis be performed?',
      'How can pleural effusion be separated from pulmonary edema quickly?',
    ],
    intent: 'informational',
  },
]

const cardiologyPillar = {
  slug: 'canine-feline-chf',
  title: 'Canine and Feline CHF Guide – VetLudics',
  description:
    'Study canine and feline CHF recognition, workup, staging, and monitoring in one pillar page with linked cardiology support guides and calculators.',
  h1: 'Canine and Feline CHF: Recognition, Workup, Staging, and Monitoring',
  intro:
    'This cardiology pillar organizes CHF reasoning into a practical path: recognize likely failure patterns, perform focused workup, stage severity, and monitor response over time. Use linked support pages for rhythm, murmurs, hypertension, and medication logic.',
  workflow: [
    'Recognize cardiopulmonary failure signals and separate urgent from non-urgent presentations.',
    'Work up likely CHF with structured imaging, rhythm, perfusion, and laboratory context.',
    'Stage and phenotype the case to align monitoring intensity and treatment decisions.',
    'Adjust follow-up based on respiratory effort trends, recurrence risk, and owner adherence.',
  ],
}

const cardiologySupports = [
  {
    slug: 'chf-staging-overview',
    title: 'CHF Staging Overview for Dogs and Cats – VetLudics',
    description:
      'Review canine and feline CHF staging with phenotype cues, monitoring intervals, and follow-up planning linked to practical workup and treatment decisions.',
    h1: 'CHF Staging Overview for Dogs and Cats',
    summary:
      'Stage CHF cases with practical pattern cues and follow-up timing logic.',
    kicker: 'Cardiology NAVLE Guide',
    intro:
      'Staging drives both treatment and follow-up cadence. This overview emphasizes pattern-based staging decisions and how to avoid over- or under-staging when presentation details are incomplete.',
    algorithm: [
      'Identify whether the patient is asymptomatic risk, compensated disease, or active decompensation.',
      'Integrate respiratory pattern, imaging burden, and perfusion markers into stage assignment.',
      'Document stage-specific priorities for treatment intensity and monitoring.',
      'Set near-term follow-up intervals based on relapse risk and owner monitoring capacity.',
      'Re-stage when respiratory effort, imaging findings, or perfusion status shift.',
    ],
    diagnostics: [
      'Thoracic imaging and focused cardiac assessment anchor stage interpretation.',
      'Resting respiratory rate trends provide practical progression signals at home and in clinic.',
      'Blood pressure, renal markers, and electrolytes guide safe medication adjustments.',
      'ECG and rhythm surveillance can identify stage-altering instability.',
      'Serial reassessment prevents outdated stage labels from persisting.',
    ],
    treatment: [
      'Align medication choices with current stage severity and decompensation status.',
      'Prioritize decongestion and oxygen support in active failure phases.',
      'Adjust outpatient plans using objective response metrics rather than fixed assumptions.',
      'Reinforce owner education on daily respiratory monitoring and red-flag triggers.',
      'Plan rechecks to catch recurrence before severe decompensation.',
    ],
    examTraps: [
      'Assigning stage from murmur grade alone misses respiratory and imaging context.',
      'Underweighting resting respiratory rate trends often delays needed escalation.',
      'Ignoring renal and electrolyte monitoring during medication changes adds risk.',
      'Treating staging as static instead of dynamic across visits is a common error.',
      'Discharge without clear home-monitoring instructions weakens outcome control.',
    ],
    prompts: [
      'Which findings most strongly support active CHF decompensation?',
      'How should follow-up timing change after medication adjustments?',
      'What data can move a case from compensated to unstable stage?',
      'How do renal trends alter CHF medication planning?',
      'What owner instructions reduce avoidable re-presentation risk?',
    ],
    tool: {
      href: '/tools/chf-staging-planner.html',
      label: 'Use the CHF Staging Planner',
    },
    pillar: cardiologyPillar,
    primaryQuery: 'chf staging dogs cats',
    secondaryQueries: [
      'veterinary chf stages',
      'dog chf follow-up intervals',
      'feline chf staging',
    ],
    paa: [
      'How is CHF staged in dogs and cats?',
      'What follow-up is needed after CHF medication changes?',
      'Which signs indicate CHF stage progression?',
    ],
    intent: 'informational',
  },
  {
    slug: 'murmur-approach-dog-cat',
    title: 'Dog and Cat Murmur Approach – VetLudics',
    description:
      'Use a practical dog and cat murmur approach to triage urgency, rank differentials, and choose high-yield next diagnostics for cardiology review.',
    h1: 'Dog and Cat Murmur Approach: Triage and Workup Logic',
    summary:
      'Structured murmur triage and differential narrowing across species and life stages.',
    kicker: 'Cardiology NAVLE Guide',
    intro:
      'A murmur is a finding, not a diagnosis. This guide helps you classify urgency, connect murmur characteristics with likely disease categories, and choose the next best diagnostic step.',
    algorithm: [
      'Assess whether murmur occurs with signs of instability or incidental routine exam finding.',
      'Characterize intensity, timing, point of maximal intensity, and concurrent rhythm pattern.',
      'Match signalment and murmur profile to most likely structural or functional causes.',
      'Select imaging and pressure evaluation priorities based on risk profile.',
      'Set monitoring interval and escalation criteria when immediate intervention is not required.',
    ],
    diagnostics: [
      'Thoracic imaging and echocardiography context define structural significance.',
      'Blood pressure and perfusion evaluation may reveal hemodynamic impact not obvious on auscultation.',
      'ECG support is useful when arrhythmia signs accompany auscultation findings.',
      'Laboratory baseline helps assess comorbidity before treatment decisions.',
      'Serial examinations prevent missed progression in initially stable patients.',
    ],
    treatment: [
      'Treat based on confirmed disease process and clinical impact, not murmur grade alone.',
      'Escalate rapidly when murmur accompanies respiratory distress, syncope, or poor perfusion.',
      'Plan follow-up cadence around progression risk and owner observation capability.',
      'Integrate stage-specific medication logic after diagnostic confirmation.',
      'Document objective response markers for each follow-up cycle.',
    ],
    examTraps: [
      'Overweighting murmur loudness without location and timing context can mislead diagnosis.',
      'Assuming all feline murmurs imply severe structural disease causes over-correction.',
      'Skipping blood pressure and rhythm assessment may miss major contributors.',
      'Failing to plan recheck intervals can miss progression in asymptomatic patients.',
      'Ignoring syncopal history in murmur cases underestimates risk.',
    ],
    prompts: [
      'What murmur features most influence immediate workup urgency?',
      'How does signalment change top differentials for systolic murmurs?',
      'When should echocardiography be prioritized over delayed follow-up?',
      'Which findings convert a murmur case from elective to urgent?',
      'How can owners monitor progression safely at home?',
    ],
    tool: {
      href: '/tools/chf-staging-planner.html',
      label: 'Use the CHF Staging Planner',
    },
    pillar: cardiologyPillar,
    primaryQuery: 'dog cat murmur approach',
    secondaryQueries: [
      'veterinary murmur workup',
      'systolic murmur differential dog',
      'feline murmur triage',
    ],
    paa: [
      'How should murmurs be evaluated in dogs and cats?',
      'Does murmur grade determine severity?',
      'When is echo needed for a murmur?',
    ],
    intent: 'informational',
  },
  {
    slug: 'ecg-rhythm-id-af-svt-vt',
    title: 'ECG Rhythm Identification AF SVT VT – VetLudics',
    description:
      'Learn practical ECG rhythm identification for AF, SVT, and VT in veterinary cardiology with emergency triage implications and exam-focused pitfalls.',
    h1: 'ECG Rhythm Identification: AF, SVT, and VT in Veterinary Cases',
    summary:
      'Differentiate common high-yield tachyarrhythmias and match first-step response.',
    kicker: 'Cardiology NAVLE Guide',
    intro:
      'Arrhythmia questions often hinge on pattern recognition and immediate risk prioritization. This guide focuses on AF, SVT, and VT differentiation with practical clinical implications.',
    algorithm: [
      'Confirm the rhythm strip quality and heart rate context before labeling arrhythmia type.',
      'Separate irregularly irregular patterns from regular narrow or wide complex tachycardias.',
      'Assess perfusion and hemodynamic stability in parallel with rhythm identification.',
      'Choose first-step stabilization and monitoring pathway based on instability risk.',
      'Reassess after intervention and document response pattern for next-step decisions.',
    ],
    diagnostics: [
      'Use multiple leads or longer strips when single snapshots are equivocal.',
      'Pair ECG interpretation with perfusion signs and blood pressure trends.',
      'Check electrolytes and acid-base context when rhythm instability escalates.',
      'Imaging and structural workup help identify underlying drivers of persistent arrhythmias.',
      'Serial rhythm monitoring is essential after treatment changes.',
    ],
    treatment: [
      'Prioritize stabilization in unstable VT patterns before deep rhythm classification debates.',
      'Use rate or rhythm control strategy according to arrhythmia type and perfusion response.',
      'Correct reversible contributors such as electrolyte derangement and hypoxia early.',
      'Coordinate cardiology follow-up for recurrent or complex arrhythmia profiles.',
      'Plan owner monitoring and emergency return criteria for outpatient rhythm cases.',
    ],
    examTraps: [
      'Labeling rhythms without evaluating perfusion significance is a frequent error.',
      'Confusing AF with artifact or vice versa can derail management sequence.',
      'Treating regular wide-complex tachycardia as benign by default can be dangerous.',
      'Ignoring electrolyte influence on rhythm persistence weakens treatment durability.',
      'Skipping post-intervention rhythm reassessment misses early failure signs.',
    ],
    prompts: [
      'Which ECG features separate AF from SVT quickly?',
      'When should VT be treated as an immediate instability emergency?',
      'How do electrolytes alter arrhythmia management priorities?',
      'What monitoring intervals are reasonable after antiarrhythmic changes?',
      'Which structural diseases most commonly drive persistent arrhythmias?',
    ],
    tool: {
      href: '/tools/emergency-drug-chart.html',
      label: 'Use the Emergency Drug Chart',
    },
    pillar: cardiologyPillar,
    primaryQuery: 'ecg rhythm identification af svt vt veterinary',
    secondaryQueries: [
      'vet af vs svt',
      'vt treatment dog cat',
      'tachyarrhythmia triage veterinary',
    ],
    paa: [
      'How do you distinguish AF and SVT on veterinary ECG?',
      'What is the first step in unstable VT?',
      'When do electrolytes matter most in arrhythmias?',
    ],
    intent: 'study',
  },
  {
    slug: 'systemic-hypertension-target-organ-damage',
    title: 'Systemic Hypertension and Target Organ Damage – VetLudics',
    description:
      'Review systemic hypertension in dogs and cats, target organ damage patterns, and practical monitoring steps for cardiology and internal medicine prep.',
    h1: 'Systemic Hypertension and Target Organ Damage in Dogs and Cats',
    summary:
      'Connect blood pressure severity to organ risk and follow-up strategy.',
    kicker: 'Cardiology NAVLE Guide',
    intro:
      'Systemic hypertension is frequently underdiagnosed until target organ injury is evident. This guide focuses on risk stratification, diagnosis confirmation, and practical follow-up planning.',
    algorithm: [
      'Confirm blood pressure elevation with repeat, low-stress measurement strategy.',
      'Stratify risk by pressure tier and evidence of target organ involvement.',
      'Investigate likely secondary causes while beginning risk-appropriate control.',
      'Define monitoring intervals for pressure response and organ-protection goals.',
      'Adjust treatment intensity when pressure control or organ markers remain poor.',
    ],
    diagnostics: [
      'Serial blood pressure quality is central to avoiding white-coat overdiagnosis.',
      'Fundic exam, renal parameters, and neurologic status support target organ assessment.',
      'Cardiac and vascular imaging can clarify concurrent cardiovascular burden.',
      'Urinalysis and proteinuria trends provide renal damage context.',
      'Track pressure trends over time rather than isolated point values.',
    ],
    treatment: [
      'Set practical pressure targets based on severity and organ risk profile.',
      'Begin antihypertensive strategy with planned reassessment windows.',
      'Address secondary disease drivers in parallel with pressure control.',
      'Escalate medication thoughtfully when trend response is inadequate.',
      'Maintain long-term monitoring because recurrence is common in chronic disease contexts.',
    ],
    examTraps: [
      'Treating single elevated readings as definitive diagnosis without repeat quality checks.',
      'Ignoring ocular or renal indicators can underestimate target organ damage.',
      'Under-monitoring after therapy initiation misses inadequate control trajectories.',
      'Focusing on pressure numbers without secondary-cause workup weakens outcomes.',
      'Stopping follow-up after early improvement can allow silent relapse.',
    ],
    prompts: [
      'How should blood pressure be confirmed before labeling hypertension?',
      'Which target organs are highest priority in early assessment?',
      'When should treatment be escalated for persistent pressure elevation?',
      'How do renal trends alter antihypertensive planning?',
      'What follow-up cadence supports safer long-term control?',
    ],
    tool: {
      href: '/tools/chf-staging-planner.html',
      label: 'Use the CHF Staging Planner for follow-up structure',
    },
    pillar: cardiologyPillar,
    primaryQuery: 'systemic hypertension target organ damage dog cat',
    secondaryQueries: [
      'feline hypertension tod',
      'canine hypertension management',
      'vet blood pressure monitoring',
    ],
    paa: [
      'What organs are affected by systemic hypertension in pets?',
      'How is hypertension confirmed in dogs and cats?',
      'How often should hypertensive patients be rechecked?',
    ],
    intent: 'informational',
  },
  {
    slug: 'dcm-basics-dog-cat',
    title: 'DCM Basics in Dogs and Cats – VetLudics',
    description:
      'Study dilated cardiomyopathy basics in dogs and cats with recognition clues, workup sequence, and monitoring principles for NAVLE cardiology prep.',
    h1: 'Dilated Cardiomyopathy Basics in Dogs and Cats',
    summary:
      'Core DCM pattern recognition, diagnostic flow, and monitoring strategy.',
    kicker: 'Cardiology NAVLE Guide',
    intro:
      'DCM questions often combine signalment clues with rhythm and perfusion interpretation. This guide helps you recognize common patterns and build a logical workup and monitoring plan.',
    algorithm: [
      'Identify high-risk signalment and clinical signs consistent with reduced systolic function.',
      'Screen for arrhythmia and perfusion instability while planning cardiac imaging.',
      'Use echo and thoracic context to confirm ventricular dilation and functional impact.',
      'Establish stage-aware treatment and follow-up priorities.',
      'Track response using rhythm, respiratory effort, and perfusion markers.',
    ],
    diagnostics: [
      'Echocardiography is central for structural and functional confirmation.',
      'ECG and rhythm monitoring are high value because arrhythmias are common.',
      'Thoracic imaging helps evaluate pulmonary and pleural consequences.',
      'Laboratory context supports concurrent disease assessment and medication planning.',
      'Serial data helps distinguish progression from transient instability.',
    ],
    treatment: [
      'Match therapy to stage, congestion status, and perfusion profile.',
      'Address rhythm instability promptly when hemodynamics are affected.',
      'Use owner-centered monitoring plans for respiratory and activity changes.',
      'Reassess medication tolerance with renal and electrolyte surveillance.',
      'Escalate follow-up frequency when relapse risk increases.',
    ],
    examTraps: [
      'Relying on murmur intensity alone can miss advanced DCM with subtle auscultation findings.',
      'Skipping rhythm evaluation in weak or syncopal patients is a common miss.',
      'Underestimating pleural involvement can delay respiratory support planning.',
      'Ignoring trend-based follow-up leads to late recognition of deterioration.',
      'Confusing primary myocardial dysfunction with valvular-only disease changes management.',
    ],
    prompts: [
      'Which signalment clues should increase suspicion for DCM?',
      'How do ECG findings alter DCM triage urgency?',
      'What follow-up data best tracks response to CHF therapy in DCM?',
      'How can DCM and valvular disease be separated in workup?',
      'Which decompensation signs should trigger immediate recheck?',
    ],
    tool: {
      href: '/tools/chf-staging-planner.html',
      label: 'Use the CHF Staging Planner',
    },
    pillar: cardiologyPillar,
    primaryQuery: 'dcm basics dog cat',
    secondaryQueries: [
      'dilated cardiomyopathy veterinary',
      'dog dcm workup',
      'feline dcm recognition',
    ],
    paa: [
      'How is DCM diagnosed in dogs?',
      'Can cats develop DCM?',
      'What monitoring is needed in DCM cases?',
    ],
    intent: 'informational',
  },
  {
    slug: 'pleural-effusion-vs-pulmonary-edema',
    title:
      'Pleural Effusion vs Pulmonary Edema in Veterinary Patients – VetLudics',
    description:
      'Differentiate pleural effusion versus pulmonary edema in dogs and cats using practical exam, imaging, and stabilization clues for cardiopulmonary triage.',
    h1: 'Pleural Effusion vs Pulmonary Edema: Veterinary Triage Differences',
    summary:
      'Differentiate two common dyspnea patterns and adjust first-step interventions.',
    kicker: 'Cardiology NAVLE Guide',
    intro:
      'Respiratory distress decisions depend on whether pathology sits in the pleural space or lung parenchyma. This guide helps you separate patterns quickly and avoid mismatched first-line interventions.',
    algorithm: [
      'Stabilize breathing and oxygenation first while minimizing patient stress.',
      'Use focused exam plus imaging cues to identify pleural versus parenchymal burden.',
      'Prioritize thoracocentesis when pleural disease is causing severe ventilatory compromise.',
      'Use decongestive pathways when pulmonary edema is dominant and CHF context is strong.',
      'Reassess respiratory effort after intervention to confirm direction of response.',
    ],
    diagnostics: [
      'Thoracic imaging and point-of-care ultrasound rapidly improve pattern discrimination.',
      'Auscultation pattern, respiratory mechanics, and posture support provisional triage.',
      'Cardiac assessment helps rank CHF probability in pulmonary edema presentations.',
      'Fluid analysis clarifies etiology when pleural drainage is performed.',
      'Track serial respiratory rate and effort after each intervention.',
    ],
    treatment: [
      'Treat severe pleural restriction with drainage and oxygen-focused support.',
      'Treat pulmonary edema with decongestive strategy and CHF-oriented monitoring.',
      'Avoid overloading unstable cardiopulmonary cases with unstructured fluid assumptions.',
      'Plan follow-up imaging and respiratory trends to detect recurrence early.',
      'Escalate care when work of breathing fails to improve as expected.',
    ],
    examTraps: [
      'Applying pulmonary edema treatment to undrained major pleural disease can delay recovery.',
      'Assuming all dyspnea in murmur cases is edema without imaging confirmation is risky.',
      'Under-monitoring post-drainage recurrence can miss rapid decompensation.',
      'Ignoring perfusion context while focusing only on respiratory mechanics causes blind spots.',
      'Inadequate reassessment after intervention weakens next-step decision quality.',
    ],
    prompts: [
      'Which exam clues favor pleural disease over pulmonary edema?',
      'When should thoracocentesis come before broader diagnostics?',
      'How does imaging alter immediate treatment sequence?',
      'Which follow-up signs indicate recurrence risk after initial response?',
      'How should CHF suspicion change your triage framing?',
    ],
    tool: {
      href: '/tools/chf-staging-planner.html',
      label: 'Use the CHF Staging Planner',
    },
    pillar: cardiologyPillar,
    primaryQuery: 'pleural effusion vs pulmonary edema dog cat',
    secondaryQueries: [
      'dyspnea differential dog cat',
      'thoracocentesis vs diuretics',
      'cardiogenic edema veterinary',
    ],
    paa: [
      'How do you tell pleural effusion from pulmonary edema?',
      'When should thoracocentesis be prioritized?',
      'Can CHF cause pleural effusion in cats?',
    ],
    intent: 'informational',
  },
  {
    slug: 'pimobendan-diuretics-overview',
    title: 'Pimobendan and Diuretics Overview – VetLudics',
    description:
      'Get an educational overview of pimobendan and diuretic strategy in veterinary CHF management with monitoring priorities and common exam pitfalls.',
    h1: 'Pimobendan and Diuretics in CHF: Educational Overview',
    summary:
      'Medication role framing, monitoring priorities, and stage-aware adjustment concepts.',
    kicker: 'Cardiology NAVLE Guide',
    intro:
      'Medication questions are often about indication matching and monitoring, not memorizing isolated dose facts. This overview keeps focus on treatment goals, reassessment, and safety checkpoints.',
    algorithm: [
      'Define whether the current goal is decongestion, forward-flow support, or maintenance control.',
      'Match medication class emphasis to stage and decompensation pattern.',
      'Set objective monitoring markers before and after changes.',
      'Reassess renal and electrolyte response with each escalation step.',
      'Adjust plan according to clinical trajectory rather than rigid protocol repetition.',
    ],
    diagnostics: [
      'Baseline renal panel and electrolytes are essential before and after adjustment cycles.',
      'Respiratory trend monitoring gives practical real-world response data.',
      'Blood pressure and perfusion checks help detect overcorrection or instability.',
      'Imaging and exam context refine interpretation of persistent signs.',
      'Owner-reported tolerance and behavior changes help detect early drift.',
    ],
    treatment: [
      'Use decongestive and inodilator concepts according to stage-defined goals.',
      'Escalate cautiously with planned recheck windows and measurable targets.',
      'Monitor for dehydration, azotemia, and electrolyte imbalance during progression.',
      'Reinforce owner education on intake, breathing pattern, and activity tolerance.',
      'Coordinate cardiology follow-up when response remains inconsistent.',
    ],
    examTraps: [
      'Treating drug classes as interchangeable without stage context can reduce effectiveness.',
      'Skipping renal and electrolyte follow-up after changes is a frequent exam miss.',
      'Assuming improved cough alone confirms durable control can be misleading.',
      'Ignoring blood pressure context may hide adverse hemodynamic response.',
      'Focusing on medication list instead of monitoring plan weakens long-term outcomes.',
    ],
    prompts: [
      'What treatment goal determines whether decongestion is the first priority?',
      'Which monitoring markers matter most after CHF medication changes?',
      'How should renal trends alter your adjustment cadence?',
      'When is cardiology re-evaluation most important during persistent signs?',
      'How can owner monitoring improve medication safety?',
    ],
    tool: {
      href: '/tools/chf-staging-planner.html',
      label: 'Use the CHF Staging Planner',
    },
    pillar: cardiologyPillar,
    primaryQuery: 'pimobendan diuretics overview veterinary',
    secondaryQueries: [
      'chf medications dog cat',
      'diuretic monitoring veterinary',
      'pimobendan educational guide',
    ],
    paa: [
      'How are pimobendan and diuretics used in CHF?',
      'What should be monitored after CHF medication changes?',
      'How often should renal values be rechecked?',
    ],
    intent: 'comparison',
  },
  {
    slug: 'syncope-differentials-dog-cat',
    title: 'Syncope Differentials in Dogs and Cats – VetLudics',
    description:
      'Review syncope differentials in dogs and cats with a practical triage algorithm, cardiopulmonary workup priorities, and exam-focused reasoning traps.',
    h1: 'Syncope Differentials in Dogs and Cats: Practical Triage Algorithm',
    summary:
      'Differentiate syncopal causes and prioritize cardiovascular versus non-cardiac workup.',
    kicker: 'Cardiology NAVLE Guide',
    intro:
      'Syncope cases require fast discrimination between high-risk cardiogenic causes and other transient collapse mimics. This guide provides a structured differential framework with triage priorities.',
    algorithm: [
      'Confirm true syncope versus seizure, weakness, or vestibular events using event history clues.',
      'Assess perfusion, rhythm, and hemodynamic risk immediately after presentation.',
      'Prioritize cardiogenic causes when collapse pattern and recovery profile fit.',
      'Use targeted diagnostics to separate rhythm, structural, and systemic contributors.',
      'Set return precautions and follow-up intervals based on recurrence severity.',
    ],
    diagnostics: [
      'Event history quality is critical for separating syncope from seizure-like episodes.',
      'ECG and blood pressure are high-yield first-tier assessments in many cases.',
      'Cardiac imaging and rhythm monitoring refine diagnosis in recurrent episodes.',
      'Laboratory screening helps identify metabolic and perfusion contributors.',
      'Serial reassessment is useful when initial diagnostics are nondiagnostic but suspicion remains.',
    ],
    treatment: [
      'Stabilize airway and perfusion first in unstable collapse presentations.',
      'Treat arrhythmia or structural contributors according to confirmed risk profile.',
      'Address systemic contributors such as severe anemia or electrolyte derangements.',
      'Implement monitoring strategy for recurrence and near-syncopal warning signs.',
      'Provide owner guidance for event logging and emergency escalation triggers.',
    ],
    examTraps: [
      'Assuming all collapse events are neurologic can delay cardiogenic diagnosis.',
      'Ignoring event timing and trigger context weakens differential ranking.',
      'Skipping rhythm evaluation in recurrent episodes is a common mistake.',
      'Failure to provide return precautions increases risk between visits.',
      'Relying on one normal snapshot can miss episodic arrhythmia pathology.',
    ],
    prompts: [
      'What historical clues separate syncope from seizure episodes?',
      'When should cardiogenic causes be prioritized first?',
      'Which diagnostics best capture intermittent arrhythmia causes?',
      'What follow-up plan reduces missed recurrence risk?',
      'How can owners document episodes to improve diagnostic clarity?',
    ],
    tool: {
      href: '/tools/emergency-drug-chart.html',
      label: 'Use the Emergency Drug Chart',
    },
    pillar: cardiologyPillar,
    primaryQuery: 'syncope differentials dog cat',
    secondaryQueries: [
      'collapse differential veterinary',
      'cardiogenic syncope dog',
      'feline syncope workup',
    ],
    paa: [
      'How do you differentiate syncope from seizure in dogs?',
      'What cardiac causes of syncope are most common?',
      'What tests are best for recurrent collapse episodes?',
    ],
    intent: 'informational',
  },
]

const calculatorPillar = {
  slug: 'veterinary-calculators-guide',
  title: 'Veterinary Calculators Guide – VetLudics',
  description:
    'Use this veterinary calculators pillar to learn dosing, fluids, CRI, acid-base, and interpretation workflows with linked support guides and tools.',
  h1: 'Veterinary Calculators Guide: Dose, Fluids, CRI, and Acid-Base Workflows',
  intro:
    'This pillar page organizes the core calculation concepts that repeatedly appear in clinics and NAVLE preparation. Each support page links formula logic to practical interpretation and safety checks.',
  workflow: [
    'Define the clinical question first so the correct calculator and formula are selected.',
    'Verify input units before calculation to avoid hidden conversion errors.',
    'Interpret outputs in clinical context rather than using numbers in isolation.',
    'Use reassessment data to adjust plans and detect mismatch early.',
  ],
}

const calculatorSupports = [
  {
    slug: 'mgkg-dosing-guide',
    title: 'mg/kg Dosing Guide for Veterinary Use – VetLudics',
    description:
      'Learn mg/kg dosing math, unit conversion checks, and concentration-to-volume steps for safer veterinary prescribing and exam-style medication calculations.',
    h1: 'mg/kg Dosing Guide for Veterinary Medication Math',
    summary:
      'Core mg/kg formula logic with concentration conversion safety checks.',
    intro:
      'This guide is for students and clinicians who need reliable mg/kg dosing math during prescribing and exam prep. It keeps focus on unit consistency, concentration conversion, and safety checks.',
    whatItDoes:
      'It turns body-weight dosing instructions into practical administration values while reducing arithmetic and unit-conversion mistakes.',
    inputs: [
      {
        name: 'Body weight',
        definition: 'Patient weight in kg (or converted from lb accurately).',
      },
      {
        name: 'Dose target',
        definition: 'Intended mg/kg dose selected for the clinical objective.',
      },
      {
        name: 'Drug concentration',
        definition: 'Product concentration in mg/mL or equivalent.',
      },
    ],
    outputs: [
      {
        name: 'Total mg required',
        definition:
          'Calculated medication amount before concentration conversion.',
      },
      {
        name: 'Administration volume',
        definition: 'Final mL value for administration planning.',
      },
    ],
    formulaSummary:
      'Total mg = body weight (kg) x dose (mg/kg). Administration volume = total mg divided by concentration (mg/mL).',
    exampleSteps: [
      'A 22 kg dog needs 5 mg/kg of a drug.',
      'Total required dose = 22 x 5 = 110 mg.',
      'If concentration is 20 mg/mL, volume = 110 / 20 = 5.5 mL.',
      'Round only according to safe administration precision and protocol guidance.',
    ],
    pitfalls: [
      'Mixing lb and kg without explicit conversion can double or halve dose plans.',
      'Using mg/tablet as if it were mg/mL creates administration-volume errors.',
      'Rounding too early in multi-step calculations amplifies final error.',
      'Dose selection still depends on indication, renal status, and patient context.',
    ],
    tool: {
      href: '/tools/dose-calculator.html',
      label: 'Use the Dose Calculator',
    },
    topicLinks: [
      {
        href: '/emergency-triage-algorithms/',
        label: 'Apply dosing logic in emergency care workflows',
      },
      {
        href: '/dka-approach-veterinary/',
        label: 'See dose sequencing in DKA approach decisions',
      },
      {
        href: '/pimobendan-diuretics-overview/',
        label: 'Review medication monitoring context in CHF',
      },
    ],
    referenceLink: {
      href: '/dog-cat-normal-values/',
      label: 'Cross-check lab context in normal values reference',
    },
    pillar: calculatorPillar,
    primaryQuery: 'mg kg dosing guide veterinary',
    secondaryQueries: [
      'how to calculate mg/kg dose dog cat',
      'veterinary dose conversion',
      'mg/ml conversion vet',
    ],
    paa: [
      'How do you calculate mg/kg dose?',
      'How do you convert mg to mL?',
      'What dosing mistakes are most common?',
    ],
    intent: 'tool',
  },
  {
    slug: 'cri-setup-guide',
    title: 'CRI Setup Guide for Veterinary Patients – VetLudics',
    description:
      'Learn veterinary CRI setup with dose-unit conversion, concentration planning, and pump-rate verification to reduce infusion errors in exam workflows.',
    h1: 'CRI Setup Guide for Veterinary Continuous Infusions',
    summary:
      'Plan CRI concentration and infusion rate with practical setup safeguards.',
    intro:
      'CRI questions blend calculation with setup reliability. This guide helps you connect concentration planning, infusion rate targets, and monitoring safety in one workflow.',
    whatItDoes:
      'It translates CRI dose targets into practical infusion pump settings and checks for concentration, line, and monitoring consistency.',
    inputs: [
      {
        name: 'Patient weight',
        definition: 'Weight in kilograms for dose normalization.',
      },
      {
        name: 'CRI target dose',
        definition: 'Prescribed rate in mcg/kg/min or mg/kg/hr.',
      },
      {
        name: 'Prepared concentration',
        definition: 'Final concentration in infusion bag or syringe.',
      },
    ],
    outputs: [
      { name: 'Infusion rate', definition: 'Pump setting in mL/hr.' },
      {
        name: 'Dose verification',
        definition: 'Back-calculated dose to confirm setup accuracy.',
      },
    ],
    formulaSummary:
      'Convert dose target to mg/hr (or mcg/hr), then divide by prepared concentration to reach mL/hr pump setting.',
    exampleSteps: [
      'A 12 kg patient needs 0.05 mg/kg/hr.',
      'Required mg/hr = 12 x 0.05 = 0.6 mg/hr.',
      'If bag concentration is 0.2 mg/mL, infusion rate = 0.6 / 0.2 = 3 mL/hr.',
      'Confirm line labeling and independent rate double-check before start.',
    ],
    pitfalls: [
      'Confusing mcg and mg units is the most dangerous CRI setup error.',
      'Changing concentration without recalculating mL/hr can silently alter dose delivery.',
      'Not labeling concentration and target dose on the line increases handoff risk.',
      'CRI adjustments require reassessment of both clinical response and adverse effects.',
    ],
    tool: {
      href: '/tools/cri-calculator.html',
      label: 'Use the CRI Calculator',
    },
    topicLinks: [
      {
        href: '/dka-approach-veterinary/',
        label: 'Apply CRI sequence in DKA stabilization',
      },
      {
        href: '/sepsis-sirs-veterinary/',
        label: 'See infusion priorities in sepsis support',
      },
      {
        href: '/shock-types-veterinary/',
        label: 'Compare infusion choices across shock types',
      },
    ],
    referenceLink: {
      href: '/reference/normal-values.html',
      label: 'Reference monitoring ranges during CRI therapy',
    },
    pillar: calculatorPillar,
    primaryQuery: 'cri setup guide veterinary',
    secondaryQueries: [
      'veterinary infusion rate calculation',
      'mcg kg min to ml hr',
      'cri dose check',
    ],
    paa: [
      'How do you set up a CRI in dogs and cats?',
      'How do you convert CRI dose to mL/hr?',
      'What are common CRI safety errors?',
    ],
    intent: 'tool',
  },
  {
    slug: 'fluid-deficit-guide',
    title: 'Fluid Deficit Guide for Veterinary Patients – VetLudics',
    description:
      'Calculate veterinary fluid deficit with dehydration estimates, replacement timing, and reassessment strategy for emergency and inpatient care.',
    h1: 'Fluid Deficit Guide: Veterinary Dehydration Replacement Planning',
    summary:
      'Convert dehydration estimates into replacement plans with reassessment checkpoints.',
    intro:
      'Fluid deficit calculations are easy to over-simplify. This guide shows how to convert dehydration percentage into replacement volume while keeping reassessment central.',
    whatItDoes:
      'It helps estimate replacement volume, distribute timing, and avoid overcorrection by integrating dynamic clinical reassessment.',
    inputs: [
      { name: 'Body weight', definition: 'Patient weight in kilograms.' },
      {
        name: 'Estimated dehydration',
        definition: 'Clinical dehydration percentage estimate.',
      },
      {
        name: 'Replacement window',
        definition: 'Target timeframe for deficit replacement.',
      },
    ],
    outputs: [
      {
        name: 'Deficit volume',
        definition: 'Estimated mL needed to replace dehydration deficit.',
      },
      {
        name: 'Hourly replacement target',
        definition: 'Deficit portion translated to mL/hr over selected window.',
      },
    ],
    formulaSummary:
      'Deficit (mL) = body weight (kg) x dehydration fraction x 1000. Then distribute replacement across chosen hours with reassessment.',
    exampleSteps: [
      'A 15 kg dog is estimated 8% dehydrated.',
      'Deficit = 15 x 0.08 x 1000 = 1200 mL.',
      'If planned over 12 hours, deficit portion is 100 mL/hr before maintenance and ongoing losses.',
      'Reassess perfusion and hydration signs often and adjust rate rather than locking one static plan.',
    ],
    pitfalls: [
      'Dehydration percentage is an estimate and should be corrected with serial reassessment.',
      'Ignoring ongoing losses can underdose total fluid support.',
      'Replacing full deficit too quickly may stress cardiopulmonary status.',
      'Maintenance and deficit are separate components and should not be merged blindly.',
    ],
    tool: {
      href: '/tools/fluid-calculator.html',
      label: 'Use the Fluid Calculator',
    },
    topicLinks: [
      {
        href: '/shock-types-veterinary/',
        label: 'Link deficit planning with shock phenotype decisions',
      },
      {
        href: '/heatstroke-veterinary/',
        label: 'Apply fluid logic in heatstroke stabilization',
      },
      {
        href: '/gdv-approach/',
        label: 'Use deficit logic in GDV perfusion planning',
      },
    ],
    referenceLink: {
      href: '/dog-cat-normal-values/',
      label: 'Use normal values to interpret fluid response trends',
    },
    pillar: calculatorPillar,
    primaryQuery: 'fluid deficit calculation veterinary',
    secondaryQueries: [
      'dehydration deficit dog cat',
      'vet fluid replacement formula',
      'how to calculate fluid deficit',
    ],
    paa: [
      'How do you calculate fluid deficit in dogs and cats?',
      'How fast should fluid deficit be replaced?',
      'How do ongoing losses change fluid plans?',
    ],
    intent: 'tool',
  },
  {
    slug: 'maintenance-fluids-guide',
    title: 'Maintenance Fluids Guide in Veterinary Medicine – VetLudics',
    description:
      'Review maintenance fluid calculations and practical adjustment logic for veterinary inpatients with clear monitoring and safety checkpoints.',
    h1: 'Maintenance Fluids Guide for Veterinary Inpatients',
    summary:
      'Calculate baseline maintenance rates and adjust with practical monitoring logic.',
    intro:
      'Maintenance fluids should match physiologic need without masking decline or causing overload. This guide clarifies baseline rate selection and adjustment triggers.',
    whatItDoes:
      'It provides a practical way to estimate maintenance requirements and adjust rates based on clinical response and concurrent losses.',
    inputs: [
      {
        name: 'Body weight',
        definition: 'Weight in kilograms used for maintenance estimation.',
      },
      {
        name: 'Clinical status',
        definition:
          'Hydration/perfusion context that may modify baseline maintenance.',
      },
      {
        name: 'Concurrent losses',
        definition:
          'Vomiting, diarrhea, drains, or polyuria affecting net need.',
      },
    ],
    outputs: [
      {
        name: 'Maintenance estimate',
        definition: 'Baseline mL/day or mL/hr requirement.',
      },
      {
        name: 'Adjusted delivery rate',
        definition: 'Practical rate after losses and tolerance are considered.',
      },
    ],
    formulaSummary:
      'Maintenance can be estimated using standard mL/kg/day frameworks, then converted to mL/hr and adjusted for current losses and monitoring data.',
    exampleSteps: [
      'A 6 kg cat has baseline maintenance estimate of 50 mL/kg/day.',
      'Daily requirement = 6 x 50 = 300 mL/day.',
      'Hourly rate = 300 / 24 = 12.5 mL/hr before adding ongoing losses.',
      'Adjust down or up based on hydration, urine output, and cardiopulmonary tolerance.',
    ],
    pitfalls: [
      'Confusing maintenance with resuscitation or deficit replacement causes mismatched rates.',
      'Ignoring ongoing losses underestimates needed support.',
      'Failing to reassess can allow fluid creep and overload in fragile patients.',
      'Single formula use without context can be unsafe in renal or cardiac compromise.',
    ],
    tool: {
      href: '/tools/fluid-calculator.html',
      label: 'Use the Fluid Calculator',
    },
    topicLinks: [
      {
        href: '/dka-approach-veterinary/',
        label: 'Apply maintenance logic during DKA stabilization phases',
      },
      {
        href: '/sepsis-sirs-veterinary/',
        label: 'See maintenance adjustment in sepsis reassessment cycles',
      },
      {
        href: '/pleural-effusion-vs-pulmonary-edema/',
        label: 'Balance fluids in cardiopulmonary compromise cases',
      },
    ],
    referenceLink: {
      href: '/reference/normal-values.html',
      label: 'Monitor lab trends while adjusting maintenance rates',
    },
    pillar: calculatorPillar,
    primaryQuery: 'maintenance fluid calculation veterinary',
    secondaryQueries: [
      'vet maintenance fluids dog cat',
      'ml kg day conversion',
      'maintenance fluid rate mL hr',
    ],
    paa: [
      'How are maintenance fluids calculated?',
      'How do you convert mL/day to mL/hr?',
      'When should maintenance rates be adjusted?',
    ],
    intent: 'tool',
  },
  {
    slug: 'anion-gap-interpretation',
    title: 'Anion Gap Interpretation Guide – VetLudics',
    description:
      'Use this anion gap interpretation guide to connect electrolyte math with acid-base reasoning and practical emergency decision support in veterinary patients.',
    h1: 'Anion Gap Interpretation Guide for Veterinary Acid-Base Cases',
    summary:
      'Compute and interpret anion gap in clinical context with caveats.',
    intro:
      'Anion gap can sharpen metabolic acidosis interpretation when used in context. This guide covers calculation logic, interpretation boundaries, and practical integration in emergency workflows.',
    whatItDoes:
      'It helps quantify unmeasured anion burden and pair that result with broader acid-base and perfusion interpretation.',
    inputs: [
      { name: 'Sodium', definition: 'Serum sodium concentration.' },
      { name: 'Chloride', definition: 'Serum chloride concentration.' },
      {
        name: 'Bicarbonate/Total CO2',
        definition: 'Buffer component used in anion gap calculation.',
      },
    ],
    outputs: [
      {
        name: 'Anion gap',
        definition: 'Calculated estimate of unmeasured anion burden.',
      },
      {
        name: 'Interpretive pattern',
        definition:
          'Contextual clue for high-anion vs normal-anion metabolic acidosis pathways.',
      },
    ],
    formulaSummary:
      'Common calculation: Anion gap = Na - (Cl + HCO3). Interpret with species reference intervals and full acid-base context.',
    exampleSteps: [
      'Na = 152, Cl = 112, HCO3 = 16.',
      'Anion gap = 152 - (112 + 16) = 24.',
      'Compare result with local reference interval and concurrent lactate/ketone context.',
      'Use result to prioritize differential pathways rather than as standalone diagnosis.',
    ],
    pitfalls: [
      'Ignoring laboratory reference interval differences can misclassify severity.',
      'Treating anion gap as a diagnosis instead of a pattern clue limits accuracy.',
      'Missing concurrent mixed acid-base disorders can distort interpretation.',
      'Albumin and lab method variation can shift expected values.',
    ],
    tool: {
      href: '/tools/acid-base-electrolyte.html',
      label: 'Use the Acid-Base and Electrolyte Tool',
    },
    topicLinks: [
      {
        href: '/dka-approach-veterinary/',
        label: 'Apply anion gap logic in DKA interpretation',
      },
      {
        href: '/sepsis-sirs-veterinary/',
        label: 'Use acid-base context in sepsis progression checks',
      },
      {
        href: '/shock-types-veterinary/',
        label: 'Pair perfusion status with acid-base interpretation',
      },
    ],
    referenceLink: {
      href: '/dog-cat-normal-values/',
      label: 'Compare values with species normal ranges',
    },
    pillar: calculatorPillar,
    primaryQuery: 'anion gap interpretation veterinary',
    secondaryQueries: [
      'anion gap formula dog cat',
      'high anion gap acidosis vet',
      'acid base calculator veterinary',
    ],
    paa: [
      'How is anion gap calculated?',
      'What causes high anion gap in dogs and cats?',
      'Can normal anion gap still mean serious disease?',
    ],
    intent: 'tool',
  },
  {
    slug: 'osmolality-basics-veterinary',
    title: 'Osmolality Basics in Veterinary Medicine – VetLudics',
    description:
      'Learn veterinary osmolality basics, calculated osmolality use, and practical interpretation caveats for endocrine and emergency case review.',
    h1: 'Osmolality Basics for Veterinary Clinical Interpretation',
    summary:
      'Understand osmolality math, interpretation limits, and clinical use cases.',
    intro:
      'Osmolality concepts appear in endocrine and critical care decision-making, especially when dehydration and hyperglycemia coexist. This guide keeps the framework practical and clinically grounded.',
    whatItDoes:
      'It explains how calculated osmolality supports interpretation of fluid shifts and metabolic disturbances in emergency and inpatient settings.',
    inputs: [
      {
        name: 'Sodium',
        definition: 'Major contributor to extracellular osmolality.',
      },
      {
        name: 'Glucose',
        definition: 'Important contributor in hyperglycemic states.',
      },
      {
        name: 'BUN',
        definition: 'Can influence calculated osmolality context.',
      },
    ],
    outputs: [
      {
        name: 'Calculated osmolality',
        definition: 'Estimated plasma osmolality for pattern assessment.',
      },
      {
        name: 'Interpretive context',
        definition: 'Framework for fluid-shift and neurologic-risk reasoning.',
      },
    ],
    formulaSummary:
      'Calculated osmolality uses sodium plus selected solutes (commonly glucose and BUN) with unit-specific conversion factors.',
    exampleSteps: [
      'Use unit-correct formula for your lab reporting system.',
      'Insert sodium, glucose, and BUN values accurately.',
      'Compare result with expected range and clinical signs.',
      'Interpret alongside hydration and neurologic findings before changing therapy.',
    ],
    pitfalls: [
      'Unit mismatch between mmol/L and mg/dL formulas causes major errors.',
      'Calculated values should not replace measured osmolality when precision is critical.',
      'Rapid osmolar correction without context can increase neurologic risk.',
      'Single-point values without trend interpretation can be misleading.',
    ],
    tool: {
      href: '/tools/acid-base-electrolyte.html',
      label: 'Use the Acid-Base and Electrolyte Tool',
    },
    topicLinks: [
      {
        href: '/dka-approach-veterinary/',
        label: 'Connect osmolality reasoning to DKA fluid planning',
      },
      {
        href: '/heatstroke-veterinary/',
        label: 'Integrate osmolality context in severe dehydration states',
      },
      {
        href: '/shock-types-veterinary/',
        label: 'Use osmolality trends in perfusion-guided reassessment',
      },
    ],
    referenceLink: {
      href: '/reference/normal-values.html',
      label: 'Compare electrolytes with reference intervals',
    },
    pillar: calculatorPillar,
    primaryQuery: 'osmolality basics veterinary',
    secondaryQueries: [
      'calculated osmolality dog cat',
      'osmolar gap veterinary',
      'hyperosmolar interpretation vet',
    ],
    paa: [
      'How is osmolality calculated in veterinary patients?',
      'When should measured osmolality be used?',
      'Why does osmolality matter in DKA?',
    ],
    intent: 'tool',
  },
  {
    slug: 'dextrose-correction-guide',
    title: 'Dextrose Correction Guide in Veterinary Medicine – VetLudics',
    description:
      'Review dextrose correction planning for veterinary patients with hypoglycemia or insulin therapy transitions, including calculation and monitoring safeguards.',
    h1: 'Dextrose Correction Guide for Veterinary Patients',
    summary:
      'Plan dextrose adjustments safely during hypoglycemia and insulin workflows.',
    intro:
      'Dextrose correction decisions are often time-sensitive and error-prone. This guide links concentration math to practical monitoring and safe correction pacing.',
    whatItDoes:
      'It supports dextrose concentration and delivery planning while emphasizing reassessment intervals and avoidance of overcorrection.',
    inputs: [
      {
        name: 'Current glucose',
        definition: 'Measured glucose at decision point.',
      },
      {
        name: 'Target glucose range',
        definition: 'Goal range based on clinical context and protocol.',
      },
      {
        name: 'Available dextrose concentration',
        definition: 'Stock concentration used for dilution planning.',
      },
    ],
    outputs: [
      {
        name: 'Dextrose plan',
        definition:
          'Practical infusion or bolus approach aligned to target correction.',
      },
      {
        name: 'Monitoring cadence',
        definition: 'Frequency for repeat glucose and reassessment checks.',
      },
    ],
    formulaSummary:
      'Use concentration-dilution math and rate planning to match correction intensity to current hypoglycemia severity and ongoing insulin exposure.',
    exampleSteps: [
      'Identify current glucose trend and urgency of correction.',
      'Select concentration and route consistent with perfusion and line access.',
      'Calculate infusion or bolus delivery plan using verified concentration math.',
      'Recheck glucose at defined intervals and taper as stability improves.',
    ],
    pitfalls: [
      'Overcorrection can trigger rebound swings that complicate endocrine management.',
      'Failing to account for concurrent insulin or CRI exposure distorts correction needs.',
      'Unclear monitoring cadence can miss rapid decline after initial response.',
      'Concentration dilution errors are common without independent checks.',
    ],
    tool: {
      href: '/tools/electrolyte-replacement-planner.html',
      label: 'Use the Electrolyte Replacement Planner',
    },
    topicLinks: [
      {
        href: '/dka-approach-veterinary/',
        label: 'Apply dextrose transitions in DKA management',
      },
      {
        href: '/sepsis-sirs-veterinary/',
        label: 'Monitor glucose stability in septic critical care cases',
      },
      {
        href: '/heatstroke-veterinary/',
        label: 'Integrate glucose support in severe heat injury care',
      },
    ],
    referenceLink: {
      href: '/dog-cat-normal-values/',
      label: 'Reference glucose ranges in dogs and cats',
    },
    pillar: calculatorPillar,
    primaryQuery: 'dextrose correction guide veterinary',
    secondaryQueries: [
      'hypoglycemia treatment dog cat',
      'dextrose infusion calculation vet',
      'glucose correction veterinary',
    ],
    paa: [
      'How do you correct hypoglycemia in dogs and cats?',
      'How often should glucose be checked during correction?',
      'How is dextrose dilution calculated?',
    ],
    intent: 'tool',
  },
  {
    slug: 'body-condition-score-guide',
    title: 'Body Condition Score Guide for Dogs and Cats – VetLudics',
    description:
      'Use a practical body condition score guide for dogs and cats with caloric planning context and common interpretation pitfalls for clinical communication.',
    h1: 'Body Condition Score Guide for Dogs and Cats',
    summary:
      'Practical BCS interpretation linked to nutrition and follow-up planning.',
    intro:
      'Body condition scoring becomes clinically useful when linked to trend tracking and nutrition plans. This guide shows how to turn BCS findings into actionable feeding and monitoring targets.',
    whatItDoes:
      'It standardizes BCS assessment language and links score interpretation to caloric planning, client communication, and follow-up goals.',
    inputs: [
      {
        name: 'Species and body type',
        definition: 'Dog/cat context and breed conformation.',
      },
      {
        name: 'Palpation findings',
        definition: 'Rib cover, waist, and abdominal tuck observations.',
      },
      {
        name: 'Current intake pattern',
        definition: 'Feeding routine, treats, and activity profile.',
      },
    ],
    outputs: [
      {
        name: 'BCS category',
        definition:
          'Underconditioned, ideal, or overconditioned classification.',
      },
      {
        name: 'Nutrition planning direction',
        definition: 'Caloric adjustment framework and follow-up target range.',
      },
    ],
    formulaSummary:
      'BCS is a semi-quantitative clinical scoring system interpreted alongside weight trend, muscle condition, and dietary history.',
    exampleSteps: [
      'Assess rib palpability and visible waist profile.',
      'Assign a standardized BCS tier consistently.',
      'Pair BCS with weight trend and diet history before plan changes.',
      'Set recheck target interval with measurable adjustment goals.',
    ],
    pitfalls: [
      'Using visual impression alone without palpation can misclassify condition.',
      'Ignoring muscle condition may hide concurrent sarcopenia despite higher body fat.',
      'Large abrupt calorie changes reduce adherence and can destabilize intake behavior.',
      'Inconsistent scoring between visits weakens trend interpretation.',
    ],
    tool: {
      href: '/tools/nutrition-rer-mer-calculator.html',
      label: 'Use the Nutrition RER/MER Calculator',
    },
    topicLinks: [
      {
        href: '/cardiology-chf-algorithm/',
        label: 'Apply BCS context in chronic cardiology follow-up',
      },
      {
        href: '/dcm-basics-dog-cat/',
        label: 'Integrate nutrition status in DCM monitoring plans',
      },
      {
        href: '/systemic-hypertension-target-organ-damage/',
        label: 'Use weight trends in hypertension management context',
      },
    ],
    referenceLink: {
      href: '/reference/normal-values.html',
      label: 'Pair BCS with baseline lab interpretation trends',
    },
    pillar: calculatorPillar,
    primaryQuery: 'body condition score guide dog cat',
    secondaryQueries: [
      'veterinary bcs chart',
      'dog cat body condition assessment',
      'bcs interpretation vet',
    ],
    paa: [
      'How is body condition score assessed?',
      'What BCS is ideal for dogs and cats?',
      'How often should BCS be rechecked?',
    ],
    intent: 'informational',
  },
  {
    slug: 'toxic-dose-calculations-guide',
    title: 'Toxic Dose Calculations Guide for Veterinary Cases – VetLudics',
    description:
      'Review toxic dose calculation strategy for common veterinary exposures with triage interpretation, uncertainty handling, and safety caveats.',
    h1: 'Toxic Dose Calculations Guide for Veterinary Triage',
    summary:
      'Estimate exposure burden and triage urgency with safer interpretation steps.',
    intro:
      'Toxicity math should support triage urgency, not create false certainty. This guide explains exposure calculation workflow and interpretation boundaries in real case contexts.',
    whatItDoes:
      'It converts estimated intake into dose-per-kg context and helps classify urgency with practical uncertainty awareness.',
    inputs: [
      {
        name: 'Estimated amount ingested',
        definition: 'Best available quantity estimate from owner history.',
      },
      {
        name: 'Patient weight',
        definition: 'Weight in kilograms for dose normalization.',
      },
      {
        name: 'Substance concentration',
        definition: 'Active compound amount per tablet, mL, or gram.',
      },
    ],
    outputs: [
      {
        name: 'Estimated mg/kg exposure',
        definition: 'Dose estimate used for risk framing.',
      },
      {
        name: 'Triage urgency category',
        definition:
          'Initial urgency interpretation before definitive toxicology consult.',
      },
    ],
    formulaSummary:
      'Estimated exposure (mg/kg) = total active compound ingested (mg) divided by body weight (kg), interpreted with uncertainty ranges.',
    exampleSteps: [
      'Estimate total active compound from package concentration and likely amount missing.',
      'Divide by patient body weight to obtain mg/kg exposure estimate.',
      'Classify risk using conservative interpretation when history is uncertain.',
      'Escalate triage immediately if clinical signs suggest progression beyond estimated exposure risk.',
    ],
    pitfalls: [
      'Owner estimates are often uncertain; narrow precision can be misleading.',
      'Assuming one known ingredient excludes others in combination products is unsafe.',
      'Delaying treatment while refining exact dose can increase risk in symptomatic patients.',
      'Exposure math should be integrated with signs, timing, and species sensitivity.',
    ],
    tool: {
      href: '/tools/toxin-decontamination-planner.html',
      label: 'Use the Toxin Decontamination Planner',
    },
    topicLinks: [
      {
        href: '/rodenticide-bleeding-veterinary/',
        label: 'Apply toxicity math in rodenticide bleeding cases',
      },
      {
        href: '/heatstroke-veterinary/',
        label:
          'Compare toxin triage to other emergency stabilization workflows',
      },
      {
        href: '/sepsis-sirs-veterinary/',
        label:
          'Differentiate toxic collapse from infectious instability patterns',
      },
    ],
    referenceLink: {
      href: '/reference/toxicities.html',
      label: 'Cross-check toxicology reference profiles',
    },
    pillar: calculatorPillar,
    primaryQuery: 'toxic dose calculation veterinary',
    secondaryQueries: [
      'dog cat toxicity mg kg calculation',
      'poison dose estimate vet',
      'toxicology triage calculations',
    ],
    paa: [
      'How do you calculate toxic dose in dogs and cats?',
      'What if ingested amount is uncertain?',
      'When should toxicity cases be treated immediately?',
    ],
    intent: 'tool',
  },
  {
    slug: 'lab-interpretation-caveats',
    title: 'Veterinary Lab Interpretation Caveats – VetLudics',
    description:
      'Review lab interpretation caveats in veterinary medicine with species differences, variability warnings, and red-flag escalation triggers for safer decisions.',
    h1: 'Veterinary Lab Interpretation Caveats: Context Before Conclusion',
    summary:
      'Reference-style guide to lab variability, red flags, and escalation decisions.',
    intro:
      'Laboratory data is powerful when interpreted in context and risky when read in isolation. This guide summarizes practical caveats, species differences, and escalation triggers.',
    whatItDoes:
      'It provides a reference-oriented framework for interpreting CBC and chemistry values with signalment, trend, and clinical context.',
    inputs: [
      {
        name: 'Current lab values',
        definition: 'CBC, chemistry, electrolytes, and related diagnostics.',
      },
      {
        name: 'Species and signalment',
        definition: 'Dog/cat differences plus age and breed context.',
      },
      {
        name: 'Clinical timeline',
        definition: 'Acute versus chronic trajectory and treatment phase.',
      },
    ],
    outputs: [
      {
        name: 'Contextual interpretation',
        definition:
          'Prioritized meaning of abnormalities in current case context.',
      },
      {
        name: 'Escalation decision',
        definition: 'When to monitor, intervene, or urgently re-evaluate.',
      },
    ],
    formulaSummary:
      'No single formula defines interpretation quality. The core method is trend + context + red-flag recognition, anchored to species-specific reference intervals.',
    exampleSteps: [
      'Compare values with species-appropriate reference intervals and analyzer context.',
      'Assess direction and magnitude of change against prior results if available.',
      'Link abnormalities to perfusion, respiratory, neurologic, and hydration findings.',
      'Escalate quickly when red-flag combinations suggest life-threatening deterioration.',
    ],
    pitfalls: [
      'Single-value interpretation without trend context is a frequent clinical mistake.',
      'Ignoring species or analyzer variation can produce false abnormal labeling.',
      'Failure to prioritize red-flag combinations delays necessary escalation.',
      'Overconfidence in mild isolated abnormalities can distract from major syndrome drivers.',
    ],
    tool: {
      href: '/tools/unit-converter.html',
      label: 'Use the Unit Converter for lab normalization',
    },
    topicLinks: [
      {
        href: '/dog-cat-normal-values/',
        label: 'Reference dog and cat normal value ranges',
      },
      {
        href: '/anion-gap-interpretation/',
        label: 'Interpret acid-base shifts with anion gap context',
      },
      {
        href: '/pleural-effusion-differentials-veterinary/',
        label: 'Use lab context in respiratory differential prioritization',
      },
    ],
    referenceLink: {
      href: '/sources-and-limitations/',
      label: 'Review general sources and limitations policy',
    },
    pillar: calculatorPillar,
    primaryQuery: 'veterinary lab interpretation caveats',
    secondaryQueries: [
      'dog cat lab variability',
      'veterinary red flag labs',
      'how to interpret lab trends vet',
    ],
    paa: [
      'How should veterinary labs be interpreted safely?',
      'What lab patterns are emergency red flags?',
      'Why do species differences matter in lab interpretation?',
    ],
    intent: 'informational',
  },
]

function siblingsFor(group, currentIndex) {
  return [
    group[(currentIndex + 1) % group.length],
    group[(currentIndex + 2) % group.length],
  ]
}

function writePage(slug, html) {
  const dir = dirFromSlug(slug)
  mkdirSync(dir, { recursive: true })
  writeFileSync(`${dir}/index.html`, html, 'utf8')
}

writePage(
  emergencyPillar.slug,
  renderPillarPage(emergencyPillar, emergencySupports, [
    {
      href: '/tools/er-algorithms.html',
      label: 'Use the ER algorithms tool for rapid reinforcement',
    },
    {
      href: '/study/navle/practice/',
      label: 'Try 5 free emergency-focused practice questions',
    },
    {
      href: '/veterinary-calculators-guide/',
      label: 'Open the calculators guide for emergency math support',
    },
    {
      href: '/pricing/',
      label: 'See Premium benefits for unlimited emergency practice sets',
    },
  ])
)

emergencySupports.forEach((page, index) => {
  writePage(
    page.slug,
    renderTopicGuidePage(page, siblingsFor(emergencySupports, index))
  )
})

writePage(
  cardiologyPillar.slug,
  renderPillarPage(cardiologyPillar, cardiologySupports, [
    {
      href: '/cardiology-chf-algorithm/',
      label: 'Open the CHF algorithm landing page',
    },
    {
      href: '/tools/chf-staging-planner.html',
      label: 'Use the CHF staging tool',
    },
    {
      href: '/study/navle/practice/',
      label: 'Try 5 free cardiology practice questions',
    },
    {
      href: '/pricing/',
      label: 'Review Premium benefits for unlimited cardiology practice',
    },
  ])
)

cardiologySupports.forEach((page, index) => {
  writePage(
    page.slug,
    renderTopicGuidePage(page, siblingsFor(cardiologySupports, index))
  )
})

writePage(
  calculatorPillar.slug,
  renderPillarPage(calculatorPillar, calculatorSupports, [
    { href: '/tools/', label: 'Open the full veterinary tools library' },
    {
      href: '/veterinary-calculators/',
      label: 'Use the veterinary calculators hub',
    },
    {
      href: '/study/navle/practice/',
      label: 'Test calculation concepts in practice questions',
    },
    {
      href: '/pricing/',
      label: 'Review Premium benefits for unlimited concept practice',
    },
  ])
)

calculatorSupports.forEach((page, index) => {
  writePage(
    page.slug,
    renderToolGuidePage(page, siblingsFor(calculatorSupports, index))
  )
})

const sourcesPage = wrapPage({
  title: 'Veterinary Sources and Limitations – VetLudics',
  description:
    'Review VetLudics sources approach, calculator limitations, and practical safety boundaries for educational veterinary content and clinical math tools.',
  canonicalPath: '/sources-and-limitations/',
  bodyClass: 'pc-page pc-page--study',
  mainClass: 'pc-bridge-shell',
  content: `        <section class="pc-bridge-hero">
            <p class="pc-kicker">Trust and Safety</p>
            <h1 class="pc-fork-title">Sources and Limitations</h1>
            <p class="pc-fork-copy">This page explains how VetLudics uses source material and where educational tools stop. It is intended to make clinical safety boundaries explicit for students and clinicians using the platform.</p>
            <p class="pc-last-reviewed">Last reviewed: ${LAST_REVIEWED}</p>
        </section>

        <section class="pc-bridge-section" aria-label="Sources approach">
            <h2 class="pc-bridge-title">Sources Approach</h2>
            <ul class="pc-link-list">
${listItems(approvedReferences)}
                <li>Supplemental interpretation relies on established veterinary clinical education practice and exam-oriented framing.</li>
                <li>High-impact pages are reviewed on a recurring schedule and updated when major guidance shifts are identified.</li>
            </ul>
        </section>

        <section class="pc-bridge-section" aria-label="Calculator limitations">
            <h2 class="pc-bridge-title">Calculator and Guide Limitations</h2>
            <div class="pc-table-wrap">
                <table class="pc-table">
                    <thead>
                        <tr><th>Area</th><th>Limitation</th><th>Safe Use Rule</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>Dosing</td><td>Concentration and unit mismatch risk</td><td>Always verify units and product concentration before use.</td></tr>
                        <tr><td>Fluids</td><td>Static plans can miss dynamic instability</td><td>Reassess perfusion and adjust rates frequently.</td></tr>
                        <tr><td>Acid-Base</td><td>Single values can hide mixed disorders</td><td>Interpret trends with full clinical context.</td></tr>
                        <tr><td>Toxicology</td><td>Ingestion estimates are often uncertain</td><td>Use conservative triage when history is incomplete.</td></tr>
                    </tbody>
                </table>
            </div>
        </section>

        <section class="pc-bridge-section" aria-label="Update triggers and review cadence">
            <h2 class="pc-bridge-title">Update Triggers and Review Cadence</h2>
            <p class="pc-fork-copy">Priority updates are triggered when high-impact guidance, safety framing, or common exam interpretation points change. Emergency, cardiology, and dosing content is reviewed first because these topics carry the highest downstream risk if outdated assumptions persist.</p>
            <p class="pc-fork-copy">Each update cycle includes source re-check, copy clarity review, internal link validation, and confirmation that educational limitations remain explicit. If a page is revised for safety clarity, its last-reviewed date is refreshed on publication.</p>
        </section>

        <section class="pc-bridge-section" aria-label="Red flags and escalation">
            <h2 class="pc-bridge-title">When to Escalate Immediately</h2>
            <ul class="pc-link-list">
                <li>Persistent respiratory distress, syncope, altered mentation, or progressive perfusion failure.</li>
                <li>Rapidly worsening electrolyte or acid-base derangements despite initial correction.</li>
                <li>Active bleeding, suspected severe toxicosis, or uncontrolled arrhythmia patterns.</li>
                <li>Any scenario where calculator output conflicts with direct patient status.</li>
            </ul>
            <div class="pc-note-box">
                <p>Educational only. VetLudics does not provide patient-specific diagnosis or treatment advice and does not replace direct veterinary supervision.</p>
            </div>
        </section>

        <section class="pc-bridge-section" aria-label="Related policy links">
            <h2 class="pc-bridge-title">Related Policy Links</h2>
            <ul class="pc-link-list">
                <li><a href="/editorial-policy/">Editorial policy and review process</a></li>
                <li><a href="/about.html">About the author and credentials</a></li>
                <li><a href="/pricing/">Pricing and access model transparency</a></li>
            </ul>
        </section>`,
})
writePage('sources-and-limitations', sourcesPage)

function buildKeywordRow(pageType, page, links) {
  const slug = toPath(page.slug)
  const primary = page.primaryQuery || page.h1.toLowerCase()
  const secondary = page.secondaryQueries
    ? page.secondaryQueries.join('; ')
    : 'cluster hub query set'
  const paa = page.paa ? page.paa.join('; ') : 'cluster orientation intent'
  const intent = page.intent || 'informational'
  return `| ${pageType} | ${primary} | ${secondary} | ${paa} | ${slug} | ${intent} | ${links.join('; ')} |`
}

const keywordRows = []

function addClusterKeywordRows(pillar, supports, pillarLinkSet) {
  const pillarSupportLinks = supports.map((page) => toPath(page.slug))
  keywordRows.push(
    buildKeywordRow('Pillar', pillar, [...pillarSupportLinks, ...pillarLinkSet])
  )

  supports.forEach((page, index) => {
    const siblings = siblingsFor(supports, index).map((item) =>
      toPath(item.slug)
    )
    const links = [
      toPath(pillar.slug),
      page.tool.href,
      ...siblings,
      '/study/navle/practice/',
      '/pricing/',
    ]
    keywordRows.push(buildKeywordRow('Support', page, links))
  })
}

addClusterKeywordRows(emergencyPillar, emergencySupports, [
  '/tools/er-algorithms.html',
  '/study/navle/practice/',
  '/pricing/',
])

addClusterKeywordRows(cardiologyPillar, cardiologySupports, [
  '/cardiology-chf-algorithm/',
  '/tools/chf-staging-planner.html',
  '/study/navle/practice/',
  '/pricing/',
])

addClusterKeywordRows(calculatorPillar, calculatorSupports, [
  '/tools/',
  '/veterinary-calculators/',
  '/study/navle/practice/',
  '/pricing/',
])

const keywordMap = `# Phase 2 Keyword and Intent Map

| Page Type | Primary Query | Secondary Queries | PAA Sub-intents | URL | Intent | Internal Link Targets |
|---|---|---|---|---|---|---|
${keywordRows.join('\n')}
`

mkdirSync('content/seo', { recursive: true })
writeFileSync('content/seo/phase2-keyword-intent-map.md', keywordMap, 'utf8')

const templateDoc = `# Phase 2 Page Templates

## Tool Template
- What it does: 2-3 sentence utility summary.
- Inputs and outputs definitions: clear table format.
- Formula summary: high-level only, not protocol replacement.
- Example calculation: one end-to-end worked example.
- Common pitfalls and safety checks.
- Last reviewed and source links.
- Related links: pillar + sibling + study CTA + pricing CTA.

## Topic Guide Template (NAVLE)
- Rapid algorithm bullets.
- Diagnostic flow.
- Treatment flow.
- Exam traps (high-yield pitfalls).
- Practice prompts that link to /study/navle/practice/.
- Related content block linking pillar, siblings, tool, and pricing.

## Reference Template
- Table and how to use it.
- Species differences and variability warnings.
- Escalation red flags.
- Sources, limitations, and last-reviewed line.

## Case Template
- Signalment and presenting complaint.
- Problem list.
- Differentials.
- Diagnostics plan.
- Treatment plan.
- Outcome and learning points.
- Links to topic guide and tools.
`

mkdirSync('content/templates', { recursive: true })
writeFileSync('content/templates/phase2-page-templates.md', templateDoc, 'utf8')

console.log('Generated Phase 2 cluster pages, keyword map, and template docs.')
