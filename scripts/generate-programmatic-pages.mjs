import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const BASE_URL = 'https://parthchaudhari.com';
const CONFIG_PATH = 'content/programmatic/phase3-pages.json';
const MANIFEST_PATH = 'content/programmatic/manifest.phase3.json';

function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function stripHtml(text) {
  return String(text || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function wordCount(text) {
  const cleaned = stripHtml(text);
  if (!cleaned) {
    return 0;
  }
  return cleaned.split(/\s+/).filter(Boolean).length;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function listItems(items) {
  return (items || []).map((item) => `                <li>${escapeHtml(item)}</li>`).join('\n');
}

function linkList(items) {
  return (items || [])
    .map((item) => `                <li><a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a></li>`)
    .join('\n');
}

function tableRows(rows) {
  return (rows || [])
    .map((row) => {
      const colA = escapeHtml(row[0] || '');
      const colB = escapeHtml(row[1] || '');
      const colC = escapeHtml(row[2] || '');
      return `                        <tr><td>${colA}</td><td>${colB}</td><td>${colC}</td></tr>`;
    })
    .join('\n');
}

function sourceList(sources) {
  return (sources || [])
    .map((source) => {
      const label = escapeHtml(source.label || '');
      const href = source.href ? escapeHtml(source.href) : '';
      if (!href) {
        return `                <li>${label}</li>`;
      }
      return `                <li><a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a></li>`;
    })
    .join('\n');
}

function renderPage(page, route, noindex) {
  const canonical = `${BASE_URL}${route}`;
  const robots = noindex ? '\n    <meta name="robots" content="noindex,follow">' : '';

  const table = page.table || { columns: ['', '', ''], rows: [] };
  const col1 = escapeHtml((table.columns || [])[0] || 'Parameter');
  const col2 = escapeHtml((table.columns || [])[1] || 'Range');
  const col3 = escapeHtml((table.columns || [])[2] || 'Use note');

  const intro = (page.intro || []).map((line) => `            <p class="pc-fork-copy">${escapeHtml(line)}</p>`).join('\n');
  const howToUse = (page.howToUse || []).map((line) => `            <p class="pc-fork-copy">${escapeHtml(line)}</p>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en" data-mode="pro" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/svg+xml" href="/assets/img/vet-favicon.svg">
    <title>${escapeHtml(page.title)}</title>
    <meta name="description" content="${escapeHtml(page.metaDescription)}">${robots}
    <meta property="og:type" content="website">
    <meta property="og:title" content="${escapeHtml(page.title)}">
    <meta property="og:description" content="${escapeHtml(page.metaDescription)}">
    <meta property="og:url" content="${canonical}">
    <link rel="canonical" href="${canonical}">
    <script type="application/ld+json">
${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: page.h1,
  description: page.metaDescription,
  dateModified: '2026-02-13',
  datePublished: '2026-02-13',
  author: {
    '@type': 'Person',
    name: 'Parth Chaudhari'
  }
}, null, 4)}
    </script>
    <link rel="preload" href="/assets/css/tokens.css" as="style">
    <link rel="preload" href="/assets/css/portal.css" as="style">
    <link rel="stylesheet" href="/assets/css/tokens.css">
    <link rel="stylesheet" href="/assets/css/portal.css">
    <script src="/assets/js/theme-toggle.js" defer></script>
    <script src="/assets/js/nav-status.js" defer></script>
</head>
<body class="pc-page pc-page--study">
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

    <main id="pc-main" class="pc-bridge-shell" role="main">
        <section class="pc-bridge-hero">
            <p class="pc-kicker">Programmatic Reference</p>
            <h1 class="pc-fork-title">${escapeHtml(page.h1)}</h1>
${intro}
            <p class="pc-last-reviewed">Last reviewed: ${escapeHtml(page.lastReviewed || 'February 13, 2026')}</p>
        </section>

        <section class="pc-bridge-section" aria-label="Reference table">
            <h2 class="pc-bridge-title">Reference Table</h2>
            <div class="pc-table-wrap">
                <table class="pc-table">
                    <thead>
                        <tr><th>${col1}</th><th>${col2}</th><th>${col3}</th></tr>
                    </thead>
                    <tbody>
${tableRows(table.rows)}
                    </tbody>
                </table>
            </div>
        </section>

        <section class="pc-bridge-section" aria-label="How to use this page">
            <h2 class="pc-bridge-title">How to Use This Guide</h2>
${howToUse}
        </section>

        <section class="pc-bridge-section" aria-label="Species variability and caveats">
            <h2 class="pc-bridge-title">Variability and Caveats</h2>
            <ul class="pc-link-list">
${listItems(page.variabilityWarnings)}
            </ul>
        </section>

        <section class="pc-bridge-section" aria-label="Escalation red flags">
            <h2 class="pc-bridge-title">When to Escalate Immediately</h2>
            <ul class="pc-link-list">
${listItems(page.escalationRedFlags)}
            </ul>
        </section>

        <section class="pc-bridge-section" aria-label="Worked example">
            <h2 class="pc-bridge-title">${escapeHtml((page.example && page.example.title) || 'Worked Example')}</h2>
            <ol class="pc-link-list">
${listItems((page.example && page.example.steps) || [])}
            </ol>
        </section>

        <section class="pc-bridge-section" aria-label="Common pitfalls">
            <h2 class="pc-bridge-title">Common Pitfalls</h2>
            <ul class="pc-link-list">
${listItems(page.pitfalls)}
            </ul>
        </section>

        <section class="pc-bridge-section" aria-label="Related links">
            <h2 class="pc-bridge-title">Related Links</h2>
            <ul class="pc-link-list">
${linkList(page.relatedLinks)}
            </ul>
        </section>

        <section class="pc-bridge-section" aria-label="Sources and disclaimer">
            <h2 class="pc-bridge-title">Sources and Limitations</h2>
            <ul class="pc-link-list">
${sourceList(page.sources)}
            </ul>
            <div class="pc-note-box">
                <p>Educational only. This page supports study and triage reasoning and does not replace patient-specific diagnosis, direct veterinary supervision, or local protocol judgment.</p>
            </div>
        </section>
    </main>
</body>
</html>
`;
}

function routeToDir(route) {
  return route.replace(/^\//, '').replace(/\/$/, '');
}

const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
const killSwitch = process.env.PROGRAMMATIC_NOINDEX_ALL === '1' || config.killSwitch === true;
const minWordCount = Number(config.minWordCount) || 420;
const pages = Array.isArray(config.pages) ? config.pages : [];

const manifest = [];

for (const page of pages) {
  const slug = slugify(page.slug || page.primaryQuery);
  if (!slug) {
    continue;
  }

  const route = `/reference/programmatic/${slug}/`;
  const candidateHtml = renderPage(page, route, false);
  const words = wordCount(candidateHtml);
  const forceNoindex = page.forceNoindex === true;
  const lowValue = words < minWordCount;
  const noindex = killSwitch || forceNoindex || lowValue;
  const finalHtml = renderPage(page, route, noindex);

  const outDir = routeToDir(route);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(`${outDir}/index.html`, finalHtml, 'utf8');

  manifest.push({
    route,
    slug,
    words,
    noindex,
    indexable: !noindex,
    noindexReason: killSwitch ? 'kill_switch' : forceNoindex ? 'forced' : lowValue ? 'below_min_word_count' : ''
  });
}

mkdirSync('content/programmatic', { recursive: true });
writeFileSync(MANIFEST_PATH, JSON.stringify({ generatedAt: new Date().toISOString(), killSwitch, minWordCount, pages: manifest }, null, 2) + '\n', 'utf8');

console.log(`Generated ${manifest.length} programmatic pages.`);
