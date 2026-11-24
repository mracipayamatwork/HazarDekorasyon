/* =========================================================
   Hazar Dekorasyon — Yönetim Paneli yardımcıları
   ========================================================= */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // Mobil menü
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-aside-open]')) document.body.classList.add('aside-open');
    if (e.target.closest('[data-aside-close]')) document.body.classList.remove('aside-open');
  });

  // Silme onayı
  document.addEventListener('submit', (e) => {
    const msg = e.target.dataset.confirm;
    if (msg && !confirm(msg)) e.preventDefault();
  });

  // Bildirimi birkaç saniye sonra kapat
  const flash = $('[data-flash]');
  if (flash && flash.classList.contains('flash--success')) setTimeout(() => flash.remove(), 5000);

  // Renk alanları: renk seçici <-> metin kutusu
  $$('[data-color]').forEach((wrap) => {
    const picker = $('input[type=color]', wrap), text = $('input[type=text]', wrap);
    const norm = (v) => (/^#[0-9a-f]{6}$/i.test(v) ? v : null);
    picker.addEventListener('input', () => { text.value = picker.value; text.dispatchEvent(new Event('input', { bubbles: true })); });
    text.addEventListener('input', () => { const v = norm(text.value.trim()); if (v) picker.value = v; });
  });

  // Desen önizlemesi (tablolarda ve formlarda)
  function paint(el, d) {
    if (d.photo) {
      el.style.backgroundImage = `url("${d.photo}")`;
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      el.style.backgroundRepeat = 'no-repeat';
      return;
    }
    if (!d.type || !window.HazarPatterns) return;
    try {
      const r = window.HazarPatterns.render(d.type, { bg: d.bg || '#eee', fg: d.fg || '#999', ac: d.ac || '#666', c3: d.c3 || null }, Number(d.seed) || 1);
      const k = Number(d.scale) || 1;
      el.style.backgroundImage = `url("${r.url}")`;
      el.style.backgroundSize = `${Math.round(r.w * k)}px ${Math.round(r.h * k)}px`;
      el.style.backgroundPosition = '0 0';
      el.style.backgroundRepeat = 'repeat';
    } catch (err) { /* bilinmeyen desen */ }
  }
  $$('[data-swatch]').forEach((el) => paint(el, el.dataset));
  window.HazarAdmin = { paint };

  // Giriş ekranı arka planı
  if (document.body.classList.contains('admin-login') && window.HazarPatterns) {
    const r = window.HazarPatterns.render('damask', { bg: 'transparent', fg: '#d6bd8d', ac: '#d6bd8d' });
    document.body.style.setProperty('--login-pattern', `url("${r.url}")`);
  }

  // Kısa adı (slug) addan otomatik üret
  const nameEl = $('[data-slug-source]'), slugEl = $('[data-slug-target]');
  if (nameEl && slugEl) {
    let touched = !!slugEl.value;
    slugEl.addEventListener('input', () => (touched = true));
    const map = { ç: 'c', ğ: 'g', ı: 'i', İ: 'i', ö: 'o', ş: 's', ü: 'u', Ç: 'c', Ğ: 'g', Ö: 'o', Ş: 's', Ü: 'u' };
    nameEl.addEventListener('input', () => {
      if (touched) return;
      slugEl.value = nameEl.value.trim().split('').map((ch) => map[ch] ?? ch.toLowerCase()).join('')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50);
    });
  }
})();
