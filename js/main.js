/* =========================================================
   Hazar Dekorasyon — Ortak Bileşenler
   (menü, animasyonlar, favoriler, ürün kartı, ürün modalı,
    "Odanda Gör" sahnesi, lightbox, bildirim)
   ========================================================= */
(function () {
  const { PRODUCTS, TONES, CATEGORIES, ROOMS, applySwatch } = window.HazarData;
  const PHONE = '905432038730';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const byId = (id) => PRODUCTS.find((p) => p.id === id);
  const toneOf = (id) => TONES.find((t) => t.id === id);
  const catOf = (id) => CATEGORIES.find((c) => c.id === id);
  const roomName = (id) => (ROOMS.find((r) => r.id === id) || {}).name || id;
  const wa = (text) => `https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`;
  const ICON = {
    heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
    eye: '<svg viewBox="0 0 24 24"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    wa: '<svg viewBox="0 0 24 24"><path d="M3 21l1.6-4.6A8.5 8.5 0 1 1 8 19.6z"/></svg>',
    phone: '<svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
    arrows: '<svg viewBox="0 0 24 24"><path d="M9 7 4 12l5 5M15 7l5 5-5 5"/></svg>',
  };
  const productLabel = (p) => `${p.name} – ${p.variant} (${p.code})`;

  /* ---------- Bildirim ---------- */
  let toastEl, toastT;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('is-show');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('is-show'), 2200);
  }

  /* ---------- Favoriler (tarayıcıda saklanır) ---------- */
  const FAV_KEY = 'hazar-favoriler';
  const Fav = {
    list() {
      try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch { return []; }
    },
    has(id) { return this.list().includes(id); },
    toggle(id) {
      const l = this.list();
      const i = l.indexOf(id);
      if (i > -1) l.splice(i, 1); else l.push(id);
      try { localStorage.setItem(FAV_KEY, JSON.stringify(l)); } catch {}
      this.sync(true);
      return i === -1;
    },
    sync(bump) {
      const n = this.list().length;
      $$('[data-fav-count]').forEach((el) => {
        el.textContent = n;
        el.classList.toggle('has', n > 0);
        if (bump) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
      });
      $$('[data-fav-id]').forEach((b) => b.classList.toggle('is-on', this.has(b.dataset.favId)));
      if (drawer && drawer.classList.contains('is-open')) renderDrawer();
    },
  };

  /* ---------- Ürün kartı ---------- */
  function card(p) {
    const el = document.createElement('article');
    el.className = 'pcard';
    el.dataset.id = p.id;
    const tone = toneOf(p.tone);
    el.innerHTML = `
      <div class="pcard__media">
        <div class="pcard__swatch"></div>
        ${p.badge ? `<span class="pcard__badge ${p.badge === 'best' ? 'pcard__badge--best' : ''}">${p.badge === 'best' ? 'Çok Satan' : 'Yeni'}</span>` : ''}
        <button class="pcard__fav ${Fav.has(p.id) ? 'is-on' : ''}" data-fav-id="${p.id}" aria-label="Favorilere ekle">${ICON.heart}</button>
        <span class="pcard__view">${ICON.eye} Hızlı İncele</span>
      </div>
      <div class="pcard__info">
        <div><h3>${p.name}</h3><p>${p.variant} · ${p.code}</p></div>
        <span class="tone-dot" title="${tone ? tone.name : ''}" style="background:linear-gradient(135deg, ${tone.c[0]} 50%, ${tone.c[1]} 50%)"></span>
      </div>`;
    applySwatch($('.pcard__swatch', el), p, 0.85);
    return el;
  }
  // Kart tıklamaları (tüm sayfa için tek dinleyici)
  document.addEventListener('click', (e) => {
    const fav = e.target.closest('[data-fav-id]');
    if (fav) {
      e.preventDefault();
      e.stopPropagation();
      const on = Fav.toggle(fav.dataset.favId);
      fav.classList.remove('pop'); void fav.offsetWidth; fav.classList.add('pop');
      toast(on ? 'Favorilere eklendi ♥' : 'Favorilerden çıkarıldı');
      return;
    }
    const c = e.target.closest('.pcard');
    if (c) openProduct(c.dataset.id);
  });

  /* ---------- Odanda Gör sahnesi ---------- */
  const ROOM_SVG = `
  <svg class="room__props" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs>
      <linearGradient id="rFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8946f"/><stop offset="1" stop-color="#8f6d4d"/></linearGradient>
      <linearGradient id="rSofa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ece5da"/><stop offset="1" stop-color="#d3c8b8"/></linearGradient>
      <linearGradient id="rSofaD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ddd3c5"/><stop offset="1" stop-color="#bfb2a0"/></linearGradient>
      <linearGradient id="rWallShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient>
      <radialGradient id="rGlow"><stop offset="0" stop-color="#fff3d6" stop-opacity=".75"/><stop offset="1" stop-color="#fff3d6" stop-opacity="0"/></radialGradient>
      <linearGradient id="rLeaf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5f7d55"/><stop offset="1" stop-color="#2f4a30"/></linearGradient>
      <filter id="rBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="18"/></filter>
      <filter id="rBlurS" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
    </defs>
    <rect x="0" y="740" width="1600" height="50" fill="url(#rWallShade)"/>
    <ellipse cx="800" cy="690" rx="470" ry="120" fill="#000" opacity=".13" filter="url(#rBlur)"/>
    <ellipse cx="1330" cy="560" rx="150" ry="150" fill="url(#rGlow)"/>
    <!-- süpürgelik + zemin -->
    <rect x="0" y="776" width="1600" height="18" fill="#f4efe7"/>
    <rect x="0" y="792" width="1600" height="3" fill="#d6ccbf"/>
    <rect x="0" y="795" width="1600" height="205" fill="url(#rFloor)"/>
    <g stroke="#5e4630" stroke-opacity=".18" stroke-width="2">
      <path d="M0 838H1600M0 890H1600M0 950H1600"/>
      <path d="M180 795V838M720 795V838M1260 795V838M420 838V890M980 838V890M1480 838V890M90 890V950M640 890V950M1180 890V950M330 950V1000M880 950V1000M1400 950V1000"/>
    </g>
    <!-- halı -->
    <path d="M330 880 L1270 880 L1360 980 L240 980Z" fill="#efe7db"/>
    <path d="M352 892 L1248 892 L1325 968 L275 968Z" fill="none" stroke="#c9b9a2" stroke-width="2"/>
    <!-- koltuk gölgesi -->
    <ellipse cx="800" cy="808" rx="440" ry="22" fill="#000" opacity=".3" filter="url(#rBlurS)"/>
    <!-- koltuk -->
    <rect x="455" y="796" width="14" height="18" rx="3" fill="#5a3f2b"/>
    <rect x="1131" y="796" width="14" height="18" rx="3" fill="#5a3f2b"/>
    <rect x="420" y="550" width="760" height="190" rx="44" fill="url(#rSofaD)"/>
    <rect x="442" y="566" width="352" height="168" rx="36" fill="url(#rSofa)"/>
    <rect x="806" y="566" width="352" height="168" rx="36" fill="url(#rSofa)"/>
    <rect x="430" y="705" width="740" height="95" rx="26" fill="url(#rSofaD)"/>
    <rect x="452" y="680" width="346" height="62" rx="24" fill="url(#rSofa)"/>
    <rect x="802" y="680" width="346" height="62" rx="24" fill="url(#rSofa)"/>
    <rect x="368" y="628" width="112" height="172" rx="46" fill="url(#rSofa)"/>
    <rect x="1120" y="628" width="112" height="172" rx="46" fill="url(#rSofa)"/>
    <path d="M380 660 Q424 640 468 660" stroke="#fff" stroke-opacity=".5" stroke-width="3" fill="none"/>
    <path d="M1132 660 Q1176 640 1220 660" stroke="#fff" stroke-opacity=".5" stroke-width="3" fill="none"/>
    <!-- yastıklar -->
    <rect x="486" y="590" width="150" height="122" rx="30" fill="#7a1f2b" transform="rotate(-9 561 651)"/>
    <rect x="610" y="612" width="122" height="98" rx="26" fill="#f3ede4" transform="rotate(-4 671 661)"/>
    <rect x="966" y="596" width="148" height="118" rx="30" fill="#c6a067" transform="rotate(8 1040 655)"/>
    <!-- battaniye -->
    <path d="M1060 690 L1160 690 L1180 800 L1080 800Z" fill="#8a9b84" opacity=".95"/>
    <path d="M1070 720 H1166 M1074 750 H1170" stroke="#fff" stroke-opacity=".25" stroke-width="3"/>
    <!-- yan sehpa + lamba -->
    <ellipse cx="1340" cy="806" rx="54" ry="8" fill="#000" opacity=".25"/>
    <rect x="1332" y="690" width="16" height="114" fill="#6d4e37"/>
    <ellipse cx="1340" cy="690" rx="92" ry="15" fill="#7d5a40"/>
    <ellipse cx="1340" cy="686" rx="92" ry="13" fill="#916b4e"/>
    <path d="M1318 676 C1306 640 1316 612 1340 604 C1364 612 1374 640 1362 676Z" fill="#efe7db"/>
    <rect x="1337" y="560" width="6" height="46" fill="#b08d57"/>
    <path d="M1276 500 L1404 500 L1428 566 L1252 566Z" fill="#f8f2e8"/>
    <path d="M1252 566 L1428 566" stroke="#e2d6c4" stroke-width="3"/>
    <rect x="1380" y="664" width="44" height="10" rx="2" fill="#7a1f2b" transform="rotate(-6 1402 669)"/>
    <rect x="1376" y="654" width="40" height="9" rx="2" fill="#2f4a3a" transform="rotate(-6 1396 658)"/>
    <!-- bitki -->
    <g>
      <path d="M232 790 C228 640 220 520 248 400" stroke="#4a3a2a" stroke-width="5" fill="none"/>
      <path d="M232 700 C200 600 160 560 130 520" stroke="#4a3a2a" stroke-width="4" fill="none"/>
      <path d="M236 640 C270 560 300 520 330 470" stroke="#4a3a2a" stroke-width="4" fill="none"/>
      <g fill="url(#rLeaf)">
        <ellipse cx="248" cy="392" rx="30" ry="50" transform="rotate(10 248 392)"/>
        <ellipse cx="214" cy="450" rx="28" ry="46" transform="rotate(-38 214 450)"/>
        <ellipse cx="284" cy="470" rx="28" ry="46" transform="rotate(42 284 470)"/>
        <ellipse cx="128" cy="512" rx="28" ry="46" transform="rotate(-50 128 512)"/>
        <ellipse cx="174" cy="560" rx="26" ry="42" transform="rotate(-20 174 560)"/>
        <ellipse cx="334" cy="462" rx="27" ry="44" transform="rotate(50 334 462)"/>
        <ellipse cx="300" cy="540" rx="26" ry="42" transform="rotate(30 300 540)"/>
        <ellipse cx="198" cy="626" rx="26" ry="42" transform="rotate(-48 198 626)"/>
        <ellipse cx="262" cy="602" rx="25" ry="40" transform="rotate(36 262 602)"/>
      </g>
      <g fill="#7f9c70" opacity=".55">
        <ellipse cx="244" cy="388" rx="12" ry="34" transform="rotate(10 244 388)"/>
        <ellipse cx="282" cy="468" rx="10" ry="30" transform="rotate(42 282 468)"/>
        <ellipse cx="130" cy="510" rx="10" ry="30" transform="rotate(-50 130 510)"/>
      </g>
      <ellipse cx="232" cy="808" rx="80" ry="10" fill="#000" opacity=".25"/>
      <path d="M160 700 L304 700 L290 806 L174 806Z" fill="#d9cfc0"/>
      <rect x="152" y="690" width="160" height="18" rx="4" fill="#e7dfd2"/>
    </g>
  </svg>
  <div class="room__light"></div>`;

  function createRoom(el, opts = {}) {
    el.innerHTML = `<div class="room__wall"><div class="room__paper"></div>${opts.compare ? '<div class="room__plain"></div>' : ''}</div>${ROOM_SVG}` +
      (opts.compare ? `<span class="room__tag room__tag--before">ÖNCE</span><span class="room__tag room__tag--after">SONRA</span><div class="room__handle"><span class="room__knob">${ICON.arrows}</span></div>` : '');
    const paper = $('.room__paper', el);
    let current = null;
    const scale = () => Math.max(0.35, el.clientWidth / 1300);
    function paint(p) { applySwatch(paper, p, scale()); }
    const api = {
      el,
      set(p, animate = true) {
        if (current && current.id === p.id) return;
        current = p;
        if (!animate) return paint(p);
        paper.classList.add('fade');
        setTimeout(() => { paint(p); paper.classList.remove('fade'); }, 260);
      },
      split(pct) { el.style.setProperty('--split', pct + '%'); },
      animateSplit(from, to, dur = 1600) {
        const t0 = performance.now();
        const step = (t) => {
          const k = Math.min(1, (t - t0) / dur);
          const e = 1 - Math.pow(1 - k, 4);
          api.split(from + (to - from) * e);
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      },
    };
    if ('ResizeObserver' in window) new ResizeObserver(() => current && paint(current)).observe(el);
    if (opts.compare) {
      api.split(50);
      let drag = false;
      const move = (e) => {
        const r = el.getBoundingClientRect();
        const x = Math.min(Math.max(((e.clientX - r.left) / r.width) * 100, 2), 98);
        api.split(x);
      };
      el.addEventListener('pointerdown', (e) => { drag = true; el.classList.add('is-dragging'); move(e); });
      window.addEventListener('pointermove', (e) => drag && move(e));
      window.addEventListener('pointerup', () => { drag = false; el.classList.remove('is-dragging'); });
    }
    return api;
  }

  /* ---------- Ürün modalı ---------- */
  let modal, modalRoom, modalProduct;
  function buildModal() {
    modal = document.createElement('div');
    modal.className = 'pmodal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
      <div class="pmodal__backdrop" data-close></div>
      <div class="pmodal__panel">
        <button class="pmodal__close" data-close aria-label="Kapat">${ICON.close}</button>
        <div class="pmodal__media">
          <div class="pmodal__tabs">
            <button class="is-active" data-tab="swatch">Desen</button>
            <button data-tab="room">Odada Gör</button>
          </div>
          <div class="pmodal__view pmodal__view--swatch is-active" data-view="swatch">
            <div class="pmodal__swatch" data-swatch></div>
            <span class="pmodal__hint">Yakınlaştırmak için tıklayın</span>
          </div>
          <div class="pmodal__view pmodal__view--room" data-view="room"><div class="room" data-mroom></div></div>
        </div>
        <div class="pmodal__info">
          <p class="eyebrow" data-m-cat></p>
          <h2 class="pmodal__title" data-m-name></h2>
          <p class="pmodal__variant" data-m-variant></p>
          <span class="pmodal__code" data-m-code></span>
          <div class="pmodal__variants" data-m-variants></div>
          <ul class="specs" data-m-specs></ul>
          <div class="pmodal__calc">
            <small data-m-calc-title>Kaç rulo gerekir?</small>
            <div class="calc__row">
              <label>Duvar genişliği (m)<input type="number" min="0.5" step="0.1" value="4" data-calc-w /></label>
              <label>Duvar yüksekliği (m)<input type="number" min="0.5" step="0.05" value="2.7" data-calc-h /></label>
            </div>
            <div class="calc__result"><b data-calc-out>—</b><span data-calc-note></span></div>
          </div>
          <div class="pmodal__actions">
            <a class="btn btn--primary btn--lg" target="_blank" rel="noopener" data-m-wa>${ICON.wa} WhatsApp'tan Fiyat Al</a>
            <button class="round-btn" data-m-fav aria-label="Favorilere ekle">${ICON.heart}</button>
            <a class="round-btn" href="tel:+${PHONE}" aria-label="Ara">${ICON.phone}</a>
          </div>
          <p class="pmodal__note">Fiyatlar ölçü ve uygulama detayına göre belirlenir. Ücretsiz keşif için bize ulaşın.</p>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modalRoom = createRoom($('[data-mroom]', modal));

    modal.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]')) return closeProduct();
      const tab = e.target.closest('[data-tab]');
      if (tab) {
        $$('[data-tab]', modal).forEach((b) => b.classList.toggle('is-active', b === tab));
        $$('[data-view]', modal).forEach((v) => v.classList.toggle('is-active', v.dataset.view === tab.dataset.tab));
        if (tab.dataset.tab === 'room') modalRoom.set(modalProduct, false);
        return;
      }
      const vd = e.target.closest('[data-variant]');
      if (vd) return fillModal(byId(vd.dataset.variant));
      if (e.target.closest('[data-m-fav]')) {
        const on = Fav.toggle(modalProduct.id);
        $('[data-m-fav]', modal).classList.toggle('fav-on', on);
        toast(on ? 'Favorilere eklendi ♥' : 'Favorilerden çıkarıldı');
        return;
      }
      const sw = e.target.closest('[data-swatch]');
      if (sw && !modalProduct.photo) {
        sw.classList.toggle('zoomed');
        applySwatch(sw, modalProduct, sw.classList.contains('zoomed') ? 3 : 1.6);
      }
    });
    $$('[data-calc-w],[data-calc-h]', modal).forEach((i) => i.addEventListener('input', calc));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) closeProduct();
    });
  }
  function calc() {
    const p = modalProduct;
    const w = parseFloat($('[data-calc-w]', modal).value) || 0;
    const h = parseFloat($('[data-calc-h]', modal).value) || 0;
    const out = $('[data-calc-out]', modal), note = $('[data-calc-note]', modal);
    if (!w || !h) { out.textContent = '—'; note.textContent = 'Ölçüleri girin'; return; }
    if (p.custom) {
      out.textContent = (w * h).toFixed(1).replace('.', ',') + ' m²';
      note.textContent = 'Duvarınızın ölçüsüne özel tek parça baskı';
      return;
    }
    const strips = Math.ceil(w / p.rollW);
    const stripLen = h + (p.repeat || 0) / 100 + 0.05;
    const perRoll = Math.max(1, Math.floor(p.rollL / stripLen));
    const rolls = Math.ceil(strips / perRoll);
    out.textContent = rolls + ' rulo';
    note.textContent = `${strips} şerit · rulo başına ${perRoll} şerit (desen payı dahil, yaklaşık)`;
  }
  function fillModal(p) {
    modalProduct = p;
    const cat = catOf(p.cat), tone = toneOf(p.tone);
    $('[data-m-cat]', modal).textContent = `${cat ? cat.name : ''} · ${p.collection}`;
    $('[data-m-name]', modal).textContent = p.name;
    $('[data-m-variant]', modal).textContent = p.variant;
    $('[data-m-code]', modal).textContent = 'ÜRÜN KODU: ' + p.code;
    const sw = $('[data-swatch]', modal);
    sw.classList.remove('zoomed');
    applySwatch(sw, p, 1.6);
    $('.pmodal__hint', modal).style.display = p.photo ? 'none' : '';
    if ($('[data-view="room"]', modal).classList.contains('is-active')) modalRoom.set(p);
    // renk varyantları
    const sibs = PRODUCTS.filter((x) => x.collection === p.collection && x.name === p.name);
    const vbox = $('[data-m-variants]', modal);
    if (sibs.length > 1) {
      vbox.innerHTML = `<small>Renk seçenekleri (${sibs.length})</small><div></div>`;
      sibs.forEach((s) => {
        const b = document.createElement('button');
        b.className = 'vdot' + (s.id === p.id ? ' is-active' : '');
        b.dataset.variant = s.id;
        b.title = s.variant;
        applySwatch(b, s, 0.4);
        $('div', vbox).appendChild(b);
      });
    } else vbox.innerHTML = '';
    $('[data-m-specs]', modal).innerHTML = [
      ['Materyal', p.material],
      ['Ölçü', p.size],
      ['Desen tekrarı', p.repeat ? p.repeat + ' cm' : 'Serbest eşleşme'],
      ['Renk tonu', tone ? tone.name : '-'],
      ['Uygun mekânlar', p.rooms.map(roomName).join(', ')],
    ].map(([k, v]) => `<li><span>${k}</span><b>${v}</b></li>`).join('');
    $('[data-m-calc-title]', modal).textContent = p.custom ? 'Duvar ölçünüz' : 'Kaç rulo gerekir?';
    calc();
    $('[data-m-wa]', modal).href = wa(`Merhaba, ${productLabel(p)} duvar kağıdı hakkında fiyat ve bilgi almak istiyorum.`);
    $('[data-m-fav]', modal).classList.toggle('fav-on', Fav.has(p.id));
  }
  function openProduct(id) {
    const p = byId(id);
    if (!p) return;
    if (!modal) buildModal();
    $$('[data-tab]', modal).forEach((b, i) => b.classList.toggle('is-active', i === 0));
    $$('[data-view]', modal).forEach((v, i) => v.classList.toggle('is-active', i === 0));
    fillModal(p);
    modal.classList.add('is-open');
    document.body.classList.add('is-locked');
    setTimeout(() => $('.pmodal__close', modal).focus({ preventScroll: true }), 50);
  }
  function closeProduct() {
    modal.classList.remove('is-open');
    document.body.classList.remove('is-locked');
  }

  /* ---------- Favori çekmecesi ---------- */
  let drawer;
  function buildDrawer() {
    drawer = document.createElement('div');
    drawer.className = 'drawer';
    drawer.innerHTML = `
      <div class="drawer__backdrop" data-dclose></div>
      <aside class="drawer__panel" aria-label="Favorilerim">
        <div class="drawer__head"><h3>Favorilerim</h3><button class="pmodal__close" style="position:static;box-shadow:none" data-dclose aria-label="Kapat">${ICON.close}</button></div>
        <div class="drawer__list" data-dlist></div>
        <div class="drawer__foot" data-dfoot></div>
      </aside>`;
    document.body.appendChild(drawer);
    drawer.addEventListener('click', (e) => {
      if (e.target.closest('[data-dclose]')) return closeDrawer();
      const rm = e.target.closest('[data-dremove]');
      if (rm) return Fav.toggle(rm.dataset.dremove);
      const th = e.target.closest('[data-dopen]');
      if (th) { closeDrawer(); openProduct(th.dataset.dopen); }
    });
  }
  function renderDrawer() {
    const items = Fav.list().map(byId).filter(Boolean);
    const list = $('[data-dlist]', drawer), foot = $('[data-dfoot]', drawer);
    if (!items.length) {
      list.innerHTML = `<div class="drawer__empty">${ICON.heart}<p>Henüz favori deseniniz yok.<br/>Beğendiğiniz desenlerdeki ♥ simgesine dokunun.</p></div>`;
      foot.innerHTML = `<a href="katalog.html" class="btn btn--dark btn--block">Kataloğa Göz At</a>`;
      return;
    }
    list.innerHTML = '';
    items.forEach((p) => {
      const row = document.createElement('div');
      row.className = 'drawer__item';
      row.innerHTML = `<div class="drawer__thumb" data-dopen="${p.id}"></div><div><b>${p.name}</b><small>${p.variant} · ${p.code}</small></div><button class="drawer__remove" data-dremove="${p.id}" aria-label="Kaldır">${ICON.close}</button>`;
      applySwatch($('.drawer__thumb', row), p, 0.45);
      list.appendChild(row);
    });
    const text = 'Merhaba, web sitenizde beğendiğim duvar kağıtları:\n' + items.map((p) => '• ' + productLabel(p)).join('\n') + '\nBu desenler için fiyat bilgisi alabilir miyim?';
    foot.innerHTML = `<a href="${wa(text)}" target="_blank" rel="noopener" class="btn btn--primary btn--block">${ICON.wa} Listeyi WhatsApp'tan Gönder</a><a href="katalog.html" class="btn btn--ghost btn--block">Kataloğa Devam Et</a>`;
  }
  function openDrawer() {
    if (!drawer) buildDrawer();
    renderDrawer();
    drawer.classList.add('is-open');
    document.body.classList.add('is-locked');
  }
  function closeDrawer() {
    drawer.classList.remove('is-open');
    document.body.classList.remove('is-locked');
  }
  document.addEventListener('click', (e) => { if (e.target.closest('[data-fav-open]')) openDrawer(); });

  /* ---------- Lightbox ---------- */
  let lb, lbItems = [], lbIndex = 0;
  function openLightbox(items, index) {
    if (!lb) {
      lb = document.createElement('div');
      lb.className = 'lightbox';
      lb.innerHTML = `<button class="lightbox__close" aria-label="Kapat">${ICON.close}</button>
        <button class="lightbox__nav lightbox__nav--prev" aria-label="Önceki"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></button>
        <figure style="margin:0"><img alt="" /><figcaption class="lightbox__cap"></figcaption></figure>
        <button class="lightbox__nav lightbox__nav--next" aria-label="Sonraki"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>`;
      document.body.appendChild(lb);
      lb.addEventListener('click', (e) => {
        if (e.target.closest('.lightbox__nav--prev')) return showLb(lbIndex - 1);
        if (e.target.closest('.lightbox__nav--next')) return showLb(lbIndex + 1);
        if (e.target === lb || e.target.closest('.lightbox__close')) closeLb();
      });
      document.addEventListener('keydown', (e) => {
        if (!lb.classList.contains('is-open')) return;
        if (e.key === 'Escape') closeLb();
        if (e.key === 'ArrowLeft') showLb(lbIndex - 1);
        if (e.key === 'ArrowRight') showLb(lbIndex + 1);
      });
    }
    lbItems = items;
    showLb(index);
    lb.classList.add('is-open');
    document.body.classList.add('is-locked');
  }
  function showLb(i) {
    lbIndex = (i + lbItems.length) % lbItems.length;
    const it = lbItems[lbIndex];
    $('img', lb).src = it.src;
    $('img', lb).alt = it.title;
    $('.lightbox__cap', lb).textContent = it.title;
  }
  function closeLb() { lb.classList.remove('is-open'); document.body.classList.remove('is-locked'); }

  /* ---------- Sayfa genel davranışları ---------- */
  // Açılış
  let started = false;
  function start() {
    if (started) return;
    started = true;
    document.body.classList.remove('is-loading');
    setTimeout(() => document.body.classList.add('is-ready'), 350);
  }
  // Fontlar hazır olunca (en geç 1,6 sn) açılış perdesini kaldır
  Promise.race([
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => new Promise((r) => setTimeout(r, 700))),
    new Promise((r) => setTimeout(r, 1600)),
  ]).then(start);

  // Header
  const header = $('[data-header]');
  let lastY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (header) {
      header.classList.toggle('is-scrolled', y > 10);
      header.classList.toggle('is-hidden', y > 500 && y > lastY && !document.body.classList.contains('nav-open'));
    }
    lastY = y;
  }, { passive: true });

  // Mobil menü
  const burger = $('[data-burger]');
  if (burger) {
    burger.addEventListener('click', () => {
      document.body.classList.toggle('nav-open');
      if (header) header.classList.remove('is-hidden');
    });
    $$('[data-nav] a').forEach((a) => a.addEventListener('click', () => document.body.classList.remove('nav-open')));
  }

  // Görünür olunca animasyon
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  const observe = (root = document) => $$('.reveal:not(.in)', root).forEach((el) => io.observe(el));
  observe();

  // Sayaçlar
  const cio = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target, to = +el.dataset.count, t0 = performance.now();
      const step = (t) => {
        const k = Math.min(1, (t - t0) / 1800), e = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(to * e).toLocaleString('tr-TR');
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      cio.unobserve(el);
    });
  }, { threshold: 0.5 });
  $$('[data-count]').forEach((el) => cio.observe(el));

  // Manyetik butonlar
  if (matchMedia('(hover: hover)').matches) {
    $$('.magnetic').forEach((b) => {
      b.addEventListener('mousemove', (e) => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.2}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
      });
      b.addEventListener('mouseleave', () => (b.style.transform = ''));
    });
  }

  // Dekoratif koyu desen arka planı
  const deco = window.HazarPatterns.render('damask', { bg: 'transparent', fg: '#d6bd8d', ac: '#d6bd8d' });
  document.documentElement.style.setProperty('--pattern-bg', `url("${deco.url}")`);

  // Yıl / yukarı
  $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
  $$('[data-to-top]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); scrollTo({ top: 0, behavior: 'smooth' }); }));

  Fav.sync();

  window.Hazar = { $, $$, byId, card, createRoom, openProduct, openLightbox, toast, wa, observe, Fav, toneOf, catOf, PHONE };
})();
