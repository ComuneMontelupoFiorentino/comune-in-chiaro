(function (global) {
  'use strict';

  // registry: nome -> funzione che disegna UNA card
  var renderers = {};

  function Loader(el) {
    this.el = el;
    this.url = el.dataset.url;
    this.count = parseInt(el.dataset.skeletonCount, 10) || 2;
    this.colClass = el.dataset.colClass || 'col-md-6 col-lg-4';
    this.rendererName = el.dataset.renderer || el.dataset.loader;
    this.dataPath = el.dataset.path || null; // es. "data" per { "data": [...] }
    this.delay = parseInt(el.dataset.delay, 10) || 0; // tempo minimo skeleton (ms)
    this.mode = el.dataset.mode || 'list'; // 'list' (default) | 'single'
    this.load();
  }

  Loader.prototype.setState = function (state) {
    this.el.dataset.state = state; // loading | ready | empty | error
  };

  Loader.prototype.target = function () {
    // contenitore dove iniettare card/skeleton (lascia intatti i blocchi di stato)
    return this.el.querySelector('[data-loader-items]') || this.el;
  };

  Loader.prototype.load = function () {
    var self = this;
    var start = Date.now();
    this.setState('loading');
    this.showSkeletons();

    // garantisce che lo skeleton resti visibile almeno self.delay ms
    function after(fn) {
      var elapsed = Date.now() - start;
      var wait = Math.max(0, self.delay - elapsed);
      if (wait) setTimeout(fn, wait);
      else fn();
    }

    // nessun data-url: solo effetto skeleton, poi rivela il contenuto già presente
    if (!this.url) {
      after(function () { self.reveal(); });
      return;
    }

    fetch(this.url, {})
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        var data = self.extract(json);
        after(function () { self.process(data); });
      })
      .catch(function (err) {
        console.error('[Loader]', self.url, err);
        after(function () { self.setState('error'); });
      });
  };

  Loader.prototype.reveal = function () {
    // toglie lo skeleton e mostra il contenuto reale (.loader-ready)
    this.target().innerHTML = '';
    this.setState('ready');
  };

  Loader.prototype.process = function (data) {
    var render = renderers[this.rendererName];

    // nessun renderer registrato: solo skeleton -> reveal del contenuto in pagina
    if (!render) {
      this.reveal();
      return;
    }

    if (this.mode === 'single') {
      // un solo widget: tutto il dato passa al renderer (data, el)
      if (data == null) { this.setState('empty'); return; }
      this.target().innerHTML = ''; // rimuove lo skeleton
      render(data, this.el);
      this.setState('ready');
      return;
    }
    // list (default): array -> una card per elemento
    if (!Array.isArray(data) || data.length === 0) {
      this.setState('empty');
      return;
    }
    this.renderItems(data);
    this.setState('ready');
  };

  Loader.prototype.extract = function (json) {
    if (!this.dataPath) return json;
    return this.dataPath.split('.').reduce(function (acc, k) {
      return acc == null ? acc : acc[k];
    }, json);
  };

  Loader.prototype.showSkeletons = function () {
    var tpl = this.el.querySelector('template[data-skeleton]');
    var target = this.target();
    target.innerHTML = '';
    if (!tpl) return;
    if (this.mode === 'single') {
      target.insertAdjacentHTML('beforeend', tpl.innerHTML); // niente colonna
      return;
    }
    for (var i = 0; i < this.count; i++) {
      target.insertAdjacentHTML('beforeend', this.col(tpl.innerHTML));
    }
  };

  Loader.prototype.renderItems = function (items) {
    var render = renderers[this.rendererName];
    var target = this.target();
    var frag = document.createDocumentFragment();
    var self = this;
    target.innerHTML = '';
    items.forEach(function (data) {
      var wrap = document.createElement('div');
      wrap.className = self.colClass;
      var node = render ? render(data) : '';
      if (typeof node === 'string') wrap.innerHTML = node;
      else if (node) wrap.appendChild(node);
      frag.appendChild(wrap);
    });
    target.appendChild(frag);
  };

  Loader.prototype.col = function (inner) {
    return '<div class="' + this.colClass + '">' + inner + '</div>';
  };

  // --- API pubblica ---

  // registra come disegnare una card per un dato tipo di pagina
  Loader.register = function (name, fn) {
    renderers[name] = fn;
  };

  Loader.escapeHtml = function (s) {
    var d = document.createElement('div');
    d.textContent = s == null ? '' : s;
    return d.innerHTML;
  };

  // inizializza tutti i contenitori [data-loader] presenti nella pagina
  Loader.initAll = function (root) {
    (root || document).querySelectorAll('[data-loader]').forEach(function (el) {
      if (!el.__loaderInit) {
        el.__loaderInit = true;
        new Loader(el);
      }
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    Loader.initAll();
  });

  global.Loader = Loader;
})(window);