# Phase 3 Programmatic SEO Rules

## Scope

Programmatic pages are limited to high-utility veterinary reference and tool-explainer topics where a page can deliver practical educational value.

## Page Generation Rules

- Source config: `content/programmatic/phase3-pages.json`
- Generator: `scripts/generate-programmatic-pages.mjs`
- Destination: `/reference/programmatic/<slug>/index.html`
- Required sections per generated page:
  - H1 with query-like phrasing
  - intro (audience + problem solved)
  - reference table
  - how to use section
  - variability warnings
  - escalation red flags
  - worked example
  - pitfalls
  - sources + educational disclaimer
  - related links

## Slug Rules

- Lowercase only
- Replace spaces with `-`
- Remove punctuation except hyphen
- Collapse duplicate hyphens
- Canonical route format: `/reference/programmatic/<slug>/`

## Canonical and Duplication Rules

- Each page includes one canonical URL.
- Generator outputs one route per slug.
- No parameterized routes are included in sitemap.
- Duplicate topics must be merged into one canonical slug before generation.

## Content Thresholds

- Minimum word threshold: 420 words (configurable)
- Unique page-specific data required (table + pitfalls + example + red flags)
- Thin pages are automatically noindexed

## Noindex Kill Switch

- Global kill switch options:
  - env: `PROGRAMMATIC_NOINDEX_ALL=1`
  - config: `killSwitch: true`
- Per-page noindex option:
  - `forceNoindex: true`
- Automatic noindex if below word threshold.

## Manifest and Sitemap Controls

- Manifest output: `content/programmatic/manifest.phase3.json`
- Sitemap script includes only `indexable: true` routes from manifest.
