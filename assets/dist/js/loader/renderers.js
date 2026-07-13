(function () {
  // ================== CONFIG ==================
  var CONTAINER_SELECTOR = '[data-loader-items]'; // dove vengono iniettate le card
  var MIN_LEN = 2;                                // lunghezza minima dei termini
  var DEBUG = false;                               // metti false per spegnere i log
  // ============================================

  var _cache = null;

  function log() {
    if (!DEBUG) return;
    console.log.apply(console, ['[ricerca]'].concat([].slice.call(arguments)));
  }

  var esc = Loader.escapeHtml;

  function attrEncode(html) {
    return String(html)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // --- URL del JSON letto da data-url ([data-loader] è la config) ---
  function getJsonUrl() {
    var cfg = document.querySelector('[data-loader][data-url]') || document.querySelector('[data-url]');
    return cfg ? cfg.getAttribute('data-url') : null;
  }

  function getData() { return _cache || []; }

  function loadData() {
    if (_cache) return Promise.resolve(_cache);
    var url = getJsonUrl();
    log('JSON URL letto da data-url:', url);
    if (!url) { log('ERRORE: nessun data-url trovato'); return Promise.resolve([]); }
    return fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        _cache = Array.isArray(d) ? d : (d.items || d.servizi || []);
        log('JSON caricato:', _cache.length, _cache);
        return _cache;
      })
      .catch(function (e) { log('ERRORE fetch JSON:', e); return []; });
  }

  // --- normalizzazione: minuscolo + accenti, MANTENENDO la lunghezza ---
  var FOLD = {'à':'a','á':'a','â':'a','ä':'a','ã':'a','å':'a','è':'e','é':'e','ê':'e','ë':'e',
              'ì':'i','í':'i','î':'i','ï':'i','ò':'o','ó':'o','ô':'o','ö':'o','õ':'o',
              'ù':'u','ú':'u','û':'u','ü':'u','ç':'c','ñ':'n'};
  function fold(str) {
    str = String(str == null ? '' : str).toLowerCase();
    var out = '';
    for (var i = 0; i < str.length; i++) { var c = str[i]; out += (FOLD[c] || c); }
    return out;
  }

  // --- distanza di Levenshtein (match "simili") ---
  function lev(a, b) {
    var m = a.length, n = b.length; if (!m) return n; if (!n) return m;
    var prev = [], cur = [], i, j;
    for (j = 0; j <= n; j++) prev[j] = j;
    for (i = 1; i <= m; i++) {
      cur[0] = i;
      for (j = 1; j <= n; j++) {
        var cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      }
      var t = prev; prev = cur; cur = t;
    }
    return prev[n];
  }

  // --- evidenziazione: escape + <mark> sui match esatti (apici singoli, sicuri nei popover) ---
  function highlight(text, query) {
    text = String(text == null ? '' : text);
    if (!query) return esc(text);
    var foldedText = fold(text);
    var terms = fold(query).split(/\s+/).filter(function (t) { return t.length >= MIN_LEN; });
    if (!terms.length) return esc(text);

    var ranges = [];
    terms.forEach(function (term) {
      var from = 0, idx;
      while ((idx = foldedText.indexOf(term, from)) !== -1) {
        ranges.push([idx, idx + term.length]);
        from = idx + term.length;
      }
    });
    if (!ranges.length) return esc(text);

    ranges.sort(function (a, b) { return a[0] - b[0]; });
    var merged = [ranges[0]];
    for (var i = 1; i < ranges.length; i++) {
      var last = merged[merged.length - 1];
      if (ranges[i][0] <= last[1]) last[1] = Math.max(last[1], ranges[i][1]);
      else merged.push(ranges[i]);
    }

    var out = '', pos = 0;
    merged.forEach(function (r) {
      out += esc(text.slice(pos, r[0]));
      out += "<mark class='search-hl'>" + esc(text.slice(r[0], r[1])) + "</mark>";
      pos = r[1];
    });
    out += esc(text.slice(pos));
    return out;
  }

  // --- un termine corrisponde a uno dei campi (substring o "simile") ---
  function termMatches(term, fields) {
    for (var i = 0; i < fields.length; i++) if (fields[i].indexOf(term) !== -1) return true;
    var maxDist = term.length <= 4 ? 1 : 2;
    for (var j = 0; j < fields.length; j++) {
      var words = fields[j].split(/[^a-z0-9]+/);
      for (var k = 0; k < words.length; k++) {
        var w = words[k];
        if (w && Math.abs(w.length - term.length) <= maxDist && lev(w, term) <= maxDist) return true;
      }
    }
    return false;
  }

  // --- un servizio corrisponde se TUTTI i termini sono in titolo/desc/tag ---
  function matchService(s, query) {
    var terms = fold(query).split(/\s+/).filter(function (t) { return t.length >= MIN_LEN; });
    if (!terms.length) return true;
    var fields = [fold(s.title || ''), fold(s.desc || ''), fold((s.tags || []).join(' ')), fold(s.new || false)];
    return terms.every(function (t) { return termMatches(t, fields); });
  }

  // ========================= TEMPLATE (con highlight) =========================
  function tpl(s, q) {
    var SPRITES = BASE_URL + 'assets/dist/svg/sprites.svg';
    var tagsHtml = '';

    if (Array.isArray(s.tags) && s.tags.length) {
      var visibleTags = s.tags.slice(0, 2);
      var tagsListHtml = visibleTags.map(function (t) {
        return '<span class="badge-tag"> #' + highlight(String(t), q) + '</span>';
      }).join('');

      if (s.tags.length > 2) {
        var remainingTags = s.tags.slice(2);
        var popoverContent = remainingTags.map(function (t) {
          return "<span class='badge-tag popover-badge'>#" + highlight(String(t), q) + "</span>";
        }).join(' ');
        var overflowCount = s.tags.length - 2;
        tagsListHtml += '<button type="button" role="button" tabindex="0" class="btn badge-tag badge-more" '
          + 'data-bs-toggle="popover" data-bs-trigger="focus" data-bs-placement="top" '
          + 'data-bs-html="true" title="" '
          + 'data-popover-html="' + attrEncode(popoverContent) + '"> +' + overflowCount + '</button>';
      }
      tagsHtml = '<div class="card-tags text-muted tags-costum">' + tagsListHtml + '</div>';
    }

    return ''
      + '<div class="card-wrapper"><div class="card card-costum"><div class="card-body">'
      + '  <div class="categoryicon-top">'
      + '    <h3 style="text-transform: uppercase;font-size: 1.5rem;">' + highlight(s.title, q) + '</h3>'
      + '    <span class="badge bg-secondary"' + (s.new ? '' : ' style="display: none;"') + '>New</span>'
      + '  </div>'
      + '  <p class="card-tags text-muted text-muted-costum">' + highlight(s.desc, q) + '</p>'
      + '  <a' + (s.id ? ' id="' + esc(s.id) + '"' : '') + ' class="read-more-costum" href="' + (s.link || '#') + '">'
      + '    <span class="text">ACCEDI AL SERVIZIO</span>'
      + '    <svg class="icon"><use href="' + SPRITES + '#it-arrow-right"></use></svg>'
      + '  </a>'
      + tagsHtml
      + '</div></div></div>';
  }
  Loader.register('servizi', tpl); // sostituisce il register precedente

  // ========================= RENDER + RICERCA =========================
  function initPopovers(scope) {
    if (!(window.bootstrap && bootstrap.Popover)) return;

    // Estende la allowList di default permettendo <mark> con l'attributo class
    var allowList = Object.assign({}, bootstrap.Tooltip.Default.allowList);
    allowList.mark = ['class'];

    (scope || document).querySelectorAll('[data-bs-toggle="popover"]').forEach(function (el) {
      var inst = bootstrap.Popover.getInstance(el);
      if (inst) inst.dispose();

      var raw = el.getAttribute('data-popover-html');
      var html = raw ? decodeEntities(raw) : '';

      new bootstrap.Popover(el, {
        html: true,
        content: html,
        trigger: 'focus',
        placement: 'top',
        allowList: allowList,   // <-- permette <mark class="...">
        sanitize: true          // resta attiva la sanitizzazione, ma ora include mark
      });
    });
  }

  // decodifica le entità (&lt; &gt; &amp; &quot;) verso HTML reale
  function decodeEntities(str) {
    var ta = document.createElement('textarea');
    ta.innerHTML = str;
    return ta.value;
  }

  function render(list, query) {
    var container = document.querySelector(CONTAINER_SELECTOR);
    log('render() -> container:', container, '| risultati:', list.length);
    if (!container) { log('STOP: container non trovato'); return; }

    if (!list.length) {
      container.innerHTML = '<div class="col-12"><p class="text-muted text-center my-4">'
        + 'Nessun servizio trovato per &ldquo;' + esc(query) + '&rdquo;.</p></div>';
      return;
    }

    // Avvolge ogni card nella stessa colonna del Loader, per non rompere la griglia
    container.innerHTML = list.map(function (s) {
      return '<div class="col-md-6 col-lg-4">' + tpl(s, query) + '</div>';
    }).join('');

    initPopovers(container);
  }

  function ready() {
    var input = document.getElementById('searchService');
    var modalEl = document.getElementById('search-modal');
    var btn = modalEl ? modalEl.querySelector('.modal-footer .btn-primary') : null;
    var resultsEl   = document.getElementById('resuls');        // <p id="resuls">
    var countEl     = document.getElementById('countResults');  // <span id="countResults">
    var bcInner     = document.querySelector('.cmp-breadcrumbs');
    var breadcrumbEl = bcInner ? bcInner.closest('.col-12') : null; // il wrapper con display:none
    var container = document.querySelector(CONTAINER_SELECTOR);
    if (container) {
      var mo = new MutationObserver(function () {
        if (container.querySelector('[data-bs-toggle="popover"]')) {
          initPopovers(container);
        }
      });
      mo.observe(container, { childList: true, subtree: true });
    }

    function setSearchChrome(visible, count) {
      if (breadcrumbEl) breadcrumbEl.style.display = visible ? '' : 'none';
      if (resultsEl)    resultsEl.style.display    = visible ? '' : 'none';
      if (countEl && typeof count === 'number') countEl.textContent = count;
    }

    log('ready() -> input:', !!input, '| modal:', !!modalEl, '| btn:', !!btn);

    loadData(); // precarica il JSON così la prima ricerca è istantanea

    function run() {
      var q = (input && input.value || '').trim();
      loadData().then(function (data) {
        log('run() -> query:', JSON.stringify(q), '| dati:', data.length);

        if (!q) {
          // input vuoto: torna alla vista normale, niente conteggio/breadcrumb
          setSearchChrome(false);
          render(data, '');
          return;
        }

        var filtered = data.filter(function (s) { return matchService(s, q); });
        log('run() -> filtrati:', filtered.length);
        setSearchChrome(true, filtered.length); // mostra breadcrumb + "Trovati N risultati"
        render(filtered, q);
      });
    }

    function submit() {
      log('submit() chiamato');
      run();
      if (modalEl && window.bootstrap) {
        var m = bootstrap.Modal.getInstance(modalEl);
        if (m) m.hide();
      }
      var c = document.querySelector(CONTAINER_SELECTOR);
      if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (input) {
      input.addEventListener('input', run); // filtro live mentre digiti
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); submit(); }
      });
    }
    if (btn) btn.addEventListener('click', submit);
    else log('ATTENZIONE: bottone Cerca non trovato');
  }

  if (document.readyState !== 'loading') ready();
  else document.addEventListener('DOMContentLoaded', ready);
})();