
    <a href="#" aria-label="Torna su" data-bs-toggle="backtotop" title="Torna su" class="back-to-top" id="example">
        <svg class="icon icon-light"><use href="assets/dist/svg/sprites.svg#it-arrow-up"></use></svg>
    </a>

    <!-- Footer -->
    <footer class="it-footer">
        <div class="it-footer-main">
            <div class="container">
            <section>
                <div class="row clearfix">
                <div class="col-sm-12">
                    <div class="it-brand-wrapper">
                    <a title="<?= NAME_SERVICE ?>" href="https://www.comune.montelupo-fiorentino.fi.it/comune-in-chiaro/">
                        <svg width="82" height="82" class="icon" aria-hidden="true">       
                            <image xlink:href="<?= BASE_URL ?>assets/dist/logo.png" title="logo" width="50" height="50"></image>    
                        </svg>
                        <div class="it-brand-text">
                        <h2 class="no_toc"><?= NAME_SERVICE ?></h2>
                        <p class="h3 no_toc d-none d-md-block"><?= DESC_SERVICE ?></p>
                        </div>
                    </a>
                    </div>
                </div>
                </div>
            </section>
            <section class="py-4 border-white border-top">
                <div class="row">
                <div class="col-lg-8 col-md-8 pb-2">
                    <h3 class="no_toc">Contatti</h3>
                    <p>
                    Viale Cento Fiori, 34 – 50056 Montelupo Fiorentino (FI) 
                    </p>
                    <p>Codice fiscale / P. IVA:00614510485</p>
                    <p>PEC: comune.montelupo-fiorentino@postacert.toscana.it</p>
                    <div class="link-list-wrapper">
                    <ul class="footer-list link-list clearfix">
                        <li>
                        <a class="list-item" href="https://www.comune.montelupo-fiorentino.fi.it/amministrazione/unita_organizzativa/supporto-alla-transizione-digitale-e-sistema-informativo-territoriale/" title="Vai alla pagina: URP - Ufficio Relazioni con il Pubblico">
                            Ufficio Supporto alla Transizione Digitale</a>
                        </li>
                    </ul>
                    </div>
                </div>
                <div class="col-lg-4 col-md-4 pb-2">
                    <div class="pb-2">
                    <h3 class="no_toc">Progetto</h3>
                    <ul class="footer-list link-list clearfix">
                        <li>
                            <a class="p-2 text-white" href="<?= BASE_URL ?>?main=about" title="About" target="_blank">About</a>
                        </li>
                        <li>
                            <a class="p-2 text-white" href="https://github.com/ComuneMontelupoFiorentino/comune-in-chiaro" title="GitHub" target="_blank">GitHub</a>
                        </li>
                        <li>
                            <a class="p-2 text-white" href="https://form.agid.gov.it/view/eb222cc0-b937-11ef-92a6-495355065ba9" title="Dichiarazione accessibilità" target="_blank">Accessibilità</a>
                        </li>
                    </ul>
                    </div>
                </div>
                </div>
            </section>
            </div>
        </div>
        <div class="it-footer-small-prints clearfix">
            <div class="container">
            <ul class="it-footer-small-prints-list list-inline mb-0 d-flex flex-column flex-md-row">
                <li class="list-inline-item"><a href="https://www.comune.montelupo-fiorentino.fi.it/" title="<?= ENTE ?>" target="_blank">© 2026 <?= ENTE ?></a></li>
                <li class="list-inline-item"><a href="https://creativecommons.org/licenses/by/4.0/deed.it" title="Contenuti CC-BY 4.0" target="_blank">Contenuti CC-BY 4.0</a></li>
                <li class="list-inline-item"><a href="https://interoperable-europe.ec.europa.eu/licence/gnu-affero-general-public-license-v30" title="Codice AGPL-3.0" target="_blank">Codice AGPL-3.0</a></li>
                <li class="list-inline-item"><a href="https://www.comune.montelupo-fiorentino.fi.it/privacy-policy/" title="Privacy Policy" target="_blank">Privacy Policy</a></li>
            </ul>
            </div>
        </div>
    </footer>

    <!-- Bootstrap Italia JS Bundle -->
    <script src="<?= BASE_URL ?>assets/dist/js/bootstrap-italia.bundle.min.js"></script>

    <!-- Dichiaro una volta BASE_URL -->
    <script src="<?= BASE_URL ?>assets/dist/js/utilities.js" defer></script>

    <!-- Loader skeleton -->
    <script src="<?= BASE_URL ?>assets/dist/js/loader/loader.js?v=8" defer></script>

    <!-- JS per main -->
    <?php if ($main === 'home') { ?>
    <script src="<?= BASE_URL ?>assets/dist/js/loader/renderers.js?v=28" defer></script>
    <?php   }   ?>

    <!-- carico js se è un servizio -->
    <?php if ($isServiceValid || $isSheetValid) { ?>

        <script src="<?= BASE_URL ?>assets/dist/js/loader/service-renderer.js?v=27" defer></script>

        <?php if ($serviceAllowsEmbed) { ?> 
            <script src="<?= BASE_URL ?>assets/dist/js/embed.js?v=1" defer></script>
        <?php } ?>
        
    <?php   }   ?>

    <!-- costum js per pagina -->
    <?php
        $jsFile = ROOT . "/assets/dist/js/costum/custom-{$customJs}.js";

        if (file_exists($jsFile)) {
    ?>
    <script src="<?= BASE_URL ?>assets/dist/js/costum/custom-<?= htmlspecialchars($customJs) ?>.js?v=33"></script>
    <?php   }   ?>



</body>
</html>
