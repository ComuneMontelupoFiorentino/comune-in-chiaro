
<section class="hero-search py-4">
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-12 col-lg-10">
                <div class="callout note">
                    <div class="callout-inner">
                        <div class="callout-title">
                            <svg class="icon"><use href="assets/dist/svg/sprites.svg#it-info-circle"></use></svg>
                            <span class="visually-hidden">Note</span> 
                            <span class="text">Note sui dati</span>
                        </div>
                        <span>Tutti i dataset usati in questo servizio sono consultabili e scaricabili in formato aperto sul 
                            <a href="https://dati.toscana.it/organization/comune-di-montelupo-fiorentino" target="_blank">PORTALE OPENDATA<svg class="icon icon-primary icon-sm"><use href="assets/dist/svg/sprites.svg#it-external-link"></use></svg>
                            </a>
                        </span><br><br><br>
                        <ul class="">
                            <li>
                                <a class="list-item read-more" href="#" role="button" data-bs-toggle="modal" data-bs-target="#modalDataset">
                                    <span class="span-custom read-more">Elenco dei Dataset usati in questo servizio
                                        <svg class="icon icon-sm icon-primary ms-1 mb-1"><use href="assets/dist/svg/sprites.svg#it-chart-line"></use></svg>
                                    </span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Modal DATASET-->
<div class="modal fade" tabindex="-1" role="dialog" id="modalDataset" aria-labelledby="confermaSegnalazione">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <svg class="icon" aria-labelledby="titolo-svg" role="img"><title id="titolo-svg">Ricorda di inserire l'ID nel titolo o nei dettagli della segnalazione</title><use href="assets/dist/svg/sprites.svg#it-info-circle"></use></svg>
                Dataset usati
                <button class="btn-close" type="button" data-bs-dismiss="modal" aria-label="Chiudi finestra modale">
                    <svg class="icon"><use href="assets/dist/svg/sprites.svg#it-close"></use></svg>
                </button>
            </div>
            <div class="modal-body">
                <div class="link-list-wrapper">
                    <ul class="link-list" id="list-dataset-used">
                        
                    </ul>
                </div>
            </div>
            <div class="modal-footer modal-footer-shadow">
                <button class="btn btn-primary btn-sm" type="button" data-bs-dismiss="modal">Chiudi</button>
            </div>
        </div>
    </div>
</div>