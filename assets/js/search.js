(function () {
    var SEARCH_INDEX_URL = '/assets/search/index.json';
    var FILTER_ORDER = ['all', 'case', 'game', 'resource', 'profile'];
    var GROUP_ORDER = ['case', 'game', 'resource', 'profile'];
    var GROUP_LABELS = {
        case: 'Cases',
        game: 'Games',
        resource: 'Resources',
        profile: 'Profile'
    };

    var POPULAR_LINKS = [
        { label: 'WordVet', url: '/play/wordvet/' },
        { label: 'CHF Case', url: '/bridge/case-studies/chf-dog.html' },
        { label: 'Study Plan', url: '/study/' }
    ];

    var state = {
        index: [],
        activeFilter: 'all',
        activeResultIndex: -1,
        resultLinks: [],
        debounceTimer: null,
        initialized: false
    };

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function normalizeType(type) {
        var safeType = String(type || '').toLowerCase().trim();
        if (GROUP_LABELS[safeType]) {
            return safeType;
        }
        return 'resource';
    }

    function normalizeTags(rawTags, rawKeywords) {
        var tags = [];

        if (Object.prototype.toString.call(rawTags) === '[object Array]') {
            for (var i = 0; i < rawTags.length; i += 1) {
                if (rawTags[i]) {
                    tags.push(String(rawTags[i]).toLowerCase());
                }
            }
        }

        if (!tags.length && rawKeywords) {
            var parts = String(rawKeywords).split(/\s+/);
            for (var j = 0; j < parts.length; j += 1) {
                if (parts[j]) {
                    tags.push(parts[j].toLowerCase());
                }
            }
        }

        return tags;
    }

    function normalizeEntry(entry) {
        if (!entry || typeof entry !== 'object') {
            return null;
        }

        var title = String(entry.title || '').trim();
        var url = String(entry.url || '').trim();

        if (!title || !url) {
            return null;
        }

        return {
            title: title,
            url: url,
            type: normalizeType(entry.type),
            tags: normalizeTags(entry.tags, entry.keywords),
            date: String(entry.date || '')
        };
    }

    function normalizeIndex(rawIndex) {
        var normalized = [];
        if (Object.prototype.toString.call(rawIndex) !== '[object Array]') {
            return normalized;
        }

        for (var i = 0; i < rawIndex.length; i += 1) {
            var item = normalizeEntry(rawIndex[i]);
            if (item) {
                normalized.push(item);
            }
        }

        return normalized;
    }

    function getLegacyIndex() {
        if (typeof searchIndex === 'undefined') {
            return [];
        }
        return normalizeIndex(searchIndex);
    }

    function getElements() {
        return {
            input: document.getElementById('search-input'),
            results: document.getElementById('search-results'),
            summary: document.getElementById('pc-search-summary'),
            chips: document.querySelectorAll('[data-pc-filter]')
        };
    }

    function setSummary(text) {
        var elements = getElements();
        if (elements.summary) {
            elements.summary.textContent = text;
        }
    }

    function createHighlight(title, terms) {
        var output = escapeHtml(title);

        for (var i = 0; i < terms.length; i += 1) {
            var term = terms[i];
            if (!term) {
                continue;
            }
            var safeTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            var matcher = new RegExp('(' + safeTerm + ')', 'gi');
            output = output.replace(matcher, '<mark class="pc-search-hit">$1</mark>');
        }

        return output;
    }

    function tokenize(query) {
        return String(query || '')
            .toLowerCase()
            .trim()
            .split(/\s+/)
            .filter(function (term) {
                return term.length > 0;
            });
    }

    function scoreEntry(entry, terms) {
        var title = entry.title.toLowerCase();
        var tagsText = entry.tags.join(' ');
        var typeText = entry.type;
        var score = 0;
        var matched = false;

        for (var i = 0; i < terms.length; i += 1) {
            var term = terms[i];
            var termMatched = false;

            if (title.indexOf(term) !== -1) {
                score += 4;
                termMatched = true;
            }

            if (tagsText.indexOf(term) !== -1) {
                score += 3;
                termMatched = true;
            }

            if (typeText.indexOf(term) !== -1) {
                score += 1;
                termMatched = true;
            }

            if (!termMatched) {
                return 0;
            }

            matched = true;
        }

        if (!matched) {
            return 0;
        }

        if (entry.date) {
            score += 0.01;
        }

        return score;
    }

    function sortResults(left, right) {
        if (right.score !== left.score) {
            return right.score - left.score;
        }

        if (left.entry.date && right.entry.date && left.entry.date !== right.entry.date) {
            return right.entry.date.localeCompare(left.entry.date);
        }

        return left.entry.title.localeCompare(right.entry.title);
    }

    function findMatches(query) {
        var terms = tokenize(query);
        var matches = [];

        if (!terms.length) {
            return {
                matches: matches,
                terms: terms
            };
        }

        for (var i = 0; i < state.index.length; i += 1) {
            var entry = state.index[i];

            if (state.activeFilter !== 'all' && entry.type !== state.activeFilter) {
                continue;
            }

            var score = scoreEntry(entry, terms);
            if (!score) {
                continue;
            }

            matches.push({
                entry: entry,
                score: score
            });
        }

        matches.sort(sortResults);

        return {
            matches: matches,
            terms: terms
        };
    }

    function renderEmptyState() {
        var elements = getElements();
        if (!elements.results) {
            return;
        }

        var links = '';
        for (var i = 0; i < POPULAR_LINKS.length; i += 1) {
            links += '<a class="pc-link-chip" href="' + POPULAR_LINKS[i].url + '">' + escapeHtml(POPULAR_LINKS[i].label) + '</a>';
        }

        elements.results.innerHTML =
            '<section class="pc-search-empty">' +
                '<h3>Popular</h3>' +
                '<p>Quick starts while you decide what to study.</p>' +
                '<div class="pc-search-popular-links">' + links + '</div>' +
            '</section>';

        state.resultLinks = [];
        state.activeResultIndex = -1;
        setSummary('Type to search cases, games, resources, and profile content.');
    }

    function renderNoResults(query) {
        var elements = getElements();
        if (!elements.results) {
            return;
        }

        elements.results.innerHTML =
            '<section class="pc-search-empty">' +
                '<h3>No results</h3>' +
                '<p>No matches for <strong>' + escapeHtml(query) + '</strong>. Try broader terms like cardio, endocrine, or wordvet.</p>' +
            '</section>';

        state.resultLinks = [];
        state.activeResultIndex = -1;
        setSummary('No results found.');
    }

    function buildGroup(matches, type, terms, linkOffset) {
        var items = [];
        for (var i = 0; i < matches.length; i += 1) {
            if (matches[i].entry.type === type) {
                items.push(matches[i].entry);
            }
        }

        if (!items.length) {
            return {
                html: '',
                count: 0
            };
        }

        var html = '<section class="pc-search-group">';
        html += '<h3>' + GROUP_LABELS[type] + '</h3>';

        for (var j = 0; j < items.length; j += 1) {
            var item = items[j];
            var resultIndex = linkOffset + j;
            var tagsText = item.tags.length ? item.tags.join(', ') : 'General';

            html += '<article class="pc-result-item">';
            html += '<a href="' + item.url + '" data-pc-result-link data-result-index="' + resultIndex + '" tabindex="-1">' + createHighlight(item.title, terms) + '</a>';
            html += '<p class="pc-result-keywords">' + escapeHtml(tagsText) + '</p>';
            html += '</article>';
        }

        html += '</section>';

        return {
            html: html,
            count: items.length
        };
    }

    function renderResults(query) {
        var elements = getElements();
        if (!elements.results) {
            return;
        }

        var resultSet = findMatches(query);
        var matches = resultSet.matches;
        var terms = resultSet.terms;

        if (!terms.length) {
            renderEmptyState();
            return;
        }

        if (!matches.length) {
            renderNoResults(query);
            return;
        }

        var html = '';
        var linkOffset = 0;

        for (var i = 0; i < GROUP_ORDER.length; i += 1) {
            var group = buildGroup(matches, GROUP_ORDER[i], terms, linkOffset);
            html += group.html;
            linkOffset += group.count;
        }

        elements.results.innerHTML = html;
        state.resultLinks = elements.results.querySelectorAll('[data-pc-result-link]');
        state.activeResultIndex = -1;

        setSummary(matches.length + ' result' + (matches.length === 1 ? '' : 's') + ' found.');
    }

    function setActiveResult(nextIndex) {
        if (!state.resultLinks.length) {
            state.activeResultIndex = -1;
            return;
        }

        if (nextIndex < 0) {
            nextIndex = 0;
        }

        if (nextIndex >= state.resultLinks.length) {
            nextIndex = state.resultLinks.length - 1;
        }

        for (var i = 0; i < state.resultLinks.length; i += 1) {
            var link = state.resultLinks[i];
            var parent = link.closest('.pc-result-item');
            var isActive = i === nextIndex;

            if (parent) {
                parent.classList.toggle('pc-result-item--active', isActive);
            }

            link.setAttribute('aria-selected', String(isActive));
        }

        state.activeResultIndex = nextIndex;
        state.resultLinks[nextIndex].focus();
    }

    function handleInputKeydown(event) {
        if (!state.resultLinks.length) {
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveResult(state.activeResultIndex + 1);
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveResult(state.activeResultIndex <= 0 ? 0 : state.activeResultIndex - 1);
            return;
        }

        if (event.key === 'Enter' && state.activeResultIndex >= 0) {
            event.preventDefault();
            var selected = state.resultLinks[state.activeResultIndex];
            if (selected && selected.getAttribute('href')) {
                window.location.href = selected.getAttribute('href');
            }
        }
    }

    function activateFilter(nextFilter) {
        var filter = FILTER_ORDER.indexOf(nextFilter) !== -1 ? nextFilter : 'all';
        state.activeFilter = filter;

        var elements = getElements();
        for (var i = 0; i < elements.chips.length; i += 1) {
            var chip = elements.chips[i];
            var isActive = chip.getAttribute('data-pc-filter') === filter;
            chip.classList.toggle('pc-is-active', isActive);
            chip.setAttribute('aria-pressed', String(isActive));
        }

        if (elements.input) {
            renderResults(elements.input.value);
        }
    }

    function debounceSearch(inputValue) {
        clearTimeout(state.debounceTimer);
        state.debounceTimer = setTimeout(function () {
            renderResults(inputValue);
        }, 300);
    }

    function bindSearchUi() {
        var elements = getElements();
        if (!elements.input || !elements.results) {
            return;
        }

        elements.input.addEventListener('input', function () {
            debounceSearch(elements.input.value);
        });

        elements.input.addEventListener('keydown', handleInputKeydown);

        for (var i = 0; i < elements.chips.length; i += 1) {
            elements.chips[i].addEventListener('click', function (event) {
                var filter = event.currentTarget.getAttribute('data-pc-filter') || 'all';
                activateFilter(filter);
            });
        }

        renderEmptyState();
    }

    function loadIndex() {
        return fetch(SEARCH_INDEX_URL, { cache: 'no-store' })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('Search index request failed');
                }
                return response.json();
            })
            .then(function (json) {
                var normalized = normalizeIndex(json);
                if (!normalized.length) {
                    throw new Error('Empty search index');
                }
                return normalized;
            })
            .catch(function () {
                return getLegacyIndex();
            });
    }

    function init() {
        if (state.initialized) {
            return;
        }

        var elements = getElements();
        if (!elements.input || !elements.results) {
            return;
        }

        state.initialized = true;

        bindSearchUi();

        loadIndex().then(function (entries) {
            state.index = entries;
            if (!state.index.length) {
                setSummary('Search index unavailable right now.');
            }
            renderResults(elements.input.value);
        });
    }

    window.pcSearch = {
        init: init
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
