<!-- Modal -->
<div class="modal fade" tabindex="-1" role="dialog" id="modalSegnalazione" aria-labelledby="confermaSegnalazione">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <svg class="icon" aria-labelledby="titolo-svg" role="img"><title id="titolo-svg">Testo alternativo per la svg</title><use href="assets/dist/svg/sprites.svg#it-info-circle"></use></svg>
                
                <button class="btn-close" type="button" data-bs-dismiss="modal" aria-label="Chiudi finestra modale">
                    <svg class="icon"><use href="assets/dist/svg/sprites.svg#it-close"></use></svg>
                </button>
            </div>
            <div class="modal-body">
                <p>Ricordati di inserire l'ID nel titolo o nei dettagli della segnalazione in modo da favorire l'identificazione</p>
                <div class="input-group mb-3">
                    <input type="text" class="form-control" id="idOBJ" value="ABC123456" readonly>
                    <button id="btnCopy" class="btn btn-primary" type="button" onclick="copiaCodice(this)">
                        <svg class="icon icon-copy-costum"><use href="assets/dist/svg/sprites.svg#it-copy"></use></svg>
                    </button>
                </div>
            </div>
            <div class="modal-footer modal-footer-shadow">
                <button class="btn btn-outline-primary btn-sm" type="button" data-bs-dismiss="modal">Annulla</button>
                <a href="https://www.comune.montelupo-fiorentino.fi.it/home/segnalazione-disservizio/">
                    <button class="btn btn-primary btn-sm" type="button">Continua</button>
                </a>
            </div>
        </div>
    </div>
</div>

<!-- Segnalazione -->
<section class="hero-search py-4">
    <div class="container">
        <div class="row d-flex justify-content-center">
            <div class="col-12 col-lg-6 p-lg-0 px-3">
                <div id="rating" class="card w-100">
                    <div class="card-body">
                        <h2 class="title-medium-2-semi-bold mb-0">Problemi?</h2>
                        <ul class="contact-list p-0">
                            <li>
                                <a class="list-item" type="button" data-bs-toggle="modal" data-bs-target="#modalSegnalazione">
                                    <svg class="icon"><use href="assets/dist/svg/sprites.svg#it-map-marker-circle"></use></svg>
                                    <span class="span-custom">Segnala un disservizio</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- cambia bottone copy nel modale -->
<script>
function copiaCodice(btn) {
    try {
        const value = document.getElementById('idOBJ').value;
        const icon = btn.querySelector('use');

        function feedback(ok) {
            if (!icon) return; // Sicurezza nel caso l'elemento 'use' non venga trovato
            
            icon.setAttribute('href',
                ok
                    ? 'assets/dist/svg/sprites.svg#it-check'
                    : 'assets/dist/svg/sprites.svg#it-close'
            );

            btn.style.backgroundColor = ok ? '#008055' : '#b00020';

            setTimeout(() => {
                icon.setAttribute('href', 'assets/dist/svg/sprites.svg#it-copy');
                btn.style.backgroundColor = '';
            }, 2000);
        }

        // 1. Prova con la Clipboard API moderna (funziona solo su PC o sotto HTTPS)
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(value)
                .then(() => feedback(true))
                .catch(() => eseguiFallbackTablet(value, feedback, btn));
            return;
        }
        
        // 2. Se non supportato o HTTP non sicuro, vai al fallback per tablet/mobile
        eseguiFallbackTablet(value, feedback, btn);

    } catch (erroreGenerale) {
        console.error('Errore globale nella funzione di copia:', erroreGenerale);
        // Forza il feedback visivo di errore sul pulsante
        btn.style.backgroundColor = '#b00020';
        const icon = btn.querySelector('use');
        if (icon) icon.setAttribute('href', 'assets/dist/svg/sprites.svg#it-close');
        setTimeout(() => { btn.style.backgroundColor = ''; if(icon) icon.setAttribute('href', 'assets/dist/svg/sprites.svg#it-copy'); }, 2000);
    }
}

// Funzione di fallback specifica per Tablet e contesti non-HTTPS
function eseguiFallbackTablet(testo, callback, btn) {
    const textArea = document.createElement("textarea");
    textArea.value = testo;
    
    // Configurazione invisibilità e blocco tastiera virtuale
    textArea.setAttribute('readonly', '');
    textArea.setAttribute('inputmode', 'none'); 
    textArea.style.position = 'absolute';
    textArea.style.opacity = '0';
    textArea.style.fontSize = '12pt'; // Previene lo zoom selvaggio su Safari iOS

    // Inietta la textarea dentro il modale (parent del bottone) per aggirare i blocchi del focus
    btn.parentNode.appendChild(textArea);
    
    // Selezione del testo
    textArea.focus();
    textArea.select();

    // Forza la selezione profonda per iPad / iPhone / Safari Mobile
    if (navigator.userAgent.match(/ipad|ipod|iphone|macintosh/i)) {
        const range = document.createRange();
        range.selectNodeContents(textArea);
        const select = window.getSelection();
        select.removeAllRanges();
        select.addRange(range);
        textArea.setSelectionRange(0, 999999);
    }

    try {
        const successo = document.execCommand('copy');
        callback(successo);
    } catch (err) {
        console.error('Errore execCommand su tablet:', err);
        callback(false);
    }

    // Rimuove l'elemento temporaneo
    btn.parentNode.removeChild(textArea);
}
</script>