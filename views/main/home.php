
<!-- Sezione Hero con Ricerca -->
<section class="py-4">
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-12 col-lg-12" style="display:none;">
                <div class="cmp-breadcrumbs " role="navigation">
                    <nav class="breadcrumb-container" aria-label="breadcrumb">
                        <ol class="breadcrumb p-0">
                            <li class="breadcrumb-item trail-begin">
                                <a href="<?= BASE_URL ?>" title="home">Home</a>
                            </li>
                            <li class="breadcrumb-item active">
                                <span class="separator">/
                                </span>
                            </li>
                            <li class="breadcrumb-item active">
                                <span class="separator">Ricerca
                                </span>
                            </li>
                        </ol>
                    </nav>
                </div>
            </div>
            <div class="col-12"> <h1 class="mb-4">Scopri i servizi</h1>
                <p id="resuls" style="display:none;">
                        Trovati <span id="countResults">0</span> risultati 
                </p>
                
                <div class="row g-4 loader" data-loader data-renderer="servizi" data-url="<?= $servicesUrl ?>" data-skeleton-count="2" data-delay="1000">
                    
                    <template data-skeleton>
                        <div class="col-md-6 col-lg-4"> <div class="card-wrapper"><div class="card card-costum"><div class="card-body">
                                <div class="skeleton skeleton-icon"></div>
                                <div class="skeleton skeleton-title"></div>
                                <div class="skeleton skeleton-text"></div>
                                <div class="skeleton skeleton-text short"></div>
                                <div class="skeleton skeleton-link"></div>
                            </div></div></div>
                        </div>
                    </template>

                    <div class="row g-4" data-loader-items></div>

                    <div class="loader-empty"><p class="text-muted">Nessun servizio disponibile.</p></div>
                    <div class="loader-error"><p class="text-muted">Impossibile caricare i servizi.</p></div>
                </div>
            </div>
        </div>
    </div>
</section>
