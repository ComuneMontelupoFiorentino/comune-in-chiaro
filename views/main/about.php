

<section class="hero-section hero-horizontal bg-primary fade-in delay-1" aria-label="Presentazione del servizio">
  <div class="hero-bg" aria-hidden="true">
      <div class="hero-gradient"></div>
      <div class="hero-pattern"></div>
  </div>
  <div class="container">
      <div class="row align-items-center">
          <div class="hero-tagline col-lg-6">
              <div class="h1 h1-section-custom words-white-custom delay-2">
                  <!-- DESKTOP -->
                  <div class="d-none d-md-block text-white">
                      <div class="it-brand-title text-white"><?= NAME_SERVICE ?></div>
                  </div>
                  <!-- MOBILE -->
                  <div class="d-block d-md-none text-white">
                      <div class="it-brand-title text-white" style="font-size: 2.5rem;"><?= NAME_SERVICE_SH ?></div>
                  </div>
                  <span class="d-none d-md-inline version-badge">
                      <span class="visually-hidden">Versione </span><?= VERSION_SERVICE ?>
                  </span>
              </div>
              <p class="hero-subtitle words-white-custom text-white"><?= DESC_SERVICE ?></p>
              <p class="text-white">Servizi per la valorizzazione del patrimonio informativo del <?= ENTE ?></p>
          </div>
          <div class="d-none d-md-block hero-tagline col-lg-4 fade-in-right delay-4">
              <blockquote class="hero-quote">
                  <p>Inquadra un QR-CODE o esegui una RICERCA</p>
                  <p class="hero-quote-detail">Alberi, Manutenzioni… — tutti i dati aperti attraverso interfacce semplificate</p>
              </blockquote>
              <ul class="hero-features list-unstyled">
                  <li class="hero-feature-item text-white">Inquadra uno dei QR-code posti nel territorio</li>
                  <li class="hero-feature-item text-white">Ricerca tramite il form online</li>
              </ul>
          </div>
      </div>
  </div>
</section>

<main id="main-content">
  <article class="py-5">
      <div class="container">
          <div class="col-12 col-lg-12">
              <div class="cmp-breadcrumbs">
                  <nav class="breadcrumb-container" aria-label="Percorso di navigazione">
                      <ol class="breadcrumb p-0">
                          <li class="breadcrumb-item">
                              <a href="<?= BASE_URL ?>">Home</a><span class="separator" aria-hidden="true">/</span>
                          </li>
                          <li class="breadcrumb-item active" aria-current="page">Cos'è</li>
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
                          <strong><?= NAME_SERVICE ?></strong> è il nuovo strumento interattivo progettato per valorizzare il patrimonio informativo del <?= ENTE ?>.
                      </p>
                      <p>
                          Attraverso un insieme di servizi sarà possibile esplorare e analizzare gli OpenData comunali, con l'obiettivo di agevolare la trasparenza e semplificare il diritto di accesso dei cittadini alle informazioni pubbliche.
                      </p>
                      <p>
                          Lo strumento è rivolto a tutti coloro che desiderano conoscere il proprio comune attraverso dati ufficiali, aggiornati e liberamente accessibili.
                      </p>

                      <h2>Sviluppo e riuso</h2>
                      <p>
                          Lo strumento è stato progettato e sviluppato dal servizio Supporto alla Transizione Digitale del <?= ENTE ?>.
                      </p>
                      <p>
                          L'interfaccia è stata sviluppata tramite framework
                          <a class="read-more" rel="noreferrer" href="https://italia.github.io/bootstrap-italia/" target="_blank">Bootstrap Italia (v2.18.1)<svg class="icon icon-sm icon-primary ms-1 mb-1" role="img" aria-label="(apre in una nuova finestra)" focusable="false"><use href="assets/dist/svg/sprites.svg#it-external-link"></use></svg></a>.
                      </p>
                      <p>
                          Il codice è interamente open source con licenza
                          <a class="read-more" rel="noreferrer" href="https://interoperable-europe.ec.europa.eu/licence/gnu-affero-general-public-license-v30" target="_blank">AGPL-3.0<svg class="icon icon-sm icon-primary ms-1 mb-1" role="img" aria-label="(apre in una nuova finestra)" focusable="false"><use href="assets/dist/svg/sprites.svg#it-external-link"></use></svg></a>
                          e pubblicato sul repository
                          <a class="read-more" rel="noreferrer" href="https://github.com/ComuneMontelupoFiorentino" target="_blank">GitHub<svg class="icon icon-sm icon-primary ms-1 mb-1" role="img" aria-label="(apre in una nuova finestra)" focusable="false"><use href="assets/dist/svg/sprites.svg#it-external-link"></use></svg></a>
                          del Comune.
                      </p>

                      <h2>Dati aperti</h2>
                      <p>
                          Tutti i dataset utilizzati sono pubblici sotto licenza CC-BY 4.0 e liberamente fruibili, scaricabili e riutilizzabili dal portale
                          <a class="read-more" rel="noreferrer" href="https://dati.toscana.it/organization/comune-di-montelupo-fiorentino" target="_blank">Opendata<svg class="icon icon-sm icon-primary ms-1 mb-1" role="img" aria-label="(apre in una nuova finestra)" focusable="false"><use href="assets/dist/svg/sprites.svg#it-external-link"></use></svg></a>.
                      </p>
                      <p>
                          Tutti i dataset sono descritti da metadati conformi al profilo nazionale DCAT-AP_IT e consultabili tramite apposite
                          <a class="read-more" rel="noreferrer" href="https://docs.ckan.org/en/2.10/api/" target="_blank">API<svg class="icon icon-sm icon-primary ms-1 mb-1" role="img" aria-label="(apre in una nuova finestra)" focusable="false"><use href="assets/dist/svg/sprites.svg#it-external-link"></use></svg></a>.
                      </p>

                      <h2>Accessibilità e inclusione</h2>
                      <p>L'interfaccia utente è stata sviluppata secondo le linee guida di design della Pubblica Amministrazione al fine di garantire coerenza con gli standard nazionali.</p>
                      <p>
                          Grande attenzione è stata posta all'inclusione delle persone con disabilità, con compatibilità per screen reader, navigazione da tastiera e rispetto dei criteri di accessibilità
                          <a class="read-more" rel="noreferrer" href="https://www.w3.org/Translations/WCAG21-it/" target="_blank">WCAG 2.1<svg class="icon icon-sm icon-primary ms-1 mb-1" role="img" aria-label="(apre in una nuova finestra)" focusable="false"><use href="assets/dist/svg/sprites.svg#it-external-link"></use></svg></a>.
                      </p>
                      <p>L'accessibilità è stata valutata tramite test automatici attraverso le applicazioni:</p>
                      <ul>
                          <li><a class="read-more" rel="noreferrer" href="https://mauve.isti.cnr.it/singleValidation.jsp" target="_blank">MAUVE++<svg class="icon icon-sm icon-primary ms-1 mb-1" role="img" aria-label="(apre in una nuova finestra)" focusable="false"><use href="assets/dist/svg/sprites.svg#it-external-link"></use></svg></a></li>
                          <li><a class="read-more" rel="noreferrer" href="https://wave.webaim.org/" target="_blank">WAVE<svg class="icon icon-sm icon-primary ms-1 mb-1" role="img" aria-label="(apre in una nuova finestra)" focusable="false"><use href="assets/dist/svg/sprites.svg#it-external-link"></use></svg></a></li>
                          <li><a class="read-more" rel="noreferrer" href="https://developer.chrome.com/docs/lighthouse/overview?hl=it" target="_blank">Lighthouse<svg class="icon icon-sm icon-primary ms-1 mb-1" role="img" aria-label="(apre in una nuova finestra)" focusable="false"><use href="assets/dist/svg/sprites.svg#it-external-link"></use></svg></a></li>
                      </ul>
                      <p>e attraverso test manuali riguardanti lo scorrimento della pagina, la gestione del focus da tastiera sui campi di testo e sui collegamenti, e la prova di lettura assistita tramite il browser Google Chrome.</p>
                  </div>
              </div>

              <!-- SIDEBAR -->
              <aside class="col-12 col-lg-4 mt-5 mt-lg-0" aria-label="Informazioni correlate">
                  <div class="sticky-top" style="top: 2rem;">

                      <!-- PAROLE CHIAVE -->
                      <div class="card shadow-sm mb-4">
                          <div class="card-body p-4">
                              <h2 class="h6 text-uppercase text-muted mb-3">Parole chiave</h2>
                              <ul class="list-inline d-flex flex-wrap gap-2 mb-0">
                                  <li class="list-inline-item me-0"><span class="badge bg-light text-dark border">Opendata</span></li>
                                  <li class="list-inline-item me-0"><span class="badge bg-light text-dark border">Servizi digitali</span></li>
                                  <li class="list-inline-item me-0"><span class="badge bg-light text-dark border">Innovazione PA</span></li>
                                  <li class="list-inline-item me-0"><span class="badge bg-light text-dark border"><?= ENTE ?></span></li>
                                  <li class="list-inline-item me-0"><span class="badge bg-light text-dark border">PROSIT</span></li>
                                  <li class="list-inline-item me-0"><span class="badge bg-light text-dark border">Bootstrap Italia</span></li>
                              </ul>
                          </div>
                      </div>

                      <!-- RISORSE CORRELATE -->
                      <div class="card shadow-sm">
                          <div class="card-body p-4">
                              <h2 class="h6 text-uppercase text-muted mb-3">Risorse correlate</h2>
                              <ul class="list-unstyled mb-0">
                                  <li class="mb-2"><a href="https://designers.italia.it/" target="_blank" rel="noopener noreferrer">Designers Italia<svg class="icon icon-sm icon-primary ms-1 mb-1" role="img" aria-label="(apre in una nuova finestra)" focusable="false"><use href="assets/dist/svg/sprites.svg#it-external-link"></use></svg></a></li>
                                  <li class="mb-2"><a href="https://italia.github.io/bootstrap-italia/" target="_blank" rel="noopener noreferrer">Bootstrap Italia<svg class="icon icon-sm icon-primary ms-1 mb-1" role="img" aria-label="(apre in una nuova finestra)" focusable="false"><use href="assets/dist/svg/sprites.svg#it-external-link"></use></svg></a></li>
                                  <li class="mb-2"><a href="https://www.dati.gov.it/fare-open-data/Strumenti-per-gli-Open-Data" target="_blank" rel="noopener noreferrer">Dati.gov<svg class="icon icon-sm icon-primary ms-1 mb-1" role="img" aria-label="(apre in una nuova finestra)" focusable="false"><use href="assets/dist/svg/sprites.svg#it-external-link"></use></svg></a></li>
                              </ul>
                          </div>
                      </div>

                  </div>
              </aside>
          </div>
      </div>
  </article>
</main>
