<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="robots" content="index,follow">
    <title><?= NAME_SERVICE ?></title>    
    <meta name="description" content="Comune in Chiaro è il portale che consente di consultare servizi e informazioni basati sugli opendata comunali">

    <!-- Favicons -->
    <link rel="shortcut icon" href="https://www.comune.montelupo-fiorentino.fi.it<?= BASE_URL ?>assets/dist/favicon/favicon.ico">
    <!-- Apple Touch Icons -->
    <link rel="apple-touch-icon" href="https://www.comune.montelupo-fiorentino.fi.it<?= BASE_URL ?>assets/dist/favicon/apple-touch-icon.png">
    <link rel="apple-touch-icon" sizes="57x57" href="https://www.comune.montelupo-fiorentino.fi.it<?= BASE_URL ?>assets/dist/favicon/apple-icon-57x57.png">
    <link rel="apple-touch-icon" sizes="60x60" href="https://www.comune.montelupo-fiorentino.fi.it<?= BASE_URL ?>assets/dist/favicon/apple-icon-60x60.png">
    <link rel="apple-touch-icon" sizes="72x72" href="https://www.comune.montelupo-fiorentino.fi.it<?= BASE_URL ?>assets/dist/favicon/apple-icon-72x72.png">
    <link rel="apple-touch-icon" sizes="76x76" href="https://www.comune.montelupo-fiorentino.fi.it<?= BASE_URL ?>assets/dist/favicon/apple-icon-76x76.png">
    <link rel="apple-touch-icon" sizes="114x114" href="https://www.comune.montelupo-fiorentino.fi.it<?= BASE_URL ?>assets/dist/favicon/apple-icon-114x114.png">
    <link rel="apple-touch-icon" sizes="120x120" href="https://www.comune.montelupo-fiorentino.fi.it<?= BASE_URL ?>assets/dist/favicon/apple-icon-120x120.png">
    <link rel="apple-touch-icon" sizes="144x144" href="https://www.comune.montelupo-fiorentino.fi.it<?= BASE_URL ?>assets/dist/favicon/apple-icon-144x144.png">
    <link rel="apple-touch-icon" sizes="152x152" href="https://www.comune.montelupo-fiorentino.fi.it<?= BASE_URL ?>assets/dist/favicon/apple-icon-152x152.png">
    <!-- Android / Chrome -->
    <link rel="icon" type="image/png" sizes="192x192" href="https://www.comune.montelupo-fiorentino.fi.it<?= BASE_URL ?>assets/dist/favicon/android-chrome-192x192.png">
    <link rel="icon" type="image/png" sizes="512x512" href="https://www.comune.montelupo-fiorentino.fi.it<?= BASE_URL ?>assets/dist/favicon/android-chrome-512x512.png">
    <link rel="icon" type="image/png" sizes="192x192" href="https://www.comune.montelupo-fiorentino.fi.it<?= BASE_URL ?>assets/dist/favicon/android-icon-192x192.png">
    <!-- Standard favicons -->
    <link rel="icon" type="image/png" sizes="32x32" href="https://www.comune.montelupo-fiorentino.fi.it<?= BASE_URL ?>assets/dist/favicon/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="96x96" href="https://www.comune.montelupo-fiorentino.fi.it<?= BASE_URL ?>assets/dist/favicon/favicon-96x96.png">
    <link rel="icon" type="image/png" sizes="16x16" href="https://www.comune.montelupo-fiorentino.fi.it<?= BASE_URL ?>assets/dist/favicon/favicon-16x16.png">

    <!-- Classi css -->
    <link rel="stylesheet" href="assets/dist/css/bootstrap-italia.min.css">
    <link rel="stylesheet" href="assets/dist/css/custom.css?v=64">

    <?php
    // controllo se includere css per skeleton-loader
    $skeletonFile = ROOT . "/assets/dist/css/loading/skeleton-load-{$customCss}.css";
    if (file_exists($skeletonFile)) { 
    ?>
    <link rel="stylesheet" href="<?= BASE_URL ?>assets/dist/css/loading/skeleton-load-<?= htmlspecialchars($customCss) ?>.css?v=<?= filemtime($skeletonFile) ?>">
    <?php } ?>

    <?php if ($useLeaflet) { ?>
        <link rel="stylesheet" href="<?= BASE_URL ?>assets/dist/leaflet/leaflet.css">
        <script src="<?= BASE_URL ?>assets/dist/leaflet/leaflet.js"></script>
        <script src="<?= BASE_URL ?>assets/dist/turf/turf.js"></script>
    <?php } ?>

    <?php if ($useScan) { ?>
        <script src="<?= BASE_URL ?>assets/dist/html5-qrcode-master/html5-qrcode.min.js"></script>
    <?php } ?>

    <style>
        .mw-locked {
  opacity: .5;
  cursor: not-allowed;
}
    
    </style>
</head>
<body data-base-url="<?= htmlspecialchars(BASE_URL, ENT_QUOTES, 'UTF-8') ?>">

    <header class="it-header-wrapper" data-bs-target="#main-navigation">
        
        <div class="it-header-slim-wrapper">
            <div class="container">
                <div class="row">
                    <div class="col-12">
                        <div class="it-header-slim-wrapper-content">
                            <a class="d-none d-md-inline navbar-brand" target="_blank" href="https://www.comune.montelupo-fiorentino.fi.it/" aria-label="Vai al sito del <?= ENTE ?>" title="Vai al sito del <?= ENTE ?>"> <?= ENTE ?></a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    
        <div class="it-nav-wrapper">
            <div class="it-header-center-wrapper custom-header-small">
                <div class="container">
                    <div class="row">
                        <div class="col-12">
                            <div class="it-header-center-content-wrapper d-flex align-items-center justify-content-center justify-content-lg-between">

                                <button class="navbar-toggler burger-menu d-lg-none" type="button" aria-label="Mostra/Nascondi la navigazione" data-bs-toggle="navbarcollapsible" data-bs-target="#main-navigation">
                                    <svg class="icon"><use href="assets/dist/svg/sprites.svg#it-burger"></use></svg>
                                </button>
                                
                                <div class="it-brand-wrapper">
                                    <a href="<?= BASE_URL ?>" class="d-flex align-items-center text-decoration-none">
                                        <div class="me-2 flex-shrink-0" style="height:64px;">
                                            <img src="<?= BASE_URL ?>assets/dist/logo.png" alt="<?= NAME_SERVICE ?>" class="h-100 img-brand" style="object-fit:contain;">
                                        </div>
                                        <div>
                                            <div class="d-none d-md-block" style="color: white;">
                                                <div class="it-brand-title"><?= NAME_SERVICE ?></div>
                                                <div class="it-brand-tagline" style="color: white;"><?= DESC_SERVICE ?></div>
                                            </div>
                                            <div class="d-block d-md-none">
                                                <div class="it-brand-title" style="color: white; font-size: 20px; line-height: 1.1;">
                                                    <?= NAME_SERVICE_SH ?>
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                </div>

                                <?php if ($main === 'home') { ?>
                                
                                <button class="search-link rounded-icon" data-bs-toggle="modal" data-bs-target="#search-modal" aria-label="Cerca servizio">
                                    <svg class="icon"><use href="assets/dist/svg/sprites.svg#it-search"></use></svg>
                                </button>

                                <?php } ?>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </header>

    <div class="it-header-navbar-wrapper theme-dark-mobile">
        <div class="container-xxl">
            <div class="row">
                <div class="col-12">
                    <nav class="navbar navbar-expand-lg has-megamenu" aria-label="Navigazione principale">
                        
                        <div class="navbar-collapsable" id="main-navigation" tabindex="-1">
                            <div class="close-div">
                                <button class="btn close-menu" type="button">
                                    <span class="visually-hidden">Nascondi la navigazione</span>
                                    <svg class="icon"><use href="assets/dist/svg/sprites.svg#it-close-big"></use></svg>
                                </button>
                            </div>
                            <div class="menu-wrapper">
                                <a class="logo-hamburger d-lg-none" href="https://www.comune.montelupo-fiorentino.fi.it">
                                    <div class="it-brand-text">
                                        <div class="it-brand-title-custom"><?= ENTE ?></div>
                                    </div>
                                </a>
                                <ul class="navbar-nav">
                                    <li class="nav-item">
                                        <a class="nav-link <?= isActiveMain('home', $main) ?>" href="<?= BASE_URL ?>" aria-current="page"><span>Home</span></a>
                                    </li>
                                    <li class="nav-item">
                                        <a class="nav-link <?= isActiveMain('about', $main) ?>" href="<?= BASE_URL ?>?main=about"><span>Cos'è</span></a>
                                    </li>
                                </ul>
                            </div>
                        </div>

                    </nav>
                </div>
            </div>
        </div>
    </div>

    <?php if ($main === 'home') { ?>

    <div class="modal it-dialog-scrollable fade" role="dialog" id="search-modal" tabindex="-1" aria-labelledby="modalrightTitle" aria-hidden="true">
        <div class="modal-dialog modal-dialog-right" role="document">
            <div class="modal-content">
                
                <div class="modal-header">
                    <h2 class="modal-title h5" id="modalrightTitle">Cerca servizio</h2>
                    <button class="btn-close" type="button" data-bs-dismiss="modal" aria-label="Chiudi finestra modale">
                        <svg class="icon"><use href="assets/dist/svg/sprites.svg#it-close"></use></svg>
                    </button>
                </div>
                
                <div class="modal-body">
                    <div class="row">
                        <div class="col-12">
                            
                            <div class="form-group mt-4">
                                <div class="input-group">
                                    <div class="input-group-text">
                                        <svg class="icon"><use href="assets/dist/svg/sprites.svg#it-search"></use></svg>
                                    </div>
                                    <input type="text" class="form-control" id="searchService">
                                    <label for="searchService" class="active">Parola chiave</label>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-primary btn-sm" type="button">Cerca</button>
                </div>

            </div>
        </div>
    </div>

    <?php } ?>

    <div id="service-head" data-service="<?= htmlspecialchars($service ?? '') ?>" data-url="<?= htmlspecialchars($servicesUrl) ?>"></div>
