

<main>
    <div>
        <section class="hero-section hero-horizontal  fade-in delay-1">
            <div class="hero-bg">
                <div class="hero-gradient"></div>
                <div class="hero-pattern"></div>
            </div>
            <div class="container">
                <div class="row align-items-center">
                    <div class="hero-tagline col-lg-6">
                        <div class="h1 h1-section-custom words-white-custom delay-2 custom-icon-locate">
                            <!-- DESKTOP -->
                            <div class="d-none d-md-block" style="color: white; ">
                                <div class="it-brand-title">
                                    <?= NAME_SERVICE ?>
                                </div>
                            </div>
                            <!-- MOBILE -->
                            <div class="d-block d-md-none">
                                <div class="it-brand-title" style="color: white;  font-size: 40px;">
                                    <?= NAME_SERVICE_SH ?>
                                </div>
                            </div>
                            <span class="d-none d-md-inline version-badge">
                                <svg class="icon icon-sm icon-primary ms-1 mb-1" aria-hidden="true"><use href="assets/dist/svg/sprites.svg#it-code-circle"></use></svg>
                                <?= VERSION_SERVICE ?>
                            </span>
                        </div>
                        <p class="hero-subtitle words-white-custom" style="color: #ababab;" ><?= DESC_SERVICE ?></p>
                        <p style="color: white;">Servizi per la valorizzazione del patrimonio informativo del <?= ENTE ?></p>
                    </div>
                    <div class="d-none d-md-block hero-tagline col-lg-4 fade-in-right delay-4">
                        <blockquote class="hero-quote">
                            <p>Inquadra un QR-CODE o esegui una RICERCA</p>
                            <p class="hero-quote-detail">Alberi, Manutenzioni.. — tutti i dati aperti attraverso interfacce semplificate</p>
                        </blockquote>
                        <div class="hero-features">
                            <div class="hero-feature-item text-white custom-icon-locate">
                                <svg class="icon icon-sm icon-primary ms-1 mb-1" aria-hidden="true"><use href="assets/dist/svg/sprites.svg#it-map-marker"></use></svg>
                                <span style="color: #ffffffd9;">Inquadra uno dei QR-code posti nel territorio</span>
                            </div>
                            <div class="hero-feature-item custom-icon-locate">
                                <svg class="icon icon-sm icon-primary ms-1 mb-1" aria-hidden="true"><use href="assets/dist/svg/sprites.svg#it-search"></use></svg>
                                <span style="color: #ffffffd9;">Ricerca tramite il form online</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </div>
</main>
<main id="main-content">
    <article class="py-5">
        <div class="container">
            <div class="col-12 col-lg-12">
                <div class="cmp-breadcrumbs " role="navigation">
                    <nav class="breadcrumb-container" aria-label="breadcrumb">
                        <ol class="breadcrumb p-0">
                            <li class="breadcrumb-item trail-begin">
                                <a href="<?= BASE_URL ?>">Home</a>
                            </li>
                            <li class="breadcrumb-item active">
                                <span class="separator">/
                                </span>
                            </li>
                            <li class="breadcrumb-item active">
                                <span class="separator">Cos'è
                                </span>
                            </li>
                        </ol>
                    </nav>
                </div>
            </div>
            <div class="row justify-content-center">
                <!-- COLONNA PRINCIPALE -->
                <div class="col-12 col-lg-8">
                    <div class="about-article mb-5">
                        <h1>Dalla gestione alla valorizzazione dei dati aperti</h1>
                        <p>
                            <b><?= NAME_SERVICE ?></b> è il nuovo strumento interattivo progettato per valorizzare il patrimonio informativo del <?= ENTE ?>.
                        </p>
                        <p>
                            Attraverso un insieme di servizi sarà possibile esplorare e analizzare gli OpenData comunali, con l'obiettivo di agevolare la trasparenza e semplificare il diritto di accesso dei cittadini alle informazioni pubbliche.
                        </p>
                        <p>
                            Lo strumento è rivolto a tutti coloro che desiderano conoscere il proprio comune attraverso dati ufficiali, aggiornati e liberamente accessibili.
                        </p>
                        <h2>
                            Sviluppo e riuso
                        </h2>
                        <p>
                            Lo strumento è stato progettato e sviluppato dal servizio Supporto alla Transizione Digitale del <?= ENTE ?>.
                        </p>
                        <p>
                            L'interfaccia è stata sviluppata tramite framework
                            <a class="read-more" rel="noreferrer" href="https://italia.github.io/bootstrap-italia/" target="_blank">
                                <span class="text">Bootstrap Italia (v2.18.1)</span>
                                <svg class="icon icon-sm icon-primary ms-1 mb-1" aria-hidden="true"><use href="assets/dist/svg/sprites.svg#it-external-link"></use></svg>
                            </a>.
                        </p>
                        <p>
                            Il codice è interamente open source con licenza 
                            <a class="read-more" rel="noreferrer" href="https://interoperable-europe.ec.europa.eu/licence/gnu-affero-general-public-license-v30" target="_blank">
                                <span class="text">AGPL-3.0</span>
                                <svg class="icon icon-sm icon-primary ms-1 mb-1" aria-hidden="true"><use href="assets/dist/svg/sprites.svg#it-external-link"></use></svg>
                            </a>
                             e pubblicato sul repository 
                            <a class="read-more" rel="noreferrer" href="https://github.com/ComuneMontelupoFiorentino" target="_blank">
                                <span class="text">GitHub</span>
                                <svg class="icon icon-sm icon-primary ms-1 mb-1" aria-hidden="true"><use href="assets/dist/svg/sprites.svg#it-external-link"></use></svg>
                            </a> del Comune. 
                        </p>
                        <h2>
                            Dati aperti
                        </h2>
                        <p>
                            Tutti i dataset utilizzati sono pubblici sotto licenze CC-BY 4.0 e liberamente fruibili, scaricabili e riutilizzabili dal portale 
                            <a class="read-more" href="https://dati.toscana.it/organization/comune-di-montelupo-fiorentino" target="_blank"><span class="text">Opendata</span><svg class="icon icon-sm icon-primary ms-1 mb-1" aria-hidden="true"><use href="assets/dist/svg/sprites.svg#it-external-link"></use></svg></a>
                        </p>

                        <p>
                            Tutti i dataset sono descritti da metadatati conformi al profilo nazionale DCAT-AP_IT e consultabili tramite apposite 
                            <a class="read-more" href="https://docs.ckan.org/en/2.10/api/" target="_blank"><span class="text">API</span><svg class="icon icon-sm icon-primary ms-1 mb-1" aria-hidden="true"><use href="assets/dist/svg/sprites.svg#it-external-link"></use></svg></a>
                        </p>
                        <h2>
                            Accessibilità e inclusione
                        </h2>
                        <p>L'interfaccia utente è stata sviluppata secondo le linee guida di design della Pubblica Amministrazione al fine di garantire coerenza con gli standard nazionali.</p>
                        <p>Grande attenzione è stata posta all'inclusione delle persone diversamente abili, con compatibilità per screen reader, navigazione da tastiera e rispetto dei criteri di accessibilità 
                            <a class="read-more" rel="noreferrer" href="https://www.w3.org/Translations/WCAG21-it/" target="_blank">
                                <span class="text">WCAG</span>
                                <svg class="icon icon-sm icon-primary ms-1 mb-1" aria-hidden="true"><use href="assets/dist/svg/sprites.svg#it-external-link"></use></svg>
                            </a>.
                        </p>
                        <p>L'accessibilità è stata valutata attraverso l’applicazione web
                            <a class="read-more" rel="noreferrer" href="https://mauve.isti.cnr.it/singleValidation.jsp" target="_blank">
                                <span class="text">MAUVE++</span>
                                <svg class="icon icon-sm icon-primary ms-1 mb-1" aria-hidden="true"><use href="assets/dist/svg/sprites.svg#it-external-link"></use></svg>
                            </a>
                        </p>
                    </div>
                </div>
                <!-- SIDEBAR -->
                <aside class="col-12 col-lg-4 mt-5 mt-lg-0" aria-label="Sidebar">
                    <div class="sticky-top" style="top: 2rem;">
                        <!-- TAG -->
                        <div class="card shadow-sm mb-4">
                            <div class="card-body p-4">

                                <h3 class="h6 text-uppercase text-muted mb-3">
                                    Parole chiave
                                </h3>

                                <div class="d-flex flex-wrap gap-2">
                                    <span class="custom-badge-key-word">Opendata</span>
                                    <span class="custom-badge-key-word">Servizi digitali</span>
                                    <span class="custom-badge-key-word">Innovazione PA</span>
                                    <span class="custom-badge-key-word"><?= ENTE ?></span>
                                    <span class="custom-badge-key-word">PROSIT</span>
                                    <span class="custom-badge-key-word">Bootstrap Italia</span>
                                </div>
                            </div>
                        </div>
                        <!-- RISORSE -->
                        <div class="card shadow-sm">
                            <div class="card-body p-4">

                                <h3 class="h6 text-uppercase text-muted mb-3">
                                    Risorse correlate
                                </h3>

                                <ul class="list-unstyled mb-0">
                                    <li class="mb-2">
                                        <a href="https://designers.italia.it/" target="_blank" rel="noopener noreferrer">
                                            Designers Italia
                                            <svg class="icon icon-sm icon-primary ms-1 mb-1" aria-hidden="true">
                                                <use href="assets/dist/svg/sprites.svg#it-external-link"></use>
                                            </svg>
                                        </a>
                                    </li>
                                    <li class="mb-2">
                                        <a href="https://italia.github.io/bootstrap-italia/" target="_blank" rel="noopener noreferrer">
                                            Bootstrap Italia
                                            <svg class="icon icon-sm icon-primary ms-1 mb-1" aria-hidden="true">
                                                <use href="assets/dist/svg/sprites.svg#it-external-link"></use>
                                            </svg>
                                        </a>
                                    </li>
                                    <li class="mb-2">
                                        <a href="https://www.dati.gov.it/fare-open-data/Strumenti-per-gli-Open-Data" target="_blank" rel="noopener noreferrer">
                                            Dati.gov
                                            <svg class="icon icon-sm icon-primary ms-1 mb-1" aria-hidden="true">
                                                <use href="assets/dist/svg/sprites.svg#it-external-link"></use>
                                            </svg>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    </article>
</main>