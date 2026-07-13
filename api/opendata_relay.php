<?php

/**
 * =============================================================================
 * opendata_relay.php
 * =============================================================================
 *
 * Relay minimale, SAME-ORIGIN, verso dati.toscana.it. Usato come UNICO
 * endpoint (non piu' come fallback) per i dataset i cui link di download non
 * restituiscono Access-Control-Allow-Origin, quindi non chiamabili
 * direttamente dal browser via fetch().
 *
 * NESSUNA CACHE LOCALE: ogni richiesta interroga sempre CKAN in tempo reale.
 * Scelta intenzionale, dato che il portale CKAN non cambiera' (niente doppio
 * tentativo diretto+relay) e i dati (es. piani di manutenzione giornalieri)
 * cambiano spesso: meglio dati sempre freschi che una cache da invalidare.
 * Se in futuro servisse ridurre il carico su CKAN, la cache di OpenData nel
 * browser (campo "cache" del dataset in services.json) resta comunque
 * disponibile e configurabile senza toccare questo file.
 *
 * Uso in services.json (endpoint singolo, non piu' array):
 *
 *   "fetch": "assets/api/opendata_relay.php?u=https%3A%2F%2Fdati.toscana.it%2F..."
 *
 * Perche' funziona senza CORS: la richiesta browser -> questo file e'
 * SAME-ORIGIN (stesso dominio dell'app). La richiesta questo file -> CKAN e'
 * server-to-server (curl): CORS e' un vincolo applicato solo dai browser,
 * quindi qui non esiste alcun blocco.
 * =============================================================================
 */

declare(strict_types=1);

// Solo questi host sono inoltrabili: protezione anti-SSRF, non rimuovere
// anche se il portale "resta inalterato" — protegge comunque da un uso
// improprio del parametro "u" (es. per raggiungere host interni della rete).
const ALLOWED_HOSTS = ['dati.toscana.it'];

const CONNECT_TIMEOUT = 8;   // secondi
const TIMEOUT         = 15;  // secondi (totale)
const MAX_REDIRECTS   = 5;

// Se la rete interna esce su internet solo tramite un proxy aziendale,
// impostalo qui (altrimenti lasciare vuoto).
const OUTBOUND_PROXY = '';   // es. 'http://proxy.intra:8080'

header('X-Content-Type-Options: nosniff');

function fail(int $status, string $msg, string $detail = ''): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => $msg, 'status' => $status, 'detail' => $detail], JSON_UNESCAPED_SLASHES);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    fail(405, 'metodo non consentito');
}

$target = isset($_GET['u']) ? (string) $_GET['u'] : '';
if ($target === '') {
    fail(400, 'parametro "u" mancante');
}

/* ---------------------------------------------------------------------------
 * Validazione URL + allowlist host (anti-SSRF)
 * ---------------------------------------------------------------------- */
$parts = parse_url($target);

if (
    $parts === false
    || empty($parts['scheme']) || empty($parts['host'])
    || !in_array(strtolower($parts['scheme']), ['http', 'https'], true)
    || !in_array(strtolower($parts['host']), ALLOWED_HOSTS, true)
) {
    fail(403, 'host non consentito');
}

/* ---------------------------------------------------------------------------
 * Richiesta verso CKAN (server-to-server: nessun vincolo CORS qui).
 * Nessuna cache: ogni chiamata rifà sempre la fetch da CKAN.
 * ---------------------------------------------------------------------- */
$ch = curl_init($target);

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,        // i /download CKAN spesso rimbalzano
    CURLOPT_MAXREDIRS      => MAX_REDIRECTS,
    CURLOPT_CONNECTTIMEOUT => CONNECT_TIMEOUT,
    CURLOPT_TIMEOUT        => TIMEOUT,
    CURLOPT_HTTPHEADER     => ['Accept: application/json, application/geo+json, */*'],
    CURLOPT_USERAGENT      => 'comune-in-chiaro-opendata-relay/1.0',
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2,
]);

if (OUTBOUND_PROXY !== '') {
    curl_setopt($ch, CURLOPT_PROXY, OUTBOUND_PROXY);
}

$body  = curl_exec($ch);
$err   = curl_error($ch);
$code  = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
$ctype = (string) curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
curl_close($ch);

if ($body === false || $code === 0) {
    fail(502, 'opendata non raggiungibile', $err);
}

if ($code >= 400) {
    fail($code, 'errore dalla sorgente opendata', 'HTTP ' . $code);
}

if ($ctype === '') {
    $ctype = 'application/json; charset=utf-8';
}

/* ---------------------------------------------------------------------------
 * Risposta (nessuna scrittura su cache: nessun file, nessuna cartella).
 * Nessun header CORS: la richiesta browser -> questo file e' SAME-ORIGIN.
 * ---------------------------------------------------------------------- */
header('Content-Type: ' . $ctype);
echo $body;