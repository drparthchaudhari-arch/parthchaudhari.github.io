import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const BASE_URL = 'https://parthchaudhari.com';
const LASTMOD = new Date().toISOString().slice(0, 10);

const CANONICAL_PATHS = [
  '/',
  '/about.html',
  '/contact.html',
  '/editorial-policy/',
  '/terms/',
  '/pricing/',
  '/privacy/',
  '/unsubscribe/',
  '/licenses/',
  '/accessibility-plan/',
  '/study/',
  '/study/navle/',
  '/study/navle/practice/',
  '/study/navle/exam-simulator/',
  '/study/navle/topics/',
  '/study/wordweb/',
  '/study/vetlex/',
  '/today/',
  '/gdv-approach/',
  '/shock-types-veterinary/',
  '/sepsis-sirs-veterinary/',
  '/dka-approach-veterinary/',
  '/heatstroke-veterinary/',
  '/transfusion-basics-veterinary/',
  '/rodenticide-bleeding-veterinary/',
  '/pleural-effusion-differentials-veterinary/',
  '/chf-staging-overview/',
  '/murmur-approach-dog-cat/',
  '/ecg-rhythm-id-af-svt-vt/',
  '/systemic-hypertension-target-organ-damage/',
  '/dcm-basics-dog-cat/',
  '/pleural-effusion-vs-pulmonary-edema/',
  '/pimobendan-diuretics-overview/',
  '/syncope-differentials-dog-cat/',
  '/tools/',
  '/veterinary-calculators/',
  '/veterinary-calculators-guide/',
  '/mgkg-dosing-guide/',
  '/cri-setup-guide/',
  '/fluid-deficit-guide/',
  '/maintenance-fluids-guide/',
  '/anion-gap-interpretation/',
  '/osmolality-basics-veterinary/',
  '/dextrose-correction-guide/',
  '/body-condition-score-guide/',
  '/toxic-dose-calculations-guide/',
  '/lab-interpretation-caveats/',
  '/emergency-triage-algorithms/',
  '/tools/dose-calculator.html',
  '/tools/dose-label-generator.html',
  '/tools/fluid-calculator.html',
  '/tools/unit-converter.html',
  '/tools/emergency-drug-chart.html',
  '/tools/er-algorithms.html',
  '/tools/phone-triage.html',
  '/tools/cri-calculator.html',
  '/tools/acid-base-electrolyte.html',
  '/tools/transfusion-helper.html',
  '/tools/glucose-curve-generator.html',
  '/tools/discharge-generator.html',
  '/tools/parasite-control-reference.html',
  '/tools/insulin-cri-planner.html',
  '/tools/anesthesia-risk-checklist.html',
  '/tools/renal-dose-adjuster.html',
  '/tools/sepsis-bundle-planner.html',
  '/tools/toxin-decontamination-planner.html',
  '/tools/chf-staging-planner.html',
  '/tools/nutrition-rer-mer-calculator.html',
  '/tools/electrolyte-replacement-planner.html',
  '/reference/',
  '/dog-cat-normal-values/',
  '/sources-and-limitations/',
  '/reference/normal-values.html',
  '/reference/toxicities.html',
  '/bridge/',
  '/cardiology-chf-algorithm/',
  '/play/',
  '/play/sudoku/',
  '/play/memory-match/',
  '/play/2048/',
  '/play/tictactoe/',
  '/play/iq-challenge/',
  '/play/vetlex/',
  '/search.html'
];

function loadProgrammaticRoutes() {
  var manifestPath = 'content/programmatic/manifest.phase3.json';
  if (!existsSync(manifestPath)) {
    return [];
  }

  try {
    var manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    if (!manifest || !Array.isArray(manifest.pages)) {
      return [];
    }

    return manifest.pages
      .filter((page) => page && page.indexable === true && typeof page.route === 'string')
      .map((page) => page.route);
  } catch (error) {
    console.error('Could not parse programmatic manifest for sitemap:', error);
    return [];
  }
}

const PROGRAMMATIC_PATHS = loadProgrammaticRoutes();
const ALL_CANONICAL_PATHS = Array.from(new Set(CANONICAL_PATHS.concat(PROGRAMMATIC_PATHS)));

const urlEntries = ALL_CANONICAL_PATHS.map((path) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const loc = `${BASE_URL}${cleanPath}`;
  return [
    '  <url>',
    `    <loc>${loc}</loc>`,
    `    <lastmod>${LASTMOD}</lastmod>`,
    '  </url>'
  ].join('\n');
}).join('\n');

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  urlEntries,
  '</urlset>'
].join('\n');

writeFileSync('sitemap.xml', `${xml}\n`, 'utf8');
console.log(`Generated sitemap.xml with ${ALL_CANONICAL_PATHS.length} canonical URLs.`);
