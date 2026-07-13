'use strict';

window.Renderers = window.Renderers || {};

window.escH = function(v) {
    if (v === null || v === undefined) return '—';
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(String(v)));
    return d.innerHTML;
};

window.openSheetModal = async function(service, id, title) {
    const modal      = document.getElementById('dl-sheet-modal');
    const modalBody  = document.getElementById('dl-sheet-modal-body');
    const modalTitle = document.getElementById('dl-sheet-modal-title');
    if (!modal || !modalBody) return;

    if (title && modalTitle) modalTitle.textContent = title;

    modalBody.innerHTML = `
      <div class="text-center py-4">
        <div class="spinner-border" style="color:#a61c20;" role="status">
          <span class="visually-hidden">Caricamento…</span>
        </div>
      </div>`;

    bootstrap.Modal.getOrCreateInstance(modal).show();

    try {
        const base = (window.DL_CONFIG?.apiBase ?? '?output=json');
        const url  = `${base}&service=${encodeURIComponent(service)}&type=sheet&id=${encodeURIComponent(id)}`;
        const res  = await fetch(url, { credentials: 'omit', headers: { Accept: 'application/json' } });
        const data = await res.json();
        if (!data.success) throw new Error(data.error ?? 'Errore API');
        modalBody.innerHTML = '';
        window.Renderers.sheet(modalBody, data.data ?? [], data.view_config ?? {});
    } catch (e) {
        modalBody.innerHTML = `<div class="alert alert-danger">Errore: ${escH(e.message)}</div>`;
    }
};

document.addEventListener('DOMContentLoaded', async function() {
    if (window._DL_INIT) return;
    window._DL_INIT = true;

    const cfg = window.DL_CONFIG;
    if (!cfg || !cfg.service || !cfg.type) return;

    const container = document.getElementById('dl-container');
    const loading   = document.getElementById('dl-loading');
    const loadMsg   = document.getElementById('dl-loading-msg');

    function setLoading(active, msg) {
        if (loading)   loading.classList.toggle('d-none', !active);
        if (container) container.classList.toggle('d-none', active);
        if (loadMsg && msg) loadMsg.textContent = msg;
    }

    function showError(msg) {
        setLoading(false);
        if (container) {
            container.classList.remove('d-none');
            container.innerHTML = `
              <div class="alert alert-danger d-flex align-items-center gap-2" role="alert">
                <div><strong>Errore:</strong> ${escH(msg)}</div>
              </div>`;
        }
    }

    setLoading(true, 'Recupero dati da OpenData Toscana…');

    try {
        const pageParams = new URLSearchParams(location.search);
        const apiParams  = new URLSearchParams({
            output:  'json',
            service: cfg.service,
            type:    cfg.type,
        });

        ['id', 'filter', 'bbox', 'page', 'limit'].forEach(k => {
            if (pageParams.has(k)) apiParams.set(k, pageParams.get(k));
        });

        const res = await fetch('?' + apiParams.toString(), {
            credentials: 'omit',
            headers: { Accept: 'application/json' }
        });

        const payload = await res.json().catch(() => ({
            success: false, error: `HTTP ${res.status}`
        }));

        if (!payload.success) throw new Error(payload.error ?? 'Risposta non valida');

        const renderer = window.Renderers[payload.type];
        if (!renderer) { showError(`Renderer '${payload.type}' non trovato`); return; }

        // Rendi visibile il container PRIMA del renderer
        // così Leaflet trova il div con dimensioni reali
        if (loading)   loading.classList.add('d-none');
        if (container) container.classList.remove('d-none');

        await renderer(container, payload.data ?? [], payload.view_config ?? {}, payload.meta ?? {});

    } catch (e) {
        showError(e.message);
    }
});