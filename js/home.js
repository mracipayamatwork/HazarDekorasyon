/* =========================================================
   Hazar Dekorasyon — Ana Sayfa
   ========================================================= */
(function () {
  const { $, $$, byId, card, createRoom, openProduct, openLightbox, wa, observe } = window.Hazar;
  const { PRODUCTS, TONES, IMG, applySwatch } = window.HazarData;

  /* ---------- Hero slayt ---------- */
  const slider = $('[data-hero-slider]');
  if (slider) {
    const slides = $$('.arch__slide', slider);
    const dots = $('[data-hero-dots]');
    const caption = $('[data-hero-caption]');
    let i = 0, timer;
    slides.forEach((_, k) => {
      const b = document.createElement('button');
      b.setAttribute('aria-label', `Görsel ${k + 1}`);
      if (!k) b.classList.add('is-active');
      b.addEventListener('click', () => { go(k); restart(); });
      dots.appendChild(b);
    });
    function go(k) {
      slides[i].classList.remove('is-active');
      dots.children[i].classList.remove('is-active');
      i = (k + slides.length) % slides.length;
      slides[i].classList.add('is-active');
      dots.children[i].classList.add('is-active');
      caption.classList.add('swap');
      setTimeout(() => { caption.textContent = slides[i].dataset.label; caption.classList.remove('swap'); }, 300);
    }
    const restart = () => { clearInterval(timer); timer = setInterval(() => go(i + 1), 5500); };
    restart();

    // Hafif paralaks
    const visual = $('.hero__visual');
    if (matchMedia('(hover: hover)').matches) {
      document.querySelector('.hero').addEventListener('mousemove', (e) => {
        const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
        $('.hero__card').style.translate = `${x * -18}px ${y * -14}px`;
        $('.hero__badge').style.translate = `${x * 14}px ${y * 12}px`;
        slider.style.translate = `${x * 6}px ${y * 6}px`;
      });
    }
  }

  // Sezonun favorisi kartı
  const featured = byId('hz1021') || PRODUCTS[0];
  const fsw = $('[data-hero-swatch]');
  if (fsw) {
    applySwatch(fsw, featured, 0.5);
    $('[data-hero-feature-name]').textContent = `${featured.name} · ${featured.variant}`;
    $('[data-hero-feature]').addEventListener('click', () => openProduct(featured.id));
  }

  /* ---------- Renkler ---------- */
  const tonesEl = $('[data-tones]');
  if (tonesEl) {
    TONES.forEach((t) => {
      const a = document.createElement('a');
      a.className = 'tone';
      a.href = `katalog.html?renk=${t.id}`;
      a.innerHTML = `<span class="tone__swatch"><i style="background:${t.c[0]}"></i><i style="background:${t.c[1]}"></i></span>${t.name} Tonlar`;
      tonesEl.appendChild(a);
    });
  }

  /* ---------- Odanda Gör ---------- */
  const roomEl = $('[data-room]');
  if (roomEl) {
    const room = createRoom(roomEl, { compare: true });
    const picks = ['hz1003', 'hz1021', 'hz1017', 'hz1043', 'hz1009', 'hz1012', 'hz1036', 'hz1029', 'hz1046', 'hz1007', 'hz1070', 'hz1061']
      .map(byId).filter(Boolean);
    const picker = $('[data-vis-picker]');
    let active;
    function select(p, btn) {
      active = p;
      room.set(p);
      $$('.vpick', picker).forEach((b) => b.classList.toggle('is-active', b === btn));
      $('[data-vis-collection]').textContent = `${p.collection} · ${p.code}`;
      $('[data-vis-name]').textContent = `${p.name} – ${p.variant}`;
    }
    picks.forEach((p, k) => {
      const b = document.createElement('button');
      b.className = 'vpick';
      b.title = `${p.name} – ${p.variant}`;
      b.setAttribute('aria-label', b.title);
      applySwatch(b, p, 0.35);
      b.addEventListener('click', () => select(p, b));
      picker.appendChild(b);
      if (!k) { room.set(p, false); select(p, b); }
    });
    $('[data-vis-open]').addEventListener('click', () => openProduct(active.id));
    // ilk görünümde süpürme animasyonu
    room.split(92);
    const vio = new IntersectionObserver((en) => {
      if (en[0].isIntersecting) { setTimeout(() => room.animateSplit(92, 38, 2000), 500); vio.disconnect(); }
    }, { threshold: 0.5 });
    vio.observe(roomEl);
  }

  /* ---------- Koleksiyon desen kutuları ---------- */
  $$('[data-coll-pattern]').forEach((el) => {
    const p = byId(el.dataset.collPattern);
    if (p) applySwatch(el, p, 1.2);
  });

  /* ---------- Çok satanlar ---------- */
  const car = $('[data-carousel]');
  if (car) {
    const best = PRODUCTS.filter((p) => p.badge === 'best');
    best.forEach((p) => car.appendChild(card(p)));
    const stepW = () => car.firstElementChild.getBoundingClientRect().width + 24;
    $('[data-car-prev]').addEventListener('click', () => car.scrollBy({ left: -stepW(), behavior: 'smooth' }));
    $('[data-car-next]').addEventListener('click', () => car.scrollBy({ left: stepW(), behavior: 'smooth' }));
  }

  /* ---------- Galeri ---------- */
  const GALLERY = [
    { id: '1775595224318-83ad712fe52e', t: 'Çiçekli Yatak Odası', c: 'duvar', ratio: 0.75 },
    { id: '1784482267781-8f09c82a67f4', t: 'Işıklı Gergi Tavan', c: 'tavan', ratio: 1.25 },
    { id: '1792574471342-0249c7608c62', t: 'Botanik Oturma Köşesi', c: 'duvar', ratio: 1 },
    { id: '1598928506311-c55ded91a20c', t: 'Kasetli Tavan & Şömine', c: 'anahtar', ratio: 0.75 },
    { id: '1787507470165-d77594fa264b', t: 'Desenli Başlık Duvarı', c: 'duvar', ratio: 1.2 },
    { id: '1665832966717-238c3a7e2bf7', t: 'Dekoratif Aydınlatma', c: 'tavan', ratio: 0.8 },
    { id: '1780672823863-1f40d9c6435d', t: 'Çizgili Yatak Odası', c: 'duvar', ratio: 0.8 },
    { id: '1618221195710-dd6b41faaea6', t: 'Anahtar Teslim Salon', c: 'anahtar', ratio: 1 },
    { id: '1785119774310-84850a185fb4', t: 'Vintage Yeşil Salon', c: 'duvar', ratio: 0.8 },
    { id: '1789713437477-a24236edc0ce', t: 'Gömme Spot Tavan', c: 'tavan', ratio: 1 },
    { id: '1779648596385-bac45f45d1ed', t: 'Dokulu Yatak Odası', c: 'anahtar', ratio: 0.8 },
    { id: '1793384317820-79659efbc2ab', t: 'Romantik Çay Köşesi', c: 'duvar', ratio: 1.2 },
  ];
  const CAT_NAMES = { duvar: 'Duvar Kağıdı', tavan: 'Gergi Tavan', anahtar: 'Anahtar Teslim' };
  const gal = $('[data-gallery]');
  if (gal) {
    GALLERY.forEach((g, k) => {
      const b = document.createElement('button');
      b.className = 'gitem reveal';
      b.dataset.c = g.c;
      b.style.setProperty('--d', (k % 3) * 0.08 + 's');
      b.innerHTML = `<img loading="lazy" src="${IMG(g.id, 800)}" alt="${g.t}" style="aspect-ratio:${1 / g.ratio}" /><span class="gitem__cap"><span><small>${CAT_NAMES[g.c]}</small><b>${g.t}</b></span><span>↗</span></span>`;
      b.addEventListener('click', () => {
        const visible = GALLERY.filter((x) => currentF === 'all' || x.c === currentF);
        openLightbox(visible.map((x) => ({ src: IMG(x.id, 1800), title: x.t })), visible.indexOf(g));
      });
      gal.appendChild(b);
    });
    observe(gal);
    let currentF = 'all';
    $$('[data-gallery-filter] .chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        currentF = chip.dataset.f;
        $$('[data-gallery-filter] .chip').forEach((c) => c.classList.toggle('is-active', c === chip));
        $$('.gitem', gal).forEach((it) => it.classList.toggle('is-hidden', currentF !== 'all' && it.dataset.c !== currentF));
      });
    });
  }

  /* ---------- Yorumlar ---------- */
  const ts = $('[data-tslider]');
  if (ts) {
    const cards = $$('.tcard', ts), dots = $('[data-tdots]');
    let i = 0, timer;
    cards.forEach((_, k) => {
      const b = document.createElement('button');
      b.setAttribute('aria-label', `Yorum ${k + 1}`);
      if (!k) b.classList.add('is-active');
      b.addEventListener('click', () => { go(k); clearInterval(timer); timer = setInterval(() => go(i + 1), 6500); });
      dots.appendChild(b);
    });
    function go(k) {
      cards[i].classList.remove('is-active'); dots.children[i].classList.remove('is-active');
      i = (k + cards.length) % cards.length;
      cards[i].classList.add('is-active'); dots.children[i].classList.add('is-active');
    }
    timer = setInterval(() => go(i + 1), 6500);
  }

  /* ---------- Instagram kutuları ---------- */
  const insta = $('[data-insta]');
  if (insta) {
    ['1785119774248-3e9e394e675a', '1773499129465-4eda9cfd1147', '1640109478916-f445f8f19b11', '1602364557801-8908351b0c7e', '1780672823960-9452898e2bb1', '1665832966717-238c3a7e2bf7']
      .forEach((id, k) => {
        const a = document.createElement('a');
        a.className = 'insta__tile reveal';
        a.style.setProperty('--d', k * 0.06 + 's');
        a.href = 'https://www.instagram.com/hazardekorasyon/';
        a.target = '_blank';
        a.rel = 'noopener';
        a.setAttribute('aria-label', 'Instagram gönderisi');
        a.style.backgroundImage = `url("${IMG(id, 500)}")`;
        insta.appendChild(a);
      });
    observe(insta);
  }

  /* ---------- İletişim formu → WhatsApp ---------- */
  const form = $('[data-contact-form]');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      let ok = true;
      ['ad', 'tel'].forEach((n) => {
        const field = form.elements[n].closest('.field');
        const bad = !String(fd.get(n) || '').trim();
        field.classList.toggle('is-error', bad);
        if (bad) ok = false;
      });
      if (!ok) return;
      const services = fd.getAll('hizmet').join(', ') || 'Belirtilmedi';
      const text = [
        'Merhaba Hazar Dekorasyon, ücretsiz keşif talebim var.',
        `Ad Soyad: ${fd.get('ad')}`,
        `Telefon: ${fd.get('tel')}`,
        `Hizmet: ${services}`,
        fd.get('ilce') ? `Konum: ${fd.get('ilce')}` : '',
        fd.get('mesaj') ? `Not: ${fd.get('mesaj')}` : '',
      ].filter(Boolean).join('\n');
      window.open(wa(text), '_blank', 'noopener');
    });
    $$('input', form).forEach((i) => i.addEventListener('input', () => i.closest('.field') && i.closest('.field').classList.remove('is-error')));
  }

  // Aktif menü bağlantısı
  const links = $$('[data-nav] a[href^="#"]');
  const sio = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) links.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach((l) => { const s = $(l.getAttribute('href')); if (s) sio.observe(s); });
})();
