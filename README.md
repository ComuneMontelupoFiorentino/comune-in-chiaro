# Comune in chiaro

> Piattaforma per la valorizzazione dei dati aperti comunali.
> Consente di creare interfacce semplici e accessibili per consultare e visualizzare gli Open Data.
> 
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)

## Struttura del repository

```
api/               relay PHP verso CKAN (opendata_relay.php)
assets/data/       services.json e altri dati statici
assets/dist/       bundle JS/CSS compilato (service-renderer.js, ecc.)
config/            config.php (base_url, CSP, ente, ecc.)
views/             partial PHP (header, footer, error page, testata servizio)
```

## Prerequisiti

`PHP >= 8.1`

`CKAN >= 2.10`

## Configurazione

`config/config.php` (da copiare/valorizzare per la propria installazione):

```php
return [
    'base_url'              => '/comune-in-chiaro/',
    'name_service'          => 'NOME SERVIZIO',
    'embed_parent_origin'   => 'https://www.esempio-ente.it/', // per frame-ancestors
    'csp_img_src_extra'     => 'https://www.esempio-ente.it/',
    'csp_connect_src_extra' => 'https://dati.toscana.it',      // host chiamati direttamente dal browser
];
```

Se un dataset viene chiamato **direttamente** (senza relay) e supporta CORS,
il suo host va comunque aggiunto a `csp_connect_src_extra`, altrimenti la CSP
blocca la richiesta anche se il CORS la permetterebbe.

## `services.json`

Array di **servizi**. Campi principali di ogni servizio:

| Campo | Note | Obbligatorio |
|---|---|---|
| `id` | slug, `a-z 0-9 _ -` | ✅ |
| `title`| mostrato sempre in testata, anche per `type: "sheet"` (nessun titolo dinamico, vedi sotto) | ✅ |
| `type` | valore libero, **non interpretato** da `ServiceHead` in questo repo |  |
| `desc` | sottotitolo, testo semplice | |
| `alert` | array `{typeAlert, text}` — **solo `alert[0]` viene mostrato** | |
| `descriptiion` | *(sic, refuso storico mantenuto nel codice)* array di blocchi `{tag: testo}` per il modale info. Tag ammessi: `p, b, i, strong, em, h3, h4, span, ul, li, br` | |
| `datasets` | vedi sotto | |

Esempio reale (da `assets/data/services.json`):

```json
{
  "id": "test",
  "type": "service",
  "title": "Test",
  "desc": "Ecco un test.",
  "alert": [{ "typeAlert": "warning", "text": "Messaggio di warning." }],
  "descriptiion": [{ "p": "Inizio della descrizione." }],
  "datasets": [
    {
      "nameDataset": "Dataset1",
      "alias": "test1",
      "url": "https://esempio.it/test1",
      "cache": true,
      "fetch": "https://esempio.it/test1"
    }
  ]
}
```

### Dataset — campi

| Campo | Obbligatorio | Note |
|---|---|---|
| `alias` | ✅ | univoco nel Registry di **pagina** (non solo nel servizio) |
| `fetch` | ✅ | stringa o array di URL alternativi (vedi sotto) |
| `nameDataset` / `url` | consigliato | etichetta + link mostrati in testata (`url` non è l'endpoint dati) |
| `cache` | | default globale `true`; cache = Promise in memoria, per alias, valida per la sessione di pagina |
| `recordsPath`, `groupKeyField`, `groupCountField` | | per JSON raggruppati non standard, es. `"giorni.*.interventi"` |
| `filters` | | array condizioni in AND, operatori: `= != > >= < <= contains startsWith endsWith in notIn isNull isNotNull` |

`fetch` come array — tentativo in ordine, il primo che risponde vince:

```json
"fetch": [
  "https://dati.toscana.it/dataset/.../download/file.json",
  "api/opendata_relay.php?u=https%3A%2F%2Fdati.toscana.it%2Fdataset%2F...%2Fdownload%2Ffile.json"
]
```

Ogni endpoint viene ritentato (default 3 volte, backoff esponenziale), tranne
quando l'errore assomiglia a un blocco CORS/CSP: in quel caso si passa
**subito** all'endpoint successivo, senza retry. **Non c'è riscrittura
automatica dell'URL**: se serve il relay va scritto esplicitamente in `fetch`.

## Usare `OpenData` in una pagina

```javascript
await OpenData.loadService('cerca-manutenzioni');   // legge services.json, registra i dataset
const plan = await OpenData.getData('plan');         // filtri già applicati; sort/limit no

plan.forEach(i => console.log(i.location, i.status));
```

Altri metodi utili:

```javascript
await OpenData.refresh('plan');           // ignora la cache
OpenData.getInfo('plan');                 // { elapsedMs, recordCount, source, timestamp }
OpenData.onError((err, ctx) => { ... });  // logica aggiuntiva oltre all'alert automatico
```

Se il div `#service-head` in pagina espone `data-url`, quell'URL viene usato
per `services.json`. In assenza di configurazione, `OpenData` usa un
fallback (`assets/data/services.json?v=9`) e stampa un warning in console —
in produzione conviene impostare sempre `data-url` esplicitamente.

Filtri con `"source": "query"` (es. su `?obj_id=15`) si applicano da soli
aprendo la pagina con quel parametro in URL: nessuna logica di filtraggio da
scrivere lato pagina. **Non esiste però un titolo dinamico automatico** per
pagine di dettaglio: se serve, va scritto a mano dopo aver letto i dati.

Più servizi nella stessa pagina condividono lo stesso Registry: alias uguali
tra servizi diversi si sovrascrivono a vicenda — usa alias namespaced
(`"servizio:alias"`) per evitare collisioni.

## Il relay `opendata_relay.php`

Relay same-origin verso host CKAN allowlistati, per i dataset che non
restituiscono `Access-Control-Allow-Origin`.

- Solo `GET` (altrimenti `405`).
- Allowlist anti-SSRF: solo gli host in `ALLOWED_HOSTS` sono inoltrabili (nel
  repo, solo `dati.toscana.it`); host diverso → `403`.
- Parametro `u`: URL reale urlencodato. Va costruito a mano, non c'è un tool
  in questo repo che lo generi.
- Nessuna cache lato server (ogni richiesta è live); la cache in memoria
  browser resta gestita da `OpenData` tramite il campo `cache` del dataset.
- Timeout: 8s connessione, 15s totali, max 5 redirect.
- Errori in JSON: `{ "error", "status", "detail" }`.

> Nota: il file si trova in questo repo sotto `api/opendata_relay.php`, ma il
> commento interno al file suggerisce il percorso `assets/api/opendata_relay.php`
> in `services.json`, e lo descrive come "unico endpoint" — mentre
> l'intestazione del bundle JS descrive invece un pattern "diretto poi relay
> in array". Verifica quale percorso è realmente raggiungibile nel tuo deploy
> prima di scrivere `fetch`.

## API di `OpenData`

| Metodo | Descrizione |
|---|---|
| `configure(opts)` | `servicesUrl, retries(3), retryDelay(700ms), backoff(2), timeout(12000ms), cache(true), errorText` |
| `onError(fn)` | handler aggiuntivo `(err, context)` |
| `register(list)` / `get(alias)` / `aliases()` | gestione diretta del Registry |
| `loadServices(url?)` | scarica `services.json` intero |
| `loadService(id, url?)` | trova il servizio (per `id` o per `?service=` nel `link`) e ne registra i dataset |
| `getData(alias, opts?)` | dati filtrati (Promise); `opts: {config, init, silent}` |
| `refresh(alias, opts?)` | come sopra ma invalida prima la cache |
| `getInfo(alias)` | statistiche ultimo fetch riuscito, o `null` |
| `probe(opts?)` | verifica raggiungibilità; `opts: {aliases, config, init, requireAll(true)}` |
| `showAlert(type, text)` / `hideAlert()` | alert generico riusabile |

## Elementi DOM usati da `ServiceHead`

| Id / selettore | Ruolo |
|---|---|
| `#spinnerLoadService` | spinner globale di caricamento pagina |
| `#title-head-service` / `#subtitle-head-service` | titolo / sottotitolo |
| `#alertMessageService` | alert editoriale (`alert[0]`) **e** errori di rete |
| `#list-dataset-used` | elenco dataset in testata |
| `[data-bs-target="#modalDataset"]` | bottone apertura modale dataset (nascosto se nessun dataset) |
| `#infoServiceModal` | modale con `descriptiion` |
