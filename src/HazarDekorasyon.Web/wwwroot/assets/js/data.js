/* =========================================================
   Hazar Dekorasyon — Katalog Verisi
   Veri sunucu tarafından (veritabanından) sayfaya
   window.HAZAR_DATA olarak gömülür. Ürünler admin panelinden yönetilir.
   ========================================================= */
(function () {
  const raw = window.HAZAR_DATA || { tones: [], categories: [], rooms: [], products: [], settings: {} };
  const IMG = (id, w = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;

  const TONES = raw.tones;
  const CATEGORIES = raw.categories;
  const ROOMS = raw.rooms;
  const SETTINGS = raw.settings || {};
  const PRODUCTS = raw.products.map((p) => ({
    ...p,
    rollW: Number(p.rollW) || 0.53,
    rollL: Number(p.rollL) || 10.05,
    repeat: Number(p.repeat) || 0,
    price: p.price != null ? Number(p.price) : null,
    rooms: p.rooms || [],
    badge: p.badge || null,
  }));

  // Desen tanımı olmayan ve fotoğrafı da olmayan ürün için yedek görünüm
  const FALLBACK = { type: 'linen', colors: { bg: '#e9e2d8', fg: '#8c7656', ac: '#000' }, seed: 1 };

  // Ürün görselini CSS arka planı olarak döndürür
  function swatch(p, scale = 1) {
    if (p.photo) {
      return { image: `url("${p.photo}")`, size: 'cover', position: 'center' };
    }
    const pt = p.pattern || FALLBACK;
    const r = window.HazarPatterns.render(pt.type, pt.colors, pt.seed);
    return { image: `url("${r.url}")`, size: `${Math.round(r.w * scale)}px ${Math.round(r.h * scale)}px`, position: '0 0' };
  }
  function applySwatch(el, p, scale) {
    const s = swatch(p, scale);
    el.style.backgroundImage = s.image;
    el.style.backgroundSize = s.size;
    el.style.backgroundPosition = s.position;
    el.style.backgroundRepeat = p.photo ? 'no-repeat' : 'repeat';
  }

  const money = (n) => Math.round(n).toLocaleString('tr-TR') + ' ₺';

  window.HazarData = { TONES, CATEGORIES, ROOMS, PRODUCTS, SETTINGS, IMG, swatch, applySwatch, money };
})();
