function checkEmbedMode() {
  const params = new URLSearchParams(window.location.search);
  const isEmbed = params.get('embed') === 'true';

  if (isEmbed) {
    // Nasconde tutti gli elementi del body
    document.querySelectorAll('body *').forEach(el => {
      el.style.display = 'none';
    });

    // Mostra solo quelli con classe embed-visible (e i loro genitori/discendenti)
    document.querySelectorAll('.embed-visible').forEach(el => {
      el.style.display = '';

      // Rende visibili anche tutti i discendenti
      el.querySelectorAll('*').forEach(child => {
        child.style.display = '';
      });

      // Rende visibili i genitori, altrimenti l'elemento resterebbe
      // "visibile" ma dentro contenitori con display:none
      let parent = el.parentElement;
      while (parent && parent !== document.body) {
        parent.style.display = '';
        parent = parent.parentElement;
      }
    });
  }
}

// Esegui al caricamento della pagina
document.addEventListener('DOMContentLoaded', function() {
    // 1. Esegui la tua funzione preesistente
    if (typeof checkEmbedMode === 'function') {
        checkEmbedMode();
    }

    // 2. AGGIUNTA PER ACCESSIBILITÀ: Gestione tastiera per il DIV che apre la modale
    var embedBtn = document.getElementById('embedURL');
    if (embedBtn) {
        embedBtn.addEventListener('keydown', function (e) {
            // Se l'utente preme Invio (Enter) o Barra Spaziatrice (Space)
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault(); // Evita lo scroll della pagina con lo Spazio
                
                // Recupera l'istanza della modale Bootstrap (nota l'ID corretto senza &)
                var modalElement = document.getElementById('CopyPasteEmbed');
                if (modalElement) {
                    var modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
                    modalInstance.show();
                }
            }
        });
    }

    // 3. Gestione del click sul bottone di copia SENZA codice inline
    var btnCopy = document.getElementById('btnCopy');
    if (btnCopy) {
        btnCopy.addEventListener('click', function() {
            // Chiamiamo la tua funzione passando 'this' (che qui è btnCopy)
            copiaCodice(this);
        });
    }
});

// --- La tua ottima funzione di copia (Invariata e funzionante) ---
function copiaCodice(btn) {
    try {
        const value = document.getElementById('iframeEmbed').value;
        const icon = btn.querySelector('use');

        function feedback(ok) {
            if (!icon) return; 
            
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

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(value)
                .then(() => feedback(true))
                .catch(() => eseguiFallbackTablet(value, feedback, btn));
            return;
        }
        
        eseguiFallbackTablet(value, feedback, btn);

    } catch (erroreGenerale) {
        console.error('Errore globale nella funzione di copia:', erroreGenerale);
        btn.style.backgroundColor = '#b00020';
        const icon = btn.querySelector('use');
        if (icon) icon.setAttribute('href', 'assets/dist/svg/sprites.svg#it-close');
        setTimeout(() => { btn.style.backgroundColor = ''; if(icon) icon.setAttribute('href', 'assets/dist/svg/sprites.svg#it-copy'); }, 2000);
    }
}

// --- Il tuo fallback per Tablet e contesti non-HTTPS (Invariato) ---
function eseguiFallbackTablet(testo, callback, btn) {
    const textArea = document.createElement("textarea");
    textArea.value = testo;
    
    textArea.setAttribute('readonly', '');
    textArea.setAttribute('inputmode', 'none'); 
    textArea.style.position = 'absolute';
    textArea.style.opacity = '0';
    textArea.style.fontSize = '12pt'; 

    btn.parentNode.appendChild(textArea);
    
    textArea.focus();
    textArea.select();

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

    btn.parentNode.removeChild(textArea);
}