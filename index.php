<?php
declare(strict_types=1);

/**
 *  =========================
 * HEADER GENERICI (non dipendono dalla policy di embed)
 *  =========================
 */
header('Content-Type: text/html; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Permissions-Policy: geolocation=(self), camera=(), fullscreen=(self)');
header('Cross-Origin-Opener-Policy: same-origin');
header('Cross-Origin-Resource-Policy: same-origin');

$nonce = base64_encode(random_bytes(16));

/**
 *  =========================
 * Router principale
 *  =========================
 */

define('ROOT', __DIR__);

/**
 *  =========================
 * CONFIG DI INSTALLAZIONE (specifica di QUESTO server/servizio)
 * Nessun default hardcoded qui: se il file manca o e' malformato,
 * ci si ferma subito (fail-closed), non si prosegue con valori
 * indovinati che potrebbero rompere la CSP o l'embed.
 *  =========================
 */
$configPath = ROOT . '/config/config.php';

if (!is_file($configPath)) {
    http_response_code(500);
    error_log('[ERROR] config/config.php mancante: impossibile avviare il servizio');
    exit('Configurazione mancante.');
}

$config = require $configPath;

if (!is_array($config)) {
    http_response_code(500);
    error_log('[ERROR] config/config.php non restituisce un array valido');
    exit('Configurazione non valida.');
}

/**
 * Legge una chiave obbligatoria dalla config, fermando l'esecuzione
 * se assente: meglio un errore esplicito in fase di setup che un
 * comportamento silenzioso e sbagliato in produzione.
 */
function requireConfigValue(array $config, string $key): string
{
    if (!isset($config[$key]) || !is_string($config[$key]) || $config[$key] === '') {
        http_response_code(500);
        error_log(sprintf('[ERROR] config/config.php: chiave mancante o non valida [%s]', $key));
        exit('Configurazione incompleta.');
    }

    return $config[$key];
}

define('BASE_URL', requireConfigValue($config, 'base_url'));
define('NAME_SERVICE', requireConfigValue($config, 'name_service'));
define('NAME_SERVICE_SH', requireConfigValue($config, 'name_service_sh'));
define('DESC_SERVICE', requireConfigValue($config, 'desc_service'));
define('VERSION_SERVICE', requireConfigValue($config, 'version_service'));
define('ENTE', requireConfigValue($config, 'ente'));

// csp_connect_src_extra e' opzionale (potrebbe non servire connect-src
// aggiuntivo): stringa vuota di default, senza fermare l'esecuzione.
$cspImgSrcExtra = requireConfigValue($config, 'csp_img_src_extra');
$cspConnectSrcExtra = isset($config['csp_connect_src_extra']) && is_string($config['csp_connect_src_extra'])
    ? $config['csp_connect_src_extra']
    : '';

// Origine pubblica autorizzata a incorporare l'iframe embed (usata in
// frame-ancestors). NON puo' essere 'self': il parent (dominio
// pubblico) e la risposta embeddata sono su origini diverse.
// Sovrascrivibile via variabile d'ambiente per i test in locale
// (es. SetEnv EMBED_PARENT_ORIGIN "http://localhost:8080" nel vhost
// locale), senza mai modificare il valore di produzione in config.php.
define(
    'EMBED_PARENT_ORIGIN',
    getenv('EMBED_PARENT_ORIGIN') !== false
        ? getenv('EMBED_PARENT_ORIGIN')
        : requireConfigValue($config, 'embed_parent_origin')
);

/**
 *  =========================
 * HELPERS DI SICUREZZA
 *  =========================
 */

/**
 * Invia CSP e X-Frame-Options in un unico punto, una sola volta,
 * solo quando la policy (frame-ancestors / X-Frame-Options) e' nota.
 * Di default (nessun parametro "permissivo") applica default-deny.
 */
function sendSecurityPolicyHeaders(
    string $nonce,
    string $frameAncestors = "'none'",
    string $xFrameOptions = 'DENY',
    string $imgSrcExtra = '',
    string $connectSrcExtra = ''
): void {
    header(
        "Content-Security-Policy: " .
        "default-src 'self'; " .
        "img-src 'self' {$imgSrcExtra} data: https://tile.openstreetmap.org https://*.tile.openstreetmap.org; " .
        "font-src 'self' data:; " .
        "connect-src 'self' {$connectSrcExtra}; " .
        "script-src 'self' 'nonce-{$nonce}'; " .
        "style-src 'self' 'unsafe-inline'; " .
        "object-src 'none'; base-uri 'self'; frame-ancestors {$frameAncestors}; form-action 'self';"
    );
    header("X-Frame-Options: {$xFrameOptions}");
}

/**
 * Restituisce la configurazione del servizio richiesto, se presente
 * nel file services.json e strutturalmente valida. Nessuna fiducia
 * cieca nel JSON esterno: si accetta solo un array associativo.
 */
function getServiceConfig(array $services, string $service): ?array
{
    foreach ($services as $cfg) {

        if (
            is_array($cfg) &&
            isset($cfg['id']) &&
            $cfg['id'] === $service
        ) {
            return $cfg;
        }
    }

    return null;
}

/**
 *  =========================
 * SOLO GET / HEAD
 *  =========================
 */
if (!in_array($_SERVER['REQUEST_METHOD'] ?? 'GET', ['GET', 'HEAD'], true)) {
    http_response_code(405);
    header('Allow: GET, HEAD');
    error_log('[SECURITY] metodo non ammesso: ' . ($_SERVER['REQUEST_METHOD'] ?? '?'));
    // Policy nota solo ora: default deny, inviata una sola volta.
    sendSecurityPolicyHeaders($nonce);
    require ROOT . '/views/layout/header.php';
    require ROOT . '/views/error/bad_request.php';
    require ROOT . '/views/layout/footer.php';
    exit;
}

/**
 * =========================
 * INPUT SANITIZZATI
 * =========================
 */
function cleanInput(?string $value): string
{
    return preg_replace(
        '/[^a-z0-9_-]/',
        '',
        strtolower(trim($value ?? ''))
    );
}
function cleanBool(mixed $value): bool
{
    return filter_var($value, FILTER_VALIDATE_BOOLEAN);
}

$main    = cleanInput($_GET['main'] ?? '');
$service = cleanInput($_GET['service'] ?? '');
$sheet   = cleanInput($_GET['sheet'] ?? '');
$obj_id  = isset($_GET['obj_id']) ? cleanInput($_GET['obj_id']) : null;

$useLeaflet    = cleanBool($_GET['map'] ?? false);
$useBreadCrumb = cleanBool($_GET['breadCrumb'] ?? false);
$useScan       = cleanBool($_GET['scan'] ?? false);

/**
 *  =========================
 * DEFAULT HOME
 *  =========================
 */
if ($main === '' && $service === '' && $sheet === '') {
    $main = 'home';
}

/**
 *  =========================
 * MAIN WHITELIST (dinamica, niente array hardcoded:
 * e' valida solo una pagina che esiste davvero come vista)
 *  =========================
 */
$mainDir = ROOT . '/views/main';
$mainPages = [];

if (is_dir($mainDir)) {
    foreach (glob($mainDir . '/*.php') as $file) {
        $mainPages[] = pathinfo($file, PATHINFO_FILENAME);
    }
}

/**
 *  =========================
 * SERVICE WHITELIST
 *  =========================
 */
$serviceDir = ROOT . '/views/service';
$servicePages = [];

if (is_dir($serviceDir)) {
    foreach (glob($serviceDir . '/*.php') as $file) {
        $servicePages[] = pathinfo($file, PATHINFO_FILENAME);
    }
}

$isServiceValid = ($service !== '' && in_array($service, $servicePages, true));

/**
 *  =========================
 * SHEET WHITELIST
 *  =========================
 */
$sheetDir = ROOT . '/views/sheet';
$sheetPages = [];

if (is_dir($sheetDir)) {
    foreach (glob($sheetDir . '/*.php') as $file) {
        $sheetPages[] = pathinfo($file, PATHINFO_FILENAME);
    }
}

$isSheetValid = ($sheet !== '' && in_array($sheet, $sheetPages, true));

/**
 *  =========================
 * FALLBACK SERVICE O SHEET NON VALIDO
 *  =========================
 */
if ($service !== '' && !$isServiceValid) {
    error_log(sprintf('[SECURITY] service non in whitelist [%s]', substr($service, 0, 100)));
    $service = '';
}
if ($sheet !== '' && !$isSheetValid) {
    error_log(sprintf('[SECURITY] sheet non in whitelist [%s]', substr($sheet, 0, 100)));
    $sheet = '';
}

/**
 *  =========================
 * FALLBACK obj_id SENZA SHEET VALIDO
 *  =========================
 */

// Caso 1: obj_id presente ma sheet non valido
if ($obj_id !== null && !$isSheetValid) {
    error_log(sprintf('[SECURITY] obj_id presente senza sheet valido [obj_id=%s] [sheet=%s]', substr($obj_id, 0, 100), substr($sheet, 0, 100)));
    http_response_code(400);
    // Policy nota solo ora: default deny, inviata una sola volta.
    sendSecurityPolicyHeaders($nonce);
    require ROOT . '/views/layout/header.php';
    require ROOT . '/views/error/bad_request.php';
    require ROOT . '/views/layout/footer.php';
    exit;
}

// Caso 2: sheet valido ma obj_id assente
if ($isSheetValid && $obj_id === null) {
     error_log(sprintf(
        '[SECURITY] sheet valido senza obj_id [sheet=%s]',
        substr($sheet, 0, 100)
    ));
    http_response_code(400);
    sendSecurityPolicyHeaders($nonce);

    require ROOT . '/views/layout/header.php';
    require ROOT . '/views/error/bad_request.php';
    require ROOT . '/views/layout/footer.php';
    exit;
} 

/**
 * =========================
 * CSS DINAMICO (IMPORTANTE x skeleton)
 * =========================
 */
$customCss = 'home';

if ($isServiceValid) {
    $customCss = $service;
} elseif (in_array($main, $mainPages, true)) {
    $customCss = $main;
}

/**
 * =========================
 * JS DINAMICO
 * =========================
 */
$customJs = 'home';

if ($isServiceValid) {
    $customJs = $service;
} elseif (in_array($main, $mainPages, true)) {
    $customJs = $main;
} elseif ($isSheetValid) {
    $customJs = $sheet;
} 

/**
 * =========================
 * CONFIG SERVIZI (lettura sicura di services.json)
 * =========================
 */
$servicesPath = ROOT . '/assets/data/services.json';
$services = [];

if (is_file($servicesPath) && is_readable($servicesPath)) {
    $json = file_get_contents($servicesPath);

    if ($json !== false) {
        try {
            $decoded = json_decode($json, true, 512, JSON_THROW_ON_ERROR);

            if (is_array($decoded)) {
                $services = $decoded;
            } else {
                error_log('[ERROR] services.json non valido: formato inatteso (atteso array/oggetto)');
            }
        } catch (JsonException $e) {
            error_log('[ERROR] services.json non valido: ' . $e->getMessage());
        }
    } else {
        error_log('[ERROR] impossibile leggere services.json');
    }
} else {
    error_log('[ERROR] services.json non trovato o non leggibile');
}

$serviceConfig = getServiceConfig($services, $service);

/**
 *  =========================
 * EMBED PAGE
 * Il servizio deve essere realmente valido (whitelist su file
 * esistenti) E deve avere allowEmbed=true nel JSON di configurazione:
 * nessuna delle due condizioni da sola basta a concedere l'embed.
 *  =========================
 */

// $serviceAllowsEmbed e' una proprieta' del SERVIZIO (da services.json),
// indipendente dalla richiesta corrente: serve per decidere se la
// pagina "normale" del servizio deve costruire l'iframe verso la
// versione embeddata.
$serviceAllowsEmbed = (
    $isServiceValid &&
    $serviceConfig !== null &&
    ($serviceConfig['allowEmbed'] ?? false) === true
);

// $isEmbedRequest indica che QUESTA richiesta dichiara embed=true,
// cioe' che questa risposta e' quella destinata a finire dentro
// l'iframe (tipicamente sull'host dedicato all'embed).
$isEmbedRequest = cleanBool($_GET['embed'] ?? false);

// $allowEmbed determina la policy di sicurezza (frame-ancestors /
// X-Frame-Options) di QUESTA risposta: ha senso allentarla solo
// quando la risposta e' davvero quella richiesta in modalita' embed,
// per un servizio che lo consente.
$allowEmbed = $isEmbedRequest && $serviceAllowsEmbed;

if ($isEmbedRequest && !$allowEmbed) {
    error_log(
        sprintf('[SECURITY] richiesta embed non autorizzata [%s]', $service)
    );
}

$servicesVersion = is_file($servicesPath)
    ? date('YmdHis', filemtime($servicesPath))
    : date('YmdHis');

$servicesUrl = BASE_URL . 'assets/data/services.json?v=' . $servicesVersion;

// Default deny: solo se questa risposta e' effettivamente imbeddabile
// si allenta la policy.
$xFrameOptions = 'DENY';
$frameAncestors = "'none'";

if ($allowEmbed) {
    // 'self' non funzionerebbe: il parent (dominio pubblico) e questa
    // risposta sono su origini diverse. Va indicata esplicitamente
    // l'origine pubblica autorizzata. X-Frame-Options non supporta
    // origini arbitrarie: resta come fallback solo per i browser
    // legacy che non leggono la CSP (su quelli l'embed cross-origin
    // non funzionera', ma resta sicuro).
    $xFrameOptions = 'SAMEORIGIN';
    $frameAncestors = EMBED_PARENT_ORIGIN;
}

/**
 * =========================
 * INVIO POLICY DI SICUREZZA (CSP + X-Frame-Options)
 * Ora, e solo ora, la policy corretta e' nota: viene inviata
 * un'unica volta, prima di qualunque require/output.
 * =========================
 */
sendSecurityPolicyHeaders($nonce, $frameAncestors, $xFrameOptions, $cspImgSrcExtra, $cspConnectSrcExtra);

/**
 * =========================
 * ROUTING AND COMPOSITION
 * =========================
 */

if ($isServiceValid) {

    $serviceFile = ROOT . "/views/service/{$service}.php";

    require ROOT . '/views/layout/header.php';
    require ROOT . '/views/partials/header_service.php';
    require $serviceFile;
    require ROOT . '/views/partials/notice_dataset.php';
    require ROOT . '/views/partials/segnalazioni.php';
    require ROOT . '/views/layout/footer.php';
    exit;
} 
if ($isSheetValid) {

    $sheetFile = ROOT . "/views/sheet/{$sheet}.php";

    require ROOT . '/views/layout/header.php';
    require ROOT . '/views/partials/header_service.php';
    require $sheetFile;
    require ROOT . '/views/partials/notice_dataset.php';
    require ROOT . '/views/partials/segnalazioni_obj.php';
    require ROOT . '/views/layout/footer.php';
    exit;

} 

/**
 * =========================
 * ROUTING MAIN
 * =========================
 */
if (in_array($main, $mainPages, true)) {

    $file = ROOT . "/views/main/{$main}.php";

    require ROOT . '/views/layout/header.php';
    require $file;
    require ROOT . '/views/layout/footer.php';
    exit;
}

/**
 *  =========================
 * FALLBACK
 *  =========================
 */
http_response_code(404);
error_log('[SECURITY] richiesta non valida (fallback 404)');

require ROOT . '/views/layout/header.php';
require ROOT . '/views/error/not_found.php';
require ROOT . '/views/layout/footer.php';

exit;

/**
 *  =========================
 * HELPERS
 *  =========================
 */
function isActiveMain(string $page, string $current): string {
    return $page === $current ? 'active' : '';
}
