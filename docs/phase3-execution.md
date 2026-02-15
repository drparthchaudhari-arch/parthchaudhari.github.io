# Phase 3 Execution Notes

## Top 20 Priority Landing Pages (Business Value)

1. /
2. /pricing/
3. /study/navle/practice/
4. /tools/
5. /veterinary-calculators/
6. /veterinary-calculators-guide/
7. /emergency-triage-algorithms/
8. /cardiology-chf-algorithm/
9. /dog-cat-normal-values/
10. /emergency-triage-algorithms/
11. /bridge/
12. /tools/dose-calculator.html
13. /tools/fluid-calculator.html
14. /tools/cri-calculator.html
15. /tools/acid-base-electrolyte.html
16. /chf-staging-overview/
17. /dka-approach-veterinary/
18. /murmur-approach-dog-cat/
19. /reference/programmatic/chocolate-toxicity-dose-thresholds-dogs/

## Performance and CWV Targets

- LCP <= 2.5s (mobile p75)
- INP < 200ms (mobile p75)
- CLS < 0.1 (mobile p75)

## Template Risk Matrix

### Tools Template

- Risks: large shared nav script on every page, calculator validation alerts causing blocking UX, no guaranteed reserved result area height.
- Implemented fixes:
  - deferred non-critical nav enhancements via idle scheduling in `assets/js/nav-status.js`.
  - tool submit and completion events instrumented without heavy libraries.
  - form accessibility and non-blocking validation messaging in `assets/js/dose-calculator.js` + `tools/dose-calculator.html`.
  - layout stability guardrails via min-height and content-visibility in `assets/css/portal.css`.
- Expected impact: lower INP, reduced blocking interactions, lower CLS on dynamic results.

### Topic Guide Template

- Risks: long pages with many sections render all content at once; heavy nav enhancements run during early interaction.
- Implemented fixes:
  - `content-visibility:auto` on section blocks.
  - route enhancements deferred to idle in `assets/js/nav-status.js`.
  - style preloads added in generated topic pages.
- Expected impact: lower main-thread work and improved LCP on mid-range mobile devices.

### Reference Template

- Risks: table-heavy content and long explanatory sections can shift as scripts inject footer/breadcrumbs.
- Implemented fixes:
  - nav/breadcrumb/footer moved to idle scheduling.
  - section rendering optimization with intrinsic sizing.
  - generated programmatic references include minimum-word quality gate and explicit noindex fallback.
- Expected impact: better INP and CLS consistency.

### Case Template

- Risks: non-critical auth/sync scripts loaded on read-mostly case pages.
- Implemented fixes:
  - removed Supabase/sync payload from active case pages.
  - retained local case interaction behavior.
- Expected impact: smaller JS payload and improved LCP/INP for case landing and detail routes.

### Pricing Template

- Risks: CTA tracking not connected to funnel metrics.
- Implemented fixes:
  - global event instrumentation for pricing/paywall/checkout flows in `assets/js/nav-status.js`.
  - style preload tags added for faster first render.
- Expected impact: cleaner conversion measurement and faster first paint.

## Route-level Code Splitting and Script Deferral

- `study/navle/practice/index.html` now loads auth stack on demand.
- `assets/js/navle-practice-emergency.js` lazy-loads:
  - `@supabase/supabase-js` UMD
  - `/assets/js/supabase-config.js`
  - `/assets/js/sync.js`
    only when auth state requires hydration or when user requests magic link.
- case pages no longer eagerly load Supabase/sync scripts.
- home popup moved from static script include to route-conditional idle loading through `assets/js/nav-status.js`.

## Accessibility Hardening Implemented

- Ensured skip link injection fallback in `assets/js/nav-status.js`.
- Added keyboard submenu support with `aria-expanded`, ArrowDown open, and Escape close in `assets/js/nav-status.js`.
- Modal accessibility for practice page in `assets/js/navle-practice-emergency.js`:
  - focus trap
  - Escape close
  - overlay click close
  - aria-hidden state toggling
- Form accessibility improvements:
  - `aria-describedby`, `role=status`, and inline validation messaging on dose calculator and practice gate email.
  - invalid field styling via `[aria-invalid='true']` in `assets/css/portal.css`.

## Programmatic SEO System

- Config: `content/programmatic/phase3-pages.json`
- Generator: `scripts/generate-programmatic-pages.mjs`
- Output routes:
  - /reference/programmatic/canine-cbc-normal-values/
  - /reference/programmatic/feline-chemistry-normal-values/
  - /reference/programmatic/chocolate-toxicity-dose-thresholds-dogs/
- Quality guardrails:
  - slug normalization (query-like slug)
  - minimum word threshold (default 420)
  - kill switch (`PROGRAMMATIC_NOINDEX_ALL=1` or config `killSwitch:true`)
  - automatic `noindex,follow` on low-value pages
- Manifest for sitemap inclusion:
  - `content/programmatic/manifest.phase3.json`

## Analytics Instrumentation

Implemented in `assets/js/nav-status.js` and `assets/js/navle-practice-emergency.js`.

### Event Coverage

- Acquisition:
  - `landing_page_view`
- Activation:
  - `tool_used`
  - `practice_started`
  - `case_opened`
- Engagement:
  - `calculator_completed`
  - `practice_question_answered`
- Monetization:
  - `paywall_viewed`
  - `pricing_viewed`
  - `checkout_started`
  - `purchase_completed` (query-param based success detection)
- Retention:
  - `returning_user_7d`
  - `returning_user_30d`

## QA Targets

- Run `npm run build`
- Run `npm run programmatic`
- Run `npm run sitemap`
- Validate top 20 pages for:
  - canonical correctness
  - no duplicate indexable routes
  - keyboard-only nav + modal pass
  - event emissions in dataLayer/gtag
