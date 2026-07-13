/**
 * =============================================================================
 * service-head.js
 * =============================================================================
 *
 * STATO: ITERAZIONE 4 / 8 (+ Normalizer completato in anticipo, richiesto dai test)
 *   [x] 1. Refactoring completo di OpenData (architettura a moduli)
 *   [x] 2. Loader, Registry e Cache
 *   [x] 3. Normalizer e gestione GeoJSON + strutture raggruppate dichiarative
 *   [x] 4. Filter Engine                       (operatori completi + query string)
 *   [ ] 5. Sort Engine e Limit Engine          (presente come stub passthrough)
 *   [ ] 6. Statistics                          (versione base gi� funzionante)
 *   [ ] 7. Integrazione finale con ServiceHead (compatibilit� gi� garantita)
 *   [ ] 8. Pulizia finale, ottimizzazione e documentazione
 *
 * Le sezioni non ancora completate sono chiaramente marcate con
 * "// TODO (iterazione N)" cosi da poter proseguire in modo incrementale
 * senza rompere nulla di gia funzionante.
 *
 * -----------------------------------------------------------------------------
 * COSA E' CAMBIATO RISPETTO ALLA VERSIONE PRECEDENTE
 * -----------------------------------------------------------------------------
 * - ARCHITETTURA IBRIDA (diretto quando possibile, relay solo come fallback).
 *   L'obiettivo originale era eliminare ogni dipendenza server: nella pratica
 *   alcuni dataset di dati.toscana.it sono file grezzi nel FileStore di CKAN
 *   che NON restituiscono l'header Access-Control-Allow-Origin, quindi il
 *   browser non puo' leggerne la risposta per Same-Origin Policy (CORS) 
 *   un vincolo del server remoto, non risolvibile lato client in alcun modo.
 *
 *   OpenData resta comunque "browser-first": ogni dataset in services.json
 *   dichiara nel campo "fetch" un array di endpoint, provati in ordine:
 *
 *       "fetch": [
 *         "https://dati.toscana.it/dataset/.../download/file.json",   // diretto
 *         "assets/api/opendata_relay.php?u=https%3A%2F%2Fdati.toscana.it%2F..." // fallback
 *       ]
 *
 *   Il Loader prova prima il diretto; se CKAN abilitera' CORS in futuro,
 *   funzionera' subito senza toccare una riga di codice. Se fallisce (CORS/CSP,
 *   riconosciuto ed escluso dai retry per non perdere tempo), passa in automatico
 *   al relay locale, che e' same-origin e quindi non soggetto a CORS.
 *   Il codice di OpenData e ServiceHead NON sa (ne' deve sapere) quale dei due
 *   sia stato usato: la scelta vive interamente nel dato (services.json).
 *
 * - OpenData e' stato riorganizzato in moduli logici interni (namespace privati
 *   dentro la stessa IIFE, NESSUN file separato):
 *       Config          -> gestione impostazioni globali
 *       Registry        -> anagrafica dataset (alias -> definizione)
 *       Loader          -> fetch con timeout / retry / backoff
 *       Cache           -> cache in memoria per alias, invalidabile
 *       Normalizer      -> conversione Array/GeoJSON <-> array di lavoro interno
 *       FilterEngine    -> applicazione filtri dichiarativi da JSON
 *       SortEngine      -> ordinamento dichiarativo da JSON
 *       LimitEngine     -> troncamento risultati
 *       Statistics      -> tempo di risposta, n. record, cache/rete, timestamp
 *
 * - L'API pubblica di OpenData e' invariata nella forma richiesta dal cliente:
 *
 *       await OpenData.loadService('cerca-manutenzioni');
 *       const plan = await OpenData.getData('plan');
 *       await OpenData.refresh('plan');
 *       const info = OpenData.getInfo('plan');
 *
 * - ServiceHead NON e' stato toccato nel comportamento: legge sempre
 *   services.json tramite OpenData.loadService() e renderizza testata,
 *   alert e lista dataset esattamente come prima.
 * =============================================================================
 */
(function () {
  'use strict';

  /* ===========================================================================
   * SEZIONE: HELPERS
   * ===========================================================================
   * Funzioni di utilita' generiche, senza stato, usate da tutto il file.
   */

  function $(id) { return document.getElementById(id); }

  // escape HTML di base per evitare injection quando inseriamo testo nel DOM
  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s == null ? '' : s;
    return d.innerHTML;
  }

  function sprite(id) { return BASE_URL + 'assets/dist/svg/sprites.svg#' + id; }

  // Promise-based sleep, usato dal Loader per il backoff tra i tentativi
  function delay(ms) { return new Promise(function (res) { setTimeout(res, ms); }); }

  // shallow-merge di piu' oggetti in "target" (come Object.assign, compatibile ES6 puro)
  function assign(target) {
    for (var i = 1; i < arguments.length; i++) {
      var src = arguments[i];
      if (!src) continue;
      for (var k in src) {
        if (Object.prototype.hasOwnProperty.call(src, k)) target[k] = src[k];
      }
    }
    return target;
  }

  // timestamp ad alta risoluzione se disponibile, altrimenti fallback su Date.now
  function now() {
    return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  }

  function icon(id, cls) {
    return '<svg style="fill: black;" class="icon' + (cls ? ' ' + cls : '') + '"><use href="' + sprite(id) + '"></use></svg>';
  }

  /* ===========================================================================
   * SEZIONE: ALERT
   * ===========================================================================
   * Gestione del box di alert generico del servizio (#alertMessageService).
   * Usato sia da OpenData (per segnalare errori di rete) sia da ServiceHead
   * (per mostrare l'alert editoriale definito in services.json).
   */

  var ALERT_BOX_ID = 'alertMessageService';

  function showServiceAlert(type, text) {
    var box = $(ALERT_BOX_ID);
    if (!box) return;

    box.className = 'alert alert-' + (type || 'info');
    box.innerHTML =
      '<div>' + esc(text || '') + '</div>' +
      '<div id="elementInnerAlert"></div>';

    box.style.display = '';
  }

  function hideServiceAlert() {
    var box = $(ALERT_BOX_ID);
    if (!box) return;

    box.style.display = 'none';
    box.className = 'alert';
    box.innerHTML = '';
  }

  /* ===========================================================================
   * SEZIONE: PAGE LOADER (spinner globale di caricamento pagina)
   * ===========================================================================
   * Spinner inserito dentro il contenitore gia' presente in HTML
   * <div id="spinnerLoadService" class="col-6 col-lg-3">, mostrato non appena
   * questo script viene eseguito (prima ancora di DOMContentLoaded) e rimosso
   * quando i controlli sul servizio opendata sono terminati: fetch di
   * services.json + probe di raggiungibilita' CKAN sul primo dataset. Se la
   * pagina non e' una pagina servizio (nessun #service-head), non c'e' nulla
   * da attendere e lo spinner viene rimosso subito al DOMContentLoaded.
   */
  var PAGE_LOADER_CONTAINER_ID = 'spinnerLoadService';

  var PAGE_LOADER_HTML =
      '<div class="progress-spinner progress-spinner-active">'
    + '  <span class="visually-hidden">Caricamento in corso...</span>'
    + '</div>';

  function showPageLoader() {
    var container = $(PAGE_LOADER_CONTAINER_ID);
    if (container) {
      container.innerHTML = PAGE_LOADER_HTML;
      return;
    }
    // il contenitore non esiste ancora nel DOM (script eseguito prima che
    // <body> sia stato parsato): riprovo al DOMContentLoaded.
    document.addEventListener('DOMContentLoaded', function () {
      var c = $(PAGE_LOADER_CONTAINER_ID);
      if (c) c.innerHTML = PAGE_LOADER_HTML;
    }, { once: true });
  }

  function hidePageLoader() {
    var container = $(PAGE_LOADER_CONTAINER_ID);
    if (container) container.innerHTML = '';
  }

  showPageLoader(); // mostrato subito, al parsing dello script

  /* ===========================================================================
   * SEZIONE: OPENDATA
   * ===========================================================================
   * Framework riutilizzabile per il consumo di dataset CKAN (JSON/GeoJSON)
   * direttamente dal browser, senza alcuna dipendenza da un proxy server.
   *
   * Organizzato in moduli logici interni. Ogni modulo e' una funzione factory
   * che riceve le dipendenze di cui ha bisogno (config condivisa, ecc.) e
   * restituisce un piccolo oggetto con le proprie funzioni pubbliche.
   * Questo NON crea file separati: e' solo organizzazione del codice.
   */

  var OpenData = (function () {

    /* --------------------------------------------------------------------- *
     * MODULO: Config
     * ---------------------------------------------------------------------
     * Unico punto di verita' per le impostazioni di OpenData. Ogni altro
     * modulo legge la configurazione tramite Config.get(), mai variabili
     * globali sparse.
     * --------------------------------------------------------------------- */
    var Config = (function () {

      var DEFAULTS = {
        // URL di services.json. Se null viene calcolato al primo utilizzo
        // a partire da BASE_URL (vedi defaultServicesUrl piu' sotto).
        servicesUrl: null,

        // --- parametri di rete (usati dal modulo Loader) ---
        retries: 3,          // tentativi per OGNI endpoint
        retryDelay: 700,     // ms, ritardo base tra i tentativi
        backoff: 2,          // fattore di crescita esponenziale del ritardo
        timeout: 12000,      // ms, timeout per singolo tentativo

        // --- cache (usati dal modulo Cache) ---
        // true/false = default globale se il dataset non specifica "cache"
        // nel proprio services.json
        cache: true,

        // messaggio mostrato all'utente in caso di errore di rete
        errorText: 'Servizio opendata non disponibile al momento. Riprova piu tardi.'

        // NOTA: il proxy PHP e la funzione rewriteUrl() sono stati rimossi.
        // Tutte le richieste vengono ora effettuate direttamente verso
        // l'URL indicato nel campo "fetch" del dataset.
      };

      var current = assign({}, DEFAULTS);

      function defaultServicesUrl() {
        console.warn('[OpenData] data-url non fornito sul div #service-head (o servicesUrl non configurato)  uso fallback: assets/data/services.json?v=9');
        return BASE_URL + 'assets/data/services.json?v=9';
      }

      function configure(opts) {
        current = assign({}, current, opts || {});
        return current;
      }

      function get() { return current; }

      // scorciatoia molto usata: url effettivo di services.json
      function servicesUrl(explicitUrl) {
        return explicitUrl || current.servicesUrl || defaultServicesUrl();
      }

      return {
        configure: configure,
        get: get,
        servicesUrl: servicesUrl
      };
    })();

    /* --------------------------------------------------------------------- *
     * MODULO: Registry
     * ---------------------------------------------------------------------
     * Anagrafica dei dataset conosciuti da OpenData. Chiave = alias, come
     * dichiarato nel campo "alias" di ogni dataset in services.json.
     *
     * Il Registry non fa mai fetch: si limita a memorizzare le definizioni
     * (url, opzioni di cache, filtri/sort/limit dichiarati, ecc.) cosi che
     * il resto dell'applicazione possa lavorare solo per alias, senza mai
     * conoscere gli URL reali.
     * --------------------------------------------------------------------- */
    var Registry = (function () {

      var datasets = {}; // alias -> definizione dataset (oggetto da services.json)

      // registra uno o piu' dataset. Sovrascrive eventuali alias gia' presenti,
      // cosi da poter ricaricare un servizio senza duplicati.
      function register(list) {
        (list || []).forEach(function (d) {
          if (d && d.alias) datasets[d.alias] = d;
        });
      }

      function get(alias) { return datasets[alias] || null; }

      function has(alias) { return Object.prototype.hasOwnProperty.call(datasets, alias); }

      function aliases() { return Object.keys(datasets); }

      function clear() { datasets = {}; }

      // cerca un servizio all'interno dell'array services.json, sia per "id"
      // esatto sia per parametro "service" presente nel suo "link" (compatibile
      // con la logica gia' esistente in precedenza).
      function findService(list, serviceId) {
        var rec = list.find(function (r) { return r.id === serviceId; });
        if (rec) return rec;
        return list.find(function (r) {
          var m = /[?&]service=([^&]+)/.exec(r.link || '');
          return m && decodeURIComponent(m[1]) === serviceId;
        }) || null;
      }

      return {
        register: register,
        get: get,
        has: has,
        aliases: aliases,
        clear: clear,
        findService: findService
      };
    })();

    /* --------------------------------------------------------------------- *
     * MODULO: Loader
     * ---------------------------------------------------------------------
     * Esecuzione delle fetch HTTP vere e proprie: timeout per tentativo,
     * retry con backoff esponenziale, fallback su piu' endpoint alternativi
     * (il campo "fetch" di un dataset puo' essere una stringa o un array).
     *
     * IMPORTANTE: nessuna riscrittura di URL, nessun proxy. Il browser
     * chiama direttamente l'endpoint dichiarato nel dataset.
     * --------------------------------------------------------------------- */
    var Loader = (function () {

      // fetch con timeout tramite AbortController (con fallback se non disponibile)
      function fetchWithTimeout(url, init, timeout) {
        if (typeof AbortController === 'undefined') return fetch(url, init);

        var ctrl = new AbortController();
        var timer = setTimeout(function () { ctrl.abort(); }, timeout);
        var merged = assign({ signal: ctrl.signal }, init || {});

        return fetch(url, merged).then(
          function (r) { clearTimeout(timer); return r; },
          function (e) { clearTimeout(timer); throw e; }
        );
      }

      // Euristica per riconoscere un blocco CSP (connect-src) o CORS: il browser
      // riporta entrambi i casi come un generico TypeError "NetworkError" /
      // "Failed to fetch", senza distinzione esplicita per motivi di sicurezza.
      // Non possiamo saperlo con certezza dal solo JS, ma il pattern del
      // messaggio e' sufficientemente distintivo da meritare un avviso mirato.
      function isLikelyCspOrCorsError(err) {
        var msg = (err && err.message) || '';
        return /NetworkError|Failed to fetch|Load failed/i.test(msg);
      }

      // un singolo endpoint, con N tentativi e backoff esponenziale tra un
      // tentativo e l'altro
      function attempt(url, init, cfg, n) {
        n = n || 1;
        return fetchWithTimeout(url, init, cfg.timeout)
          .then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status + ' (' + url + ')');
            return r;
          })
          .catch(function (err) {
            // Un fallimento IMMEDIATO (pochi ms) con "NetworkError"/"Failed to fetch"
            // e' quasi sempre CSP (connect-src) o CORS lato server remoto, non un
            // vero problema di rete transitorio. In questo caso NON ha senso
            // riprovare lo stesso URL: l'errore e' deterministico, riprovare non
            // lo risolve mai. Meglio fallire subito su questo endpoint e lasciare
            // che fetchFirstAvailable passi immediatamente all'endpoint successivo
            // (tipicamente un relay locale nello stesso dominio, dichiarato come
            // fallback nel campo "fetch" del dataset in services.json).
            if (isLikelyCspOrCorsError(err)) {
              console.warn(
                '[OpenData:Loader] "' + url + '" sembra bloccato da CSP/CORS (non da un problema di rete): ' +
                'salto i retry su questo endpoint e passo al prossimo, se presente nel fallback.'
              );
              throw err; // fail-fast: nessun retry, nessuna attesa di backoff
            }

            if (n >= cfg.retries) throw err;
            var wait = cfg.retryDelay * Math.pow(cfg.backoff, n - 1);
            console.warn('[OpenData:Loader] tentativo ' + n + '/' + cfg.retries + ' fallito su ' + url + ': ' + err.message + '  riprovo tra ' + wait + 'ms');
            return delay(wait).then(function () { return attempt(url, init, cfg, n + 1); });
          });
      }

      // prova piu' endpoint in sequenza (fallback): il primo che risponde vince.
      // Ogni endpoint viene comunque tentato "cfg.retries" volte prima di
      // passare al successivo.
      function fetchFirstAvailable(endpoints, init, cfg) {
        var list = [].concat(endpoints).filter(Boolean);
        var lastErr = new Error('[OpenData:Loader] nessun endpoint disponibile');

        function next(i) {
          if (i >= list.length) throw lastErr;
          return attempt(list[i], init, cfg).catch(function (err) {
            lastErr = err;
            return next(i + 1);
          });
        }

        return Promise.resolve().then(function () { return next(0); });
      }

      // scarica e fa il parse JSON di un URL (o lista di URL alternativi),
      // restituendo anche il tempo impiegato in ms (usato dal modulo Statistics)
      function fetchJson(endpoints, init, cfg) {
        var t0 = now();
        return fetchFirstAvailable(endpoints, init, cfg)
          .then(function (response) {
            return response.json().then(function (data) {
              return { data: data, elapsedMs: Math.round(now() - t0) };
            });
          });
      }

      return {
        fetchJson: fetchJson,
        fetchFirstAvailable: fetchFirstAvailable
      };
    })();

    /* --------------------------------------------------------------------- *
     * MODULO: Cache
     * ---------------------------------------------------------------------
     * Cache in memoria dei risultati per alias. Ogni dataset puo' scegliere
     * se essere cacheable tramite il campo "cache": true/false nel proprio
     * services.json; se assente si usa il default globale di Config.
     *
     * La cache memorizza la PROMISE in corso (cosi' due richieste concorrenti
     * per lo stesso alias condividono la stessa fetch) e non i soli dati gia'
     * risolti: questo evita fetch duplicate quando piu' punti della pagina
     * chiedono lo stesso alias nello stesso istante.
     * --------------------------------------------------------------------- */
    var Cache = (function () {

      var store = {}; // alias -> Promise<dato normalizzato>

      // un dataset e' cacheable se lo dichiara esplicitamente, altrimenti
      // si applica il default globale (Config.get().cache)
      function isEnabledFor(datasetDef) {
        if (datasetDef && Object.prototype.hasOwnProperty.call(datasetDef, 'cache')) {
          return !!datasetDef.cache;
        }
        return !!Config.get().cache;
      }

      function has(alias) { return Object.prototype.hasOwnProperty.call(store, alias); }

      function get(alias) { return store[alias]; }

      function set(alias, promise) { store[alias] = promise; }

      // invalida un singolo alias, oppure tutta la cache se non specificato
      function invalidate(alias) {
        if (alias) delete store[alias];
        else store = {};
      }

      return {
        isEnabledFor: isEnabledFor,
        has: has,
        get: get,
        set: set,
        invalidate: invalidate
      };
    })();

    /* --------------------------------------------------------------------- *
     * MODULO: Normalizer
     * ---------------------------------------------------------------------
     * Riconosce automaticamente il formato del dato scaricato e lo riduce
     * SEMPRE a un array semplice di record per il resto della pipeline
     * (Filter/Sort/Limit), poi ricostruisce il formato originale in uscita.
     * Chi chiama OpenData.getData() non deve mai preoccuparsene.
     *
     * Formati riconosciuti:
     *
     *  1) Array JSON semplice: [ {...}, {...} ]
     *     -> gia' nella forma di lavoro, nessuna trasformazione.
     *
     *  2) GeoJSON FeatureCollection: { "type":"FeatureCollection", "features":[...] }
     *     -> lavora su "features"; in uscita ricostruisce l'involucro
     *        FeatureCollection preservando eventuali altre chiavi (es. "crs").
     *
     *  3) Struttura raggruppata dichiarativa (es. { "giorni": { "<data>":
     *     { "totale": N, "interventi":[...] } } }): il dataset dichiara in
     *     services.json COME leggerla, senza che il Normalizer conosca i
     *     nomi dei campi:
     *
     *       "recordsPath":    "giorni.*.interventi"  (percorso con UN
     *                          segmento jolly "*", che rappresenta la chiave
     *                          di raggruppamento, es. la data)
     *       "groupKeyField":  "date"   (opzionale: il valore della chiave di
     *                          raggruppamento viene iniettato in ogni record
     *                          con questo nome, cosi' Filter/Sort possono
     *                          usarlo. Viene rimosso in uscita se non era
     *                          gia' presente nel record originale.)
     *       "groupCountField":"totale" (opzionale: se presente, viene
     *                          ricalcolato in uscita in base al numero di
     *                          record rimasti nel gruppo dopo filtri/limiti)
     *
     *     In uscita ricostruisce la stessa struttura annidata originale,
     *     aggiornando solo gli array di record e l'eventuale conteggio.
     * --------------------------------------------------------------------- */
    var Normalizer = (function () {

      // legge un valore seguendo un percorso a punti SENZA jolly (es. "a.b.c")
      function getPath(obj, path) {
        if (!path) return obj;
        var parts = path.split('.');
        var value = obj;
        for (var i = 0; i < parts.length; i++) {
          if (value == null) return undefined;
          value = value[parts[i]];
        }
        return value;
      }

      // scrive un valore seguendo un percorso a punti SENZA jolly, creando
      // gli oggetti intermedi mancanti
      function setPath(obj, path, value) {
        if (!path) return;
        var parts = path.split('.');
        var target = obj;
        for (var i = 0; i < parts.length - 1; i++) {
          if (target[parts[i]] == null) target[parts[i]] = {};
          target = target[parts[i]];
        }
        target[parts[parts.length - 1]] = value;
      }

      // un dataset usa una struttura raggruppata se dichiara "recordsPath"
      // con esattamente un segmento jolly "*"
      function hasGroupedPath(datasetDef) {
        return !!(datasetDef && typeof datasetDef.recordsPath === 'string' && datasetDef.recordsPath.indexOf('*') !== -1);
      }

      function splitRecordsPath(recordsPath) {
        var parts = recordsPath.split('.');
        var starIndex = parts.indexOf('*');
        return {
          beforePath: parts.slice(0, starIndex).join('.'),
          afterPath: parts.slice(starIndex + 1).join('.')
        };
      }

      // appiattisce una struttura raggruppata in un array semplice di record,
      // iniettando (se richiesto) la chiave di raggruppamento in ogni record
      function flattenGrouped(raw, datasetDef) {
        var path = splitRecordsPath(datasetDef.recordsPath);
        var groupsContainer = getPath(raw, path.beforePath);
        var flat = [];

        if (groupsContainer && typeof groupsContainer === 'object') {
          Object.keys(groupsContainer).forEach(function (groupKey) {
            var group = groupsContainer[groupKey];
            var records = path.afterPath ? getPath(group, path.afterPath) : group;
            if (!Array.isArray(records)) return;

            records.forEach(function (record) {
              var withGroupKey = assign({}, record);
              if (datasetDef.groupKeyField && !(datasetDef.groupKeyField in withGroupKey)) {
                withGroupKey[datasetDef.groupKeyField] = groupKey;
              }
              flat.push(withGroupKey);
            });
          });
        }

        return flat;
      }

      // ricostruisce la struttura raggruppata originale a partire dall'array
      // di lavoro (eventualmente filtrato/ordinato/limitato), preservando
      // tutte le chiavi non toccate dalla pipeline (altri campi dei gruppi,
      // chiavi di primo livello estranee, ecc.)
      function rebuildGrouped(raw, workingArray, datasetDef) {
        var path = splitRecordsPath(datasetDef.recordsPath);
        var groupKeyField = datasetDef.groupKeyField;

        // clone: i dati opendata sono JSON puro (niente Date/funzioni/cicli),
        // quindi questo metodo e' sufficiente e non richiede dipendenze esterne
        var result = JSON.parse(JSON.stringify(raw));
        var groupsContainer = getPath(result, path.beforePath);

        if (!groupsContainer || typeof groupsContainer !== 'object') return result;

        Object.keys(groupsContainer).forEach(function (groupKey) {
          var recordsForGroup = groupKeyField
            ? workingArray.filter(function (r) { return String(r[groupKeyField]) === String(groupKey); })
            : [];

          // rimuove il campo tecnico di raggruppamento iniettato dal
          // flatten: non deve comparire nell'output se non c'era in origine
          var cleanRecords = recordsForGroup.map(function (r) {
            var copy = assign({}, r);
            if (groupKeyField) delete copy[groupKeyField];
            return copy;
          });

          if (path.afterPath) {
            setPath(groupsContainer[groupKey], path.afterPath, cleanRecords);
          } else {
            groupsContainer[groupKey] = cleanRecords;
          }

          if (datasetDef.groupCountField) {
            groupsContainer[groupKey][datasetDef.groupCountField] = cleanRecords.length;
          }
        });

        return result;
      }

      // riduce il dato grezzo scaricato a un array semplice di record
      function toWorkingArray(raw, datasetDef) {
        if (hasGroupedPath(datasetDef)) return flattenGrouped(raw, datasetDef);
        if (Array.isArray(raw)) return raw;
        if (raw && raw.type === 'FeatureCollection' && Array.isArray(raw.features)) return raw.features;
        return raw; // formato non riconosciuto: passthrough (gli engine successivi lo ignorano se non e' un array)
      }

      // ricostruisce il formato originale a partire dall'array di lavoro
      function rebuild(originalRaw, workingArray, datasetDef) {
        if (hasGroupedPath(datasetDef)) return rebuildGrouped(originalRaw, workingArray, datasetDef);

        if (originalRaw && originalRaw.type === 'FeatureCollection') {
          // preserva eventuali altre chiavi del GeoJSON originale (es. "crs")
          return assign({}, originalRaw, { features: workingArray });
        }

        return workingArray; // era gia' un array semplice, o formato sconosciuto: passthrough
      }

      return {
        toWorkingArray: toWorkingArray,
        rebuild: rebuild
      };
    })();

    /* --------------------------------------------------------------------- *
     * MODULO: FilterEngine
     * ---------------------------------------------------------------------
     * Applica filtri dichiarati in JSON (campo "filters" del dataset) a un
     * array di record. Due tipi di filtro:
     *
     *   { "field":"status", "operator":"=", "value":"Programmato" }
     *       -> valore statico, dichiarato nel JSON
     *
     *   { "field":"id", "operator":"=", "source":"query", "parameter":"obj_id" }
     *       -> valore letto dalla query string della pagina (es. ?obj_id=15).
     *          Se il parametro non e' presente in URL, il filtro viene
     *          semplicemente IGNORATO (non ha senso escludere tutti i record
     *          per un parametro opzionale assente).
     *
     * Filtri multipli sono combinati in AND (un record deve soddisfarli tutti).
     * --------------------------------------------------------------------- */
    var FilterEngine = (function () {

      // legge un parametro dalla query string della pagina corrente.
      // null se assente (distinto da stringa vuota, che e' un valore legittimo).
      function getQueryParam(name) {
        try {
          var params = new URLSearchParams(window.location.search);
          return params.has(name) ? params.get(name) : null;
        } catch (e) {
          return null;
        }
      }

      // valore effettivo su cui confrontare: query string oppure valore statico
      function resolveFilterValue(filterDef) {
        if (filterDef.source === 'query') return getQueryParam(filterDef.parameter);
        return Object.prototype.hasOwnProperty.call(filterDef, 'value') ? filterDef.value : null;
      }

      // valore di un campo del record; supporta notazione a punti per campi
      // annidati (es. "properties.status" nelle feature GeoJSON)
      function getFieldValue(record, field) {
        if (!record || !field) return undefined;
        if (Object.prototype.hasOwnProperty.call(record, field)) return record[field]; // fast path
        var parts = field.split('.');
        var value = record;
        for (var i = 0; i < parts.length; i++) {
          if (value == null) return undefined;
          value = value[parts[i]];
        }
        return value;
      }

      // implementazione dei singoli operatori supportati
      var OPERATORS = {
        // "==" intenzionale (non "==="): tollerante tra number/string, utile
        // perche' i valori da query string arrivano sempre come stringa.
        '=':          function (a, b) { return a == b; },
        '!=':         function (a, b) { return a != b; },
        '>':          function (a, b) { return Number(a) > Number(b); },
        '>=':         function (a, b) { return Number(a) >= Number(b); },
        '<':          function (a, b) { return Number(a) < Number(b); },
        '<=':         function (a, b) { return Number(a) <= Number(b); },
        'contains':   function (a, b) { return String(a == null ? '' : a).toLowerCase().indexOf(String(b).toLowerCase()) !== -1; },
        'startsWith': function (a, b) { return String(a == null ? '' : a).toLowerCase().indexOf(String(b).toLowerCase()) === 0; },
        'endsWith':   function (a, b) {
          var sa = String(a == null ? '' : a).toLowerCase(), sb = String(b).toLowerCase();
          return sa.length >= sb.length && sa.slice(sa.length - sb.length) === sb;
        },
        'in':         function (a, b) { return [].concat(b).some(function (v) { return v == a; }); },
        'notIn':      function (a, b) { return ![].concat(b).some(function (v) { return v == a; }); },
        'isNull':     function (a) { return a === null || a === undefined || a === ''; },
        'isNotNull':  function (a) { return !(a === null || a === undefined || a === ''); }
      };

      // valuta un singolo filtro contro un record
      function matchesFilter(record, filterDef) {
        var op = OPERATORS[filterDef.operator];
        if (!op) {
          console.warn('[OpenData:FilterEngine] operatore non riconosciuto: "' + filterDef.operator + '"  filtro ignorato');
          return true; // operatore sconosciuto: meglio non filtrare che rompere silenziosamente i dati
        }

        // isNull / isNotNull valutano solo il campo, non serve un valore di confronto
        if (filterDef.operator === 'isNull' || filterDef.operator === 'isNotNull') {
          return op(getFieldValue(record, filterDef.field));
        }

        var filterValue = resolveFilterValue(filterDef);

        // filtro da query string ma parametro assente in URL -> non si applica
        if (filterDef.source === 'query' && filterValue === null) return true;

        return op(getFieldValue(record, filterDef.field), filterValue);
      }

      // applica l'intero elenco di filtri (in AND) a un array di record
      function apply(records, filters) {
        if (!Array.isArray(records) || !filters || !filters.length) return records;
        return records.filter(function (record) {
          return filters.every(function (filterDef) { return matchesFilter(record, filterDef); });
        });
      }

      return { apply: apply };
    })();

    /* --------------------------------------------------------------------- *
     * MODULO: SortEngine
     * ---------------------------------------------------------------------
     * STUB per l'iterazione 1  verra' completato nell'iterazione 5.
     * --------------------------------------------------------------------- */
    var SortEngine = (function () {
      // TODO (iterazione 5): ordinamento per field/direction dichiarati in JSON
      function apply(records, sortDef) {
        return records;
      }
      return { apply: apply };
    })();

    /* --------------------------------------------------------------------- *
     * MODULO: LimitEngine
     * ---------------------------------------------------------------------
     * STUB per l'iterazione 1  verra' completato nell'iterazione 5.
     * --------------------------------------------------------------------- */
    var LimitEngine = (function () {
      // TODO (iterazione 5): troncamento a N elementi
      function apply(records, limit) {
        return records;
      }
      return { apply: apply };
    })();

    /* --------------------------------------------------------------------- *
     * MODULO: Statistics
     * ---------------------------------------------------------------------
     * Versione base gia' funzionante: per ogni alias tiene traccia di
     * tempo impiegato, numero record, provenienza (cache/rete) e timestamp
     * dell'ultimo fetch riuscito. Verra' eventualmente arricchito in
     * iterazione 6 (es. storico, medie, contatori di errore).
     * --------------------------------------------------------------------- */
    var Statistics = (function () {

      var info = {}; // alias -> { elapsedMs, recordCount, source, timestamp }

      function record(alias, stats) {
        info[alias] = assign({}, info[alias], stats);
      }

      function get(alias) { return info[alias] ? assign({}, info[alias]) : null; }

      return { record: record, get: get };
    })();

    /* --------------------------------------------------------------------- *
     * API PUBBLICA
     * ---------------------------------------------------------------------
     * Punto unico di ingresso usato dal resto dell'applicazione (ServiceHead
     * e qualunque pagina di contenuto). Orchestra i moduli sopra descritti.
     * --------------------------------------------------------------------- */

    var errorHandlers = [];
    var errorShown = false; // true solo se in alert c'e' un errore opendata (non un warning editoriale)
    var servicesPromise = null;

    function configure(opts) { Config.configure(opts); return api; }

    function onError(fn) {
      if (typeof fn === 'function') errorHandlers.push(fn);
      return api;
    }

    function emitError(err, context) {
      errorShown = true;
      showServiceAlert('danger', Config.get().errorText);
      errorHandlers.forEach(function (fn) {
        try { fn(err, context); } catch (e) { /* un handler difettoso non deve bloccare gli altri */ }
      });
    }

    function register(datasetList) { Registry.register(datasetList); return api; }
    function get(alias) { return Registry.get(alias); }
    function aliases() { return Registry.aliases(); }

    // carica (una sola volta, con cache di modulo) il file services.json
    function loadServices(url) {
      var target = Config.servicesUrl(url);
      if (!servicesPromise) {
        servicesPromise = Loader.fetchJson([target], null, Config.get())
          .then(function (result) { return result.data; })
          .catch(function (err) { servicesPromise = null; throw err; });
      }
      return servicesPromise;
    }

    // carica services.json, individua il record del servizio richiesto e
    // registra automaticamente tutti i suoi dataset nel Registry
    function loadService(serviceId, url) {
      return loadServices(url).then(function (list) {
        var rec = Registry.findService(list || [], serviceId);
        if (rec && rec.datasets) Registry.register(rec.datasets);
        return rec;
      });
    }

    // ottiene (ed eventualmente mette in cache) i dati di un dataset a
    // partire dal suo alias. Il chiamante non conosce mai l'URL reale.
    function getData(alias, opts) {
      opts = opts || {};
      var ds = Registry.get(alias);

      if (!ds) return Promise.reject(new Error('[OpenData] alias sconosciuto: ' + alias));
      if (!ds.fetch) return Promise.reject(new Error('[OpenData] nessun endpoint "fetch" per: ' + alias));

      var cacheEnabled = Cache.isEnabledFor(ds);
      if (cacheEnabled && Cache.has(alias)) {
        Statistics.record(alias, { source: 'cache' });
        return Cache.get(alias);
      }

      var cfg = assign({}, Config.get(), opts.config || {});

      var promise = Loader.fetchJson(ds.fetch, opts.init, cfg)
        .then(function (result) {
          // Il Normalizer riduce SEMPRE il dato a un array semplice di record
          // (Array puro, features di un GeoJSON, oppure una struttura
          // raggruppata dichiarata da "recordsPath" nel dataset), cosi'
          // Filter/Sort/Limit lavorano in modo identico qualunque sia la
          // forma originale del JSON.
          var working = Normalizer.toWorkingArray(result.data, ds);
          working = FilterEngine.apply(working, ds.filters);
          working = SortEngine.apply(working, ds.sort);
          working = LimitEngine.apply(working, ds.limit);
          var finalData = Normalizer.rebuild(result.data, working, ds);

          Statistics.record(alias, {
            elapsedMs: result.elapsedMs,
            recordCount: Array.isArray(working) ? working.length : null,
            source: 'network',
            timestamp: Date.now()
          });

          console.log('%c[OpenData] "' + alias + '" OK in ' + result.elapsedMs + 'ms', 'color:#16794a');
          return finalData;
        })
        .catch(function (err) {
          if (cacheEnabled) Cache.invalidate(alias); // non memorizzo i fallimenti
          console.error('%c[OpenData] "' + alias + '" FALLITO', 'color:#b81e1e', '\n  motivo:', err.message);
          if (opts.silent !== true) emitError(err, { phase: 'getData', alias: alias });
          throw err;
        });

      if (cacheEnabled) Cache.set(alias, promise);
      return promise;
    }

    // forza un nuovo fetch ignorando la cache per l'alias indicato
    function refresh(alias, opts) {
      Cache.invalidate(alias);
      return getData(alias, opts);
    }

    // statistiche dell'ultimo fetch riuscito per un dato alias
    function getInfo(alias) { return Statistics.get(alias); }

    // verifica di raggiungibilita' all'avvio: prova (di default) tutti gli
    // alias registrati e li mette in cache, cosi' le pagine successive
    // leggono gia' dalla cache.
    function probe(opts) {
      opts = opts || {};
      var keys = opts.aliases || aliases();
      if (!keys.length) return Promise.resolve({ ok: true, results: [], failed: [] });

      console.log('[OpenData] verifica raggiungibilita CKAN, dataset in prova:', keys.join(', '));
      var tStart = now();

      var jobs = keys.map(function (alias) {
        return getData(alias, { silent: true, config: opts.config, init: opts.init }).then(
          function (data) { return { alias: alias, ok: true, data: data }; },
          function (err) { return { alias: alias, ok: false, error: err }; }
        );
      });

      return Promise.all(jobs).then(function (results) {
        var failed = results.filter(function (r) { return !r.ok; });
        var requireAll = opts.requireAll !== false; // default: true
        var ok = requireAll ? failed.length === 0 : failed.length < results.length;
        var ms = Math.round(now() - tStart);

        if (ok) {
          console.log('%c[OpenData] CKAN RAGGIUNGIBILE ' + (results.length - failed.length) + '/' + results.length + ' dataset OK (' + ms + 'ms)', 'color:#fff;background:#16794a;padding:2px 6px;border-radius:3px');
        } else {
          console.error('%c[OpenData] CKAN NON RAGGIUNGIBILE ' + failed.length + '/' + results.length + ' dataset KO (' + ms + 'ms)', 'color:#fff;background:#b81e1e;padding:2px 6px;border-radius:3px');
          failed.forEach(function (r) { console.error('  "' + r.alias + '":', r.error && r.error.message); });
        }

        if (!ok) emitError(failed[0] && failed[0].error, { phase: 'probe', failed: failed });
        else if (errorShown) { hideServiceAlert(); errorShown = false; }

        return { ok: ok, results: results, failed: failed };
      });
    }

    var api = {
      // configurazione
      configure: configure,
      onError: onError,

      // registry
      register: register,
      get: get,
      aliases: aliases,

      // caricamento servizio / dataset
      loadServices: loadServices,
      loadService: loadService,
      getData: getData,
      refresh: refresh,
      getInfo: getInfo,
      probe: probe,

      // condiviso con ServiceHead
      findService: Registry.findService,

      // alert (compatibilita' con la versione precedente)
      showAlert: showServiceAlert,
      hideAlert: hideServiceAlert,

      // introspezione (debug / test)
      _config: function () { return Config.get(); }
    };

    return api;
  })();

  // esposto globalmente: utilizzabile da qualunque pagina di contenuto,
  // indipendentemente da ServiceHead
  window.OpenData = OpenData;

  /* ===========================================================================
   * Configurazione anticipata di OpenData dal div #service-head
   * ===========================================================================
   * Se la pagina espone data-url sul div #service-head, lo usiamo subito come
   * URL di services.json, prima ancora che ServiceHead venga istanziato.
   */
  (function configureOpenDataEarly() {
    var cfgDiv = document.getElementById('service-head');
    if (cfgDiv && cfgDiv.dataset.url) {
      OpenData.configure({ servicesUrl: cfgDiv.dataset.url });
    }
  })();

  /* ===========================================================================
   * SEZIONE: SERVICEHEAD
   * ===========================================================================
   * Rendering della testata servizio (titolo, sottotitolo, alert, lista
   * dataset + modale descrizione). Comportamento IDENTICO alla versione
   * precedente: cambia solo il modo in cui i dati vengono recuperati
   * (ora tramite il nuovo OpenData, senza proxy).
   */

  var INFO_MODAL_ID = 'infoServiceModal';

  // tag ammessi nel contenuto di "descriptiion"; qualsiasi altra chiave
  // viene comunque renderizzata come <p> per sicurezza
  var ALLOWED_DESC_TAGS = { p: 1, b: 1, i: 1, strong: 1, em: 1, h3: 1, h4: 1, span: 1, ul: 1, li: 1, br: 1 };

  function renderDescriptionBlocks(items) {
    return (items || []).map(function (item) {
      if (!item) return '';
      return Object.keys(item).map(function (tag) {
        var safeTag = ALLOWED_DESC_TAGS[tag] ? tag : 'p';
        return '<' + safeTag + '>' + esc(item[tag]) + '</' + safeTag + '>';
      }).join('');
    }).join('');
  }

  function buildInfoModal(descItems) {
    var modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = INFO_MODAL_ID;
    modal.setAttribute('tabindex', '-1');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'ModalInfoTitle');
    modal.innerHTML =
        '<div class="modal-dialog" role="document">'
      + '  <div class="modal-content">'
      + '    <div class="modal-header">'
      + '      <button class="btn-close" type="button" data-bs-dismiss="modal" aria-label="Chiudi finestra modale">'
      +          icon('it-close')
      + '      </button>'
      + '    </div>'
      + '    <div class="callout callout-more note">'
      + '      <div id="titleDescriptioModal" class="callout-title">'
      + '        <span style="color: #06c;">Descrizione</span>'
      + '      </div>'
      +        renderDescriptionBlocks(descItems)
      + '    </div>'
      + '    <div class="modal-footer modal-footer-shadow">'
      + '      <button class="btn btn-outline-primary btn-sm" type="button" data-bs-dismiss="modal">Chiudi</button>'
      + '    </div>'
      + '  </div>'
      + '</div>';
    return modal;
  }

  function removeInfoModal() {
    var m = $(INFO_MODAL_ID);
    if (m) m.remove();
  }

  // bottone che apre il modale dataset e il modale stesso
  function datasetTrigger() { return document.querySelector('[data-bs-target="#modalDataset"]'); }

  function toggleDatasetTrigger(visible) {
    var trig = datasetTrigger();
    if (trig) {
      var li = trig.closest('li');
      (li || trig).style.display = visible ? '' : 'none';
    }
  }

  function removeDatasetUI() { // nessun dataset: via bottone e modale
    toggleDatasetTrigger(false);
    var modal = $('modalDataset');
    if (modal) modal.remove();
  }

  document.addEventListener('DOMContentLoaded', function () {
    var cfg = $('service-head');
    if (!cfg) { hidePageLoader(); return; } // non e' una pagina servizio: nulla da attendere
    new ServiceHead(cfg).init();
  });

  function ServiceHead(cfg) {
    this.service = cfg.dataset.service || '';
    this.url = cfg.dataset.url || ''; // vuoto -> OpenData usa il default da BASE_URL
  }

  var P = ServiceHead.prototype;

  P.renderInfo = function (rec, titleEl) {
    removeInfoModal();
    var items = rec && rec.descriptiion;
    if (!items || !items.length || !titleEl) return;

    var a = document.createElement('a');
    a.setAttribute('data-bs-toggle', 'modal');
    a.setAttribute('data-bs-target', '#' + INFO_MODAL_ID);
    a.setAttribute('role', 'button');
    a.setAttribute('aria-label', 'Informazioni sul servizio');
    a.innerHTML = icon('it-info-circle');

    titleEl.appendChild(a);
    document.body.appendChild(buildInfoModal(items));
  };

  P.init = function () {
    this.showSkeleton();
    var self = this;
    OpenData.loadService(this.service, this.url || undefined)
      .then(function (rec) {
        self.render(rec);

        // Prova di disponibilita' all'avvio: le pagine renderizzano da questi
        // fetch, quindi se l'opendata e' giu' lo segnaliamo subito. In testata
        // basta una prova "leggera" sul primo dataset (le pagine di contenuto
        // useranno OpenData.getData(alias) per i dati veri e propri).
        // La promise viene restituita (non solo lanciata) cosi' lo spinner
        // globale resta visibile finche' anche la probe non e' terminata.
        var keys = OpenData.aliases();
        return keys.length ? OpenData.probe({ aliases: keys.slice(0, 1) }) : null;
      })
      .catch(function (err) {
        console.error('[service-head]', err);
        self.render(null); // services.json non raggiungibile -> testata vuota
      })
      .finally(function () {
        // Controlli terminati (successo o errore): lo spinner globale di
        // pagina non serve piu', indipendentemente dall'esito.
        hidePageLoader();
      });
  };

  // skeleton su titolo, sottotitolo e lista dataset
  P.showSkeleton = function () {
    var t = $('title-head-service'), s = $('subtitle-head-service'), ds = $('list-dataset-used');
    if (t) t.innerHTML = bar('60%', '1.8rem');
    if (s) s.innerHTML = bar('80%', '1rem');
    if (ds) {
      var li = '<li class="mb-2">' + bar('70%', '1rem') + '</li>';
      ds.innerHTML = li + li + li;
    }
    toggleDatasetTrigger(false); // nascondo il bottone finche' non so se ci sono datasets
  };

  function bar(w, h) {
    return '<span class="skeleton" style="display:inline-block;width:' + w + ';height:' + h + ';border-radius:4px;"></span>';
  }

  P.render = function (rec) {
    var t = $('title-head-service'), s = $('subtitle-head-service'), ds = $('list-dataset-used');

    if (t) {
      t.textContent = (rec && rec.title) || '';
      this.renderInfo(rec, t);
    }
    if (s) s.textContent = (rec && rec.desc) || '';

    this.renderAlert(rec);

    var datasets = (rec && rec.datasets) || [];
    if (!datasets.length) {
      if (ds) ds.innerHTML = '';
      removeDatasetUI();
      return;
    }

    if (ds) {
      ds.innerHTML = datasets.map(function (d) {
        return ''
          + '<li class="mb-2">'
          + '  <a href="' + (d.url || '#') + '" class="span-list-costum" target="_blank" rel="noopener">' + esc(d.nameDataset)
          + '    <svg class="icon icon-primary icon-sm"><use href="' + sprite('it-external-link') + '"></use></svg>'
          + '  </a>'
          + '</li>';
      }).join('');
    }
    toggleDatasetTrigger(true);
  };

  // mostra/nasconde #alertMessageService in base al campo "alert" del record
  P.renderAlert = function (rec) {
    var a = (rec && rec.alert && rec.alert[0]) || null;
    if (!a || !a.text) { hideServiceAlert(); return; }
    showServiceAlert(a.typeAlert || 'info', a.text);
  };
})();