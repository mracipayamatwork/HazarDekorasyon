/* =========================================================
   Hazar Dekorasyon — Katalog Sayfası (filtreleme & arama)
   ========================================================= */
(function () {
  const { $, $$, card, byId, wa } = window.Hazar;
  const { PRODUCTS, TONES, CATEGORIES, ROOMS, applySwatch } = window.HazarData;

  const MATERIALS = [...new Set(PRODUCTS.map((p) => p.material))].sort((a, b) => a.localeCompare(b, 'tr'));
  const FLAGS = [{ id: 'new', name: 'Yeni gelenler' }, { id: 'best', name: 'Çok satanlar' }];
  const norm = (s) => s.toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i');

  // Durum (URL ile senkron)
  const qs = new URLSearchParams(location.search);
  const state = {
    q: qs.get('q') || '',
    cat: qs.get('kategori') || 'all',
    tones: new Set((qs.get('renk') || '').split(',').filter(Boolean)),
    rooms: new Set((qs.get('oda') || '').split(',').filter(Boolean)),
    materials: new Set(),
    flags: new Set(),
    sort: 'onerilen',
  };

  const grid = $('[data-grid]');
  const searchEl = $('[data-search]');
  searchEl.value = state.q;

  /* ---------- Başlık deseni ---------- */
  const heroP = PRODUCTS.find((p) => p.pattern && p.pattern.type === 'ogee') || PRODUCTS.find((p) => p.pattern);
  if (heroP) applySwatch($('[data-khero-pattern]'), heroP, 1.4);

  /* ---------- Kategori düğmeleri ---------- */
  const kcats = $('[data-kcats]');
  function buildCats() {
    kcats.innerHTML = '';
    const all = document.createElement('button');
    all.className = 'kcat kcat--all';
    all.dataset.cat = 'all';
    all.innerHTML = `<i>✦</i>Tümü <small>${PRODUCTS.length}</small>`;
    kcats.appendChild(all);
    CATEGORIES.forEach((c) => {
      const b = document.createElement('button');
      b.className = 'kcat';
      b.dataset.cat = c.id;
      b.innerHTML = `<i></i>${c.name} <small>${PRODUCTS.filter((p) => p.cat === c.id).length}</small>`;
      const sample = byId(c.sample);
      if (sample) applySwatch($('i', b), sample, 0.3);
      kcats.appendChild(b);
    });
    kcats.addEventListener('click', (e) => {
      const b = e.target.closest('[data-cat]');
      if (!b) return;
      state.cat = b.dataset.cat;
      update();
    });
  }

  /* ---------- Filtre paneli ---------- */
  function buildFilters() {
    const tonesEl = $('[data-f-tones]');
    TONES.forEach((t) => {
      const b = document.createElement('button');
      b.className = 'ftone';
      b.dataset.tone = t.id;
      b.title = t.name;
      b.innerHTML = `<span><i style="background:${t.c[0]}"></i><i style="background:${t.c[1]}"></i></span>${t.name}`;
      b.addEventListener('click', () => { toggle(state.tones, t.id); update(); });
      tonesEl.appendChild(b);
    });
    const check = (container, items, set, count) => {
      items.forEach((it) => {
        const l = document.createElement('label');
        l.className = 'fcheck';
        l.innerHTML = `<input type="checkbox" value="${it.id}" /><span class="box"></span>${it.name}<small>${count(it.id)}</small>`;
        $('input', l).addEventListener('change', () => { toggle(set, it.id); update(); });
        container.appendChild(l);
      });
    };
    check($('[data-f-rooms]'), ROOMS, state.rooms, (id) => PRODUCTS.filter((p) => p.rooms.includes(id)).length);
    check($('[data-f-materials]'), MATERIALS.map((m) => ({ id: m, name: m })), state.materials, (id) => PRODUCTS.filter((p) => p.material === id).length);
    check($('[data-f-flags]'), FLAGS, state.flags, (id) => PRODUCTS.filter((p) => p.badge === id).length);
  }
  const toggle = (set, v) => (set.has(v) ? set.delete(v) : set.add(v));

  /* ---------- Filtreleme ---------- */
  function filtered() {
    const q = norm(state.q.trim());
    let list = PRODUCTS.filter((p) => {
      if (state.cat !== 'all' && p.cat !== state.cat) return false;
      if (state.tones.size && !state.tones.has(p.tone)) return false;
      if (state.rooms.size && !p.rooms.some((r) => state.rooms.has(r))) return false;
      if (state.materials.size && !state.materials.has(p.material)) return false;
      if (state.flags.size && !state.flags.has(p.badge)) return false;
      if (q) {
        const cat = CATEGORIES.find((c) => c.id === p.cat);
        const tone = TONES.find((t) => t.id === p.tone);
        const hay = norm([p.name, p.variant, p.collection, p.code, p.code.replace('-', ''), p.material, cat && cat.name, tone && tone.name].join(' '));
        if (!q.split(/\s+/).every((w) => hay.includes(w))) return false;
      }
      return true;
    });
    const by = (f) => (a, b) => f(a).localeCompare(f(b), 'tr');
    if (state.sort === 'az') list.sort(by((p) => p.name + p.variant));
    if (state.sort === 'za') list.sort(by((p) => p.name + p.variant)).reverse();
    if (state.sort === 'yeni') list.sort((a, b) => (b.badge === 'new') - (a.badge === 'new') || b.code.localeCompare(a.code));
    if (state.sort === 'onerilen') list.sort((a, b) => (b.badge === 'best') - (a.badge === 'best'));
    return list;
  }

  /* ---------- Çizim ---------- */
  function render() {
    const list = filtered();
    $$('[data-count-num]').forEach((el) => (el.textContent = list.length));
    $('[data-empty]').hidden = list.length > 0;
    grid.innerHTML = '';
    const frag = document.createDocumentFragment();
    list.forEach((p, i) => {
      if (i === 8) frag.appendChild(promo(i));
      const c = card(p);
      c.style.setProperty('--i', Math.min(i, 16));
      frag.appendChild(c);
    });
    if (list.length > 0 && list.length <= 8) frag.appendChild(promo(list.length));
    grid.appendChild(frag);
  }
  function promo(i) {
    const el = document.createElement('div');
    el.className = 'kpromo';
    el.style.setProperty('--i', Math.min(i, 16));
    el.innerHTML = `<small>Aradığınızı bulamadınız mı?</small>
      <h3>Yüzlerce desen daha<br/>numune kataloglarımızda.</h3>
      <p>Ücretsiz keşifte numune kataloglarımızı adresinize getiriyoruz. Aklınızdaki deseni anlatın, birlikte bulalım.</p>
      <a class="btn btn--light" target="_blank" rel="noopener" href="${wa('Merhaba, katalogda göremediğim bir desen arıyorum. Yardımcı olabilir misiniz?')}">WhatsApp'tan Sor</a>`;
    return el;
  }

  function syncUI() {
    $$('.kcat', kcats).forEach((b) => b.classList.toggle('is-active', b.dataset.cat === state.cat));
    $$('.ftone').forEach((b) => b.classList.toggle('is-active', state.tones.has(b.dataset.tone)));
    $$('[data-f-rooms] input').forEach((i) => (i.checked = state.rooms.has(i.value)));
    $$('[data-f-materials] input').forEach((i) => (i.checked = state.materials.has(i.value)));
    $$('[data-f-flags] input').forEach((i) => (i.checked = state.flags.has(i.value)));
    // aktif filtre çipleri
    const chips = [];
    const nm = (list, id) => (list.find((x) => x.id === id) || { name: id }).name;
    if (state.cat !== 'all') chips.push(['cat', state.cat, nm(CATEGORIES, state.cat)]);
    state.tones.forEach((t) => chips.push(['tones', t, nm(TONES, t) + ' tonlar']));
    state.rooms.forEach((r) => chips.push(['rooms', r, nm(ROOMS, r)]));
    state.materials.forEach((m) => chips.push(['materials', m, m]));
    state.flags.forEach((f) => chips.push(['flags', f, FLAGS.find((x) => x.id === f).name]));
    if (state.q) chips.push(['q', state.q, `“${state.q}”`]);
    const act = $('[data-active]');
    act.innerHTML = chips.map(([k, v, label]) => `<span class="achip">${label}<button data-rm="${k}" data-v="${v}" aria-label="Kaldır">✕</button></span>`).join('') +
      (chips.length > 1 ? '<button class="achip achip--clear" data-clear>Tümünü temizle</button>' : '');
    const n = chips.filter((c) => c[0] !== 'q' && c[0] !== 'cat').length;
    $('[data-filter-count]').textContent = n || '';
    // URL
    const p = new URLSearchParams();
    if (state.cat !== 'all') p.set('kategori', state.cat);
    if (state.tones.size) p.set('renk', [...state.tones].join(','));
    if (state.rooms.size) p.set('oda', [...state.rooms].join(','));
    if (state.q) p.set('q', state.q);
    history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : ''));
  }

  function update() { syncUI(); render(); }

  /* ---------- Olaylar ---------- */
  let st;
  searchEl.addEventListener('input', () => {
    clearTimeout(st);
    st = setTimeout(() => { state.q = searchEl.value; update(); }, 180);
  });
  $('[data-sort]').addEventListener('change', (e) => { state.sort = e.target.value; render(); });
  $$('[data-cols]').forEach((b) => b.addEventListener('click', () => {
    $$('[data-cols]').forEach((x) => x.classList.toggle('is-active', x === b));
    grid.classList.toggle('cols-3', b.dataset.cols === '3');
  }));
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-clear]')) {
      state.cat = 'all'; state.q = ''; searchEl.value = '';
      [state.tones, state.rooms, state.materials, state.flags].forEach((s) => s.clear());
      return update();
    }
    const rm = e.target.closest('[data-rm]');
    if (rm) {
      const k = rm.dataset.rm, v = rm.dataset.v;
      if (k === 'cat') state.cat = 'all';
      else if (k === 'q') { state.q = ''; searchEl.value = ''; }
      else state[k].delete(v);
      return update();
    }
    if (e.target.closest('[data-open-filters]')) document.body.classList.add('filters-open', 'is-locked');
    if (e.target.closest('[data-close-filters]')) document.body.classList.remove('filters-open', 'is-locked');
  });

  /* ---------- Alt CTA desenleri ---------- */
  const sw = $('[data-kcta-swatches]');
  const seen = new Set();
  PRODUCTS.filter((p) => p.pattern && !seen.has(p.name) && seen.add(p.name)).slice(0, 8).forEach((p) => {
    const s = document.createElement('span');
    applySwatch(s, p, 0.5);
    sw.appendChild(s);
  });

  buildCats();
  buildFilters();
  update();

  // ?urun=HZ-1001 (ürün kodu) ile doğrudan ürün aç
  const direct = qs.get('urun');
  if (direct) setTimeout(() => window.Hazar.openProduct(direct), 600);
})();
