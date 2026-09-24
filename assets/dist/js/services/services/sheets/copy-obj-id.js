/*!
 * copy-obj-id.js
 * =============================================================================
 * Gestisce il pulsante "copia" (#btnCopy) nel modale di segnalazione
 * (#modalSegnalazione): copia il valore di #idOBJ negli appunti.
 * Il pulsante #continueToSegn resta disabilitato finche' la copia
 * non va a buon fine.
 *
 * Contenuto qui, in un file ESTERNO caricato con <script src="..." defer>,
 * invece che inline nella pagina: con una Content-Security-Policy che
 * richiede un nonce per gli script inline ("script-src-elem 'nonce-...'"),
 * uno <script> senza quell'attributo viene bloccato dal browser (e il nonce
 * cambia a ogni risposta, quindi non e' qualcosa che si possa scrivere a
 * mano una volta per tutte). Un file esterno servito dallo stesso dominio e'
 * invece sempre permesso da "script-src 'self'", senza bisogno di nonce.
 * =============================================================================
 */
(function () {
  'use strict';

  // Il pulsante "Continua" e' disabilitato finche' la copia non riesce.
  var btnContinue = document.getElementById('continueToSegn');
  if (btnContinue) {
    btnContinue.disabled = true;
  }

 // Il pulsante "Continua" naviga solo se non e' disabilitato (cioe' solo
  // dopo una copia riuscita). Niente <a> attorno al bottone: se il click
  // arrivasse comunque a un link statico, verrebbe seguito anche a bottone
  // disabilitato (l'attributo disabled del <button> non blocca un <a> che
  // lo racchiude).
  if (btnContinue) {
    btnContinue.addEventListener('click', function () {
      if (!btnContinue.disabled) {
        window.location.href = 'https://www.comune.montelupo-fiorentino.fi.it/home/segnalazione-disservizio/';
      }
    });
  }

  function feedbackOn(btn, icon, ok) {
    if (icon) {
      icon.setAttribute('href', ok
        ? 'assets/dist/svg/sprites.svg#it-check'
        : 'assets/dist/svg/sprites.svg#it-close');
    }
    btn.style.backgroundColor = ok ? '#008055' : '#b00020';
    // Sblocco il pulsante "Continua" solo se la copia e' andata a buon fine.
    if (ok && btnContinue) {
      btnContinue.disabled = false;
    }
    setTimeout(function () {
      if (icon) icon.setAttribute('href', 'assets/dist/svg/sprites.svg#it-copy');
      btn.style.backgroundColor = '';
    }, 2000);
  }

  // Fallback per tablet/mobile o contesti non-HTTPS, dove la Clipboard API
  // moderna non e' disponibile: crea una textarea temporanea, seleziona il
  // testo (con gestione specifica per Safari iOS/iPadOS) e usa
  // document.execCommand('copy').
  function eseguiFallbackTablet(testo, callback, btn) {
    var textArea = document.createElement('textarea');
    textArea.value = testo;
    textArea.setAttribute('readonly', '');
    textArea.setAttribute('inputmode', 'none');
    textArea.style.position = 'absolute';
    textArea.style.opacity = '0';
    textArea.style.fontSize = '12pt'; // previene lo zoom automatico su Safari iOS
    btn.parentNode.appendChild(textArea);
    textArea.focus();
    textArea.select();
    if (navigator.userAgent.match(/ipad|ipod|iphone|macintosh/i)) {
      var range = document.createRange();
      range.selectNodeContents(textArea);
      var select = window.getSelection();
      select.removeAllRanges();
      select.addRange(range);
      textArea.setSelectionRange(0, 999999);
    }
    try {
      var successo = document.execCommand('copy');
      callback(successo);
    } catch (err) {
      console.error('Errore execCommand su tablet:', err);
      callback(false);
    }
    btn.parentNode.removeChild(textArea);
  }

  function copiaCodice(btn) {
    try {
      var input = document.getElementById('idOBJ');
      if (!input) return;
      var value = input.value;
      var icon = btn.querySelector('use');
      function feedback(ok) { feedbackOn(btn, icon, ok); }
      // 1. Clipboard API moderna (solo su PC o sotto HTTPS)
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(value)
          .then(function () { feedback(true); })
          .catch(function () { eseguiFallbackTablet(value, feedback, btn); });
        return;
      }
      // 2. Fallback per tablet/mobile o HTTP non sicuro
      eseguiFallbackTablet(value, feedback, btn);
    } catch (erroreGenerale) {
      console.error('Errore globale nella funzione di copia:', erroreGenerale);
      var icon2 = btn.querySelector('use');
      feedbackOn(btn, icon2, false);
    }
  }

  // Aggancio il click al pulsante "copia" del modale di segnalazione.
  // Script con "defer": esegue dopo il parsing dell'HTML, quindi #btnCopy
  // esiste gia' nel DOM a questo punto (e' markup statico, non generato
  // dinamicamente), non serve attendere DOMContentLoaded.
  var btnCopy = document.getElementById('btnCopy');
  if (btnCopy) {
    btnCopy.addEventListener('click', function () { copiaCodice(btnCopy); });
  }
})();
