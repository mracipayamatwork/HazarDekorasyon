/* =========================================================
   Hazar Dekorasyon — Fiyat Hesaplama
   Fiyatlar admin panelinden yönetilir ve sayfaya
   window.HAZAR_PRICING olarak gömülür.
   ========================================================= */
(function () {
  const { $, $$, wa } = window.Hazar;
  const { SETTINGS, money } = window.HazarData;
  const SERVICES = window.HAZAR_PRICING || [];
  const OPENING_M2 = 1.8;
  const UNIT_LABEL = { wall: 'm²', ceiling: 'm²', perimeter: 'mt', piece: 'adet', fixed: '' };
  const num = (v) => {
    const n = parseFloat(String(v).replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n : 0;
  };
  const fmt = (n, d = 1) => n.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: d });

  // Durum
  const state = { selected: new Map() }; // serviceId -> { main: optionId, extras: Map(optionId -> qty) }

  /* ---------- Hizmet kartları ---------- */
  const box = $('[data-services]');
  if (!SERVICES.length) {
    box.innerHTML = '<p class="dims__note">Şu anda fiyatlandırması yapılmış hizmet bulunmuyor.</p>';
  }
  SERVICES.forEach((s, si) => {
    const mains = s.options.filter((o) => o.kind === 'main');
    const extras = s.options.filter((o) => o.kind === 'extra');
    const el = document.createElement('div');
    el.className = 'spick';
    el.dataset.id = s.id;
    el.innerHTML = `
      <label class="spick__head">
        <input type="checkbox" data-svc="${s.id}" />
        <span class="spick__check"></span>
        <span class="spick__title"><b>${esc(s.name)}</b>${s.description ? `<small>${esc(s.description)}</small>` : ''}</span>
        <span class="spick__from">${money(Math.min(...mains.map((o) => o.price)))}<i>'den başlayan</i></span>
      </label>
      <div class="spick__body">
        <div class="spick__group">
          <small>Seçenek</small>
          <div class="opts">
            ${mains.map((o, i) => `
              <label class="opt">
                <input type="radio" name="main-${s.id}" value="${o.id}" ${i === 0 ? 'checked' : ''} />
                <span><b>${esc(o.name)}</b>${o.description ? `<em>${esc(o.description)}</em>` : ''}<i>${money(o.price)} / ${UNIT_LABEL[o.unit] || 'birim'}</i></span>
              </label>`).join('')}
          </div>
        </div>
        ${extras.length ? `
        <div class="spick__group">
          <small>Ek seçenekler</small>
          <div class="extras">
            ${extras.map((o) => `
              <label class="extra">
                <input type="checkbox" value="${o.id}" data-extra="${o.id}" />
                <span class="box"></span>
                <span class="extra__name">${esc(o.name)}${o.description ? `<em>${esc(o.description)}</em>` : ''}</span>
                ${o.unit === 'piece' ? `<input class="extra__qty" type="number" min="1" max="200" value="4" data-qty="${o.id}" aria-label="Adet" />` : ''}
                <span class="extra__price">${money(o.price)}${UNIT_LABEL[o.unit] ? ' / ' + UNIT_LABEL[o.unit] : ''}</span>
              </label>`).join('')}
          </div>
        </div>` : ''}
      </div>`;
    box.appendChild(el);
    if (si === 0) {
      $('[data-svc]', el).checked = true;
      el.classList.add('is-on');
    }
  });

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }

  /* ---------- Hesaplama ---------- */
  function dims() {
    const w = num($('[data-dim="w"]').value), l = num($('[data-dim="l"]').value), h = num($('[data-dim="h"]').value);
    const o = Math.max(0, Math.floor(num($('[data-dim="o"]').value)));
    const perimeter = 2 * (w + l);
    const wall = Math.max(0, perimeter * h - o * OPENING_M2);
    return { w, l, h, o, wall, ceiling: w * l, perimeter };
  }
  function qtyFor(unit, d, pieceQty) {
    if (unit === 'wall') return d.wall;
    if (unit === 'ceiling') return d.ceiling;
    if (unit === 'perimeter') return d.perimeter;
    if (unit === 'piece') return pieceQty;
    return 1;
  }

  function calc() {
    const d = dims();
    $('[data-area="wall"]').textContent = fmt(d.wall) + ' m²';
    $('[data-area="ceiling"]').textContent = fmt(d.ceiling) + ' m²';
    $('[data-area="perimeter"]').textContent = fmt(d.perimeter) + ' m';

    const lines = [];
    $$('.spick').forEach((el) => {
      const on = $('[data-svc]', el).checked;
      el.classList.toggle('is-on', on);
      if (!on) return;
      const s = SERVICES.find((x) => String(x.id) === el.dataset.id);
      const mainId = ($(`input[name="main-${s.id}"]:checked`, el) || {}).value;
      const main = s.options.find((o) => String(o.id) === mainId);
      const items = [];
      if (main) {
        const q = qtyFor(main.unit, d, 1);
        items.push({ name: main.name, q, unit: main.unit, price: main.price, total: q * main.price });
      }
      $$('[data-extra]', el).forEach((cb) => {
        const label = cb.closest('.extra');
        label.classList.toggle('is-on', cb.checked);
        if (!cb.checked) return;
        const o = s.options.find((x) => String(x.id) === cb.value);
        const pq = o.unit === 'piece' ? Math.max(1, Math.floor(num(($(`[data-qty="${o.id}"]`, el) || {}).value) || 1)) : 1;
        const q = qtyFor(o.unit, d, pq);
        items.push({ name: o.name, q, unit: o.unit, price: o.price, total: q * o.price });
      });
      lines.push({ service: s.name, items, total: items.reduce((a, b) => a + b.total, 0) });
    });

    const has = lines.length > 0;
    $('[data-empty]').hidden = has;
    $('[data-totals]').hidden = !has;
    $('[data-total-box]').hidden = !has;

    $('[data-lines]').innerHTML = lines.map((ln) => `
      <div class="cline">
        <div class="cline__head"><b>${esc(ln.service)}</b><span>${money(ln.total)}</span></div>
        ${ln.items.map((it) => `<div class="cline__item"><span>${esc(it.name)}<small>${it.unit === 'fixed' ? 'sabit' : fmt(it.q) + ' ' + UNIT_LABEL[it.unit] + ' × ' + money(it.price)}</small></span><span>${money(it.total)}</span></div>`).join('')}
      </div>`).join('');

    const vatRate = Number(SETTINGS.vatRate) || 0;
    const incl = !!SETTINGS.pricesIncludeVat;
    const min = Number(SETTINGS.minimumCharge) || 0;
    const range = Number(SETTINGS.rangePercent) || 0;
    const subtotal = lines.reduce((a, b) => a + b.total, 0);
    let minApplied = false;
    // Minimum iş bedeli KDV dahil toplam üzerinden uygulanır
    let gross = incl ? subtotal : subtotal * (1 + vatRate / 100);
    if (has && min > 0 && gross < min) { gross = min; minApplied = true; }
    const net = gross / (1 + vatRate / 100);
    const vat = gross - net;

    $('[data-subtotal]').textContent = money(net);
    $('[data-vat-label]').textContent = `KDV (%${fmt(vatRate)})${incl ? ' — fiyatlara dahil' : ''}`;
    $('[data-vat]').textContent = money(vat);
    $('[data-min-row]').hidden = !minApplied;
    $('[data-total]').textContent = money(gross);
    $('[data-range]').textContent = range > 0 ? `${money(gross * (1 - range / 100))} – ${money(gross * (1 + range / 100))} aralığında` : '';
    $('[data-note]').textContent = SETTINGS.priceNote || '';

    // WhatsApp mesajı
    const msg = [
      'Merhaba, web sitenizdeki fiyat hesaplama ile bir tahmin yaptım:',
      `Oda: ${fmt(d.w)} × ${fmt(d.l)} m, yükseklik ${fmt(d.h, 2)} m (${d.o} kapı/pencere)`,
      ...lines.flatMap((ln) => [`• ${ln.service}: ${ln.items.map((i) => i.name + (i.unit === 'piece' ? ` (${i.q} adet)` : '')).join(', ')}`]),
      has ? `Tahmini toplam: ${money(gross)} (KDV dahil)` : '',
      'Ücretsiz keşif için randevu almak istiyorum.',
    ].filter(Boolean).join('\n');
    $('[data-send]').href = wa(msg);
  }

  document.addEventListener('input', (e) => { if (e.target.closest('.calc-page')) calc(); });
  document.addEventListener('change', (e) => { if (e.target.closest('.calc-page')) calc(); });
  calc();
})();
