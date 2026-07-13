<?php
// config/config.example.php — TEMPLATE: copiare come config/config.php
// e valorizzare per QUESTA installazione. Non committare config.php
// reale se contiene dati che non devono essere pubblici.
declare(strict_types=1);

return [
    'base_url'              => '/comune-in-chiaro/',
    'name_service'          => 'NOME SERVIZIO',
    'name_service_sh'       => 'NOME SERVIZIO (breve)',
    'desc_service'          => 'Descrizione del servizio',
    'version_service'       => '1.2.0 (beta)',
    'ente'                  => 'Nome Ente',

    // Origine pubblica autorizzata a incorporare l'iframe embed
    // (usata in frame-ancestors). Sovrascrivibile in locale con la
    // variabile d'ambiente EMBED_PARENT_ORIGIN.
    'embed_parent_origin'   => 'https://www.esempio-ente.it/',

    // Dominio(i) extra da aggiungere a img-src nella CSP, oltre a
    // 'self' e ai tile OpenStreetMap gia' previsti nel codice.
    'csp_img_src_extra'     => 'https://www.esempio-ente.it/',

    // Dominio(i) extra da aggiungere a connect-src nella CSP.
    // Opzionale: se non serve, lasciare stringa vuota.
    'csp_connect_src_extra' => 'https://dati.toscana.it',
];
