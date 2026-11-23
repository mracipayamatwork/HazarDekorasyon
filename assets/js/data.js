/* =========================================================
   Hazar Dekorasyon — Katalog Verisi
   Yeni ürün eklemek için COLLECTIONS veya PHOTO_ITEMS
   listelerine satır eklemeniz yeterli.
   ========================================================= */
(function () {
  const IMG = (id, w = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;

  const TONES = [
    { id: 'bej', name: 'Bej', c: ['#e9dcc6', '#c9b28f'] },
    { id: 'beyaz', name: 'Beyaz', c: ['#f7f4ef', '#dcd6cc'] },
    { id: 'gri', name: 'Gri', c: ['#c9c6c1', '#8a8782'] },
    { id: 'siyah', name: 'Siyah', c: ['#3a3836', '#141312'] },
    { id: 'yesil', name: 'Yeşil', c: ['#a9b89a', '#3f5a43'] },
    { id: 'mavi', name: 'Mavi', c: ['#a8c1d1', '#5b7f99'] },
    { id: 'lacivert', name: 'Lacivert', c: ['#3d4d6a', '#1c2639'] },
    { id: 'pembe', name: 'Pembe', c: ['#f0d3cf', '#d49a95'] },
    { id: 'altin', name: 'Altın', c: ['#e3c98f', '#b08d57'] },
    { id: 'kahve', name: 'Kahve', c: ['#b89276', '#6d4b36'] },
    { id: 'kirmizi', name: 'Bordo', c: ['#b4545e', '#6e1a26'] },
  ];

  const CATEGORIES = [
    { id: 'klasik', name: 'Damask & Klasik' },
    { id: 'geometrik', name: 'Geometrik' },
    { id: 'botanik', name: 'Botanik & Çiçek' },
    { id: 'cizgili', name: 'Çizgili' },
    { id: 'doku', name: 'Düz & Doku' },
    { id: 'mermer', name: 'Mermer & Taş' },
    { id: 'cocuk', name: 'Çocuk Odası' },
    { id: 'panoramik', name: 'Panoramik & Duvar Resmi' },
  ];

  const ROOMS = [
    { id: 'salon', name: 'Salon' },
    { id: 'yatak', name: 'Yatak Odası' },
    { id: 'cocuk', name: 'Çocuk Odası' },
    { id: 'ofis', name: 'Ofis & İşyeri' },
    { id: 'antre', name: 'Antre & Koridor' },
  ];

  // [koleksiyon, desen tipi, kategori, materyal, odalar, renk varyantları]
  // varyant: [ad, ton, bg, fg, ac, c3?, rozet?]
  const COLLECTIONS = [
    ['Osmanlı Damask', 'damask', 'klasik', 'Kabartmalı Vinil', ['salon', 'yatak', 'antre'], [
      ['Altın Krem', 'bej', '#efe6d6', '#d9c6a3', '#b08d57', null, 'best'],
      ['Gece Mavisi', 'lacivert', '#1f2a3d', '#2f3e58', '#c4a265'],
      ['Zümrüt', 'yesil', '#1f3a31', '#2c4d41', '#c4a265', null, 'new'],
      ['Antrasit', 'siyah', '#222222', '#333231', '#a8a39b'],
      ['Bordo Saray', 'kirmizi', '#5e1621', '#741f2c', '#d1ae6c'],
    ]],
    ['Küp Geometri', 'cubes', 'geometrik', 'Non-woven', ['ofis', 'salon', 'antre'], [
      ['Taş Gri', 'gri', '#dedbd6', '#a9a59f', '#c7c3bd'],
      ['Okyanus', 'mavi', '#cfdde6', '#4f7590', '#93b0c3'],
      ['Toprak', 'kahve', '#e8d8c6', '#8a5e43', '#c19a7c'],
    ]],
    ['Gatsby Yelpaze', 'fans', 'klasik', 'Metalik Vinil', ['salon', 'antre', 'ofis'], [
      ['Siyah Altın', 'siyah', '#191919', '#c9a75d', '#e2c98f', null, 'best'],
      ['Adaçayı', 'yesil', '#dfe5d8', '#7d9273', '#b39b6b'],
      ['Pudra', 'pembe', '#f3e1dc', '#c99a92', '#b08d57'],
    ]],
    ['Ogee Kafes', 'ogee', 'klasik', 'Non-woven', ['yatak', 'salon'], [
      ['Krem Altın', 'bej', '#f2ebdf', '#c8b089', '#b08d57'],
      ['İnci Gri', 'gri', '#e6e4e0', '#9e9a94', '#c2bdb6'],
      ['Lacivert Beyaz', 'lacivert', '#22304a', '#e9e4da', '#c4a265', null, 'new'],
    ]],
    ['Halka', 'rings', 'geometrik', 'Non-woven', ['yatak', 'ofis'], [
      ['Kum', 'bej', '#efe7da', '#bba684', '#a07f52'],
      ['Mint', 'yesil', '#e2ece6', '#88aa98', '#5f8572'],
    ]],
    ['Botanik Yaprak', 'leaves', 'botanik', 'Tekstil Yüzey', ['salon', 'yatak', 'ofis'], [
      ['Orman', 'yesil', '#e9e6dc', '#4c6b4f', '#8fa67f', null, 'best'],
      ['Kum Tepesi', 'bej', '#f1e9dc', '#c4a881', '#9c7d58'],
      ['Gece Bahçesi', 'lacivert', '#1d2638', '#3c5a55', '#7f9b86', null, 'new'],
      ['Tropik Gece', 'siyah', '#151816', '#2d4a3a', '#4f7a5c'],
    ]],
    ['Ginkgo', 'ginkgo', 'botanik', 'Non-woven', ['yatak', 'salon', 'antre'], [
      ['Altın Krem', 'altin', '#f4ecdc', '#c9a35e', '#dcc08a', null, 'best'],
      ['Haki', 'yesil', '#d9dcc8', '#6f7a4f', '#a3a97c'],
      ['Gece Altını', 'lacivert', '#1b2436', '#c9a35e', '#8e7445'],
    ]],
    ['Okaliptüs', 'eucalyptus', 'botanik', 'Tekstil Yüzey', ['yatak', 'cocuk', 'salon'], [
      ['Adaçayı', 'yesil', '#eef0ea', '#7f9a86', '#a9bca8', null, 'new'],
      ['Beyaz Bahar', 'beyaz', '#fbfaf7', '#a5b5a6', '#d1b98d'],
    ]],
    ['İnce Çizgi', 'pinstripe', 'cizgili', 'Non-woven', ['ofis', 'yatak', 'antre'], [
      ['Krem', 'beyaz', '#f4efe6', '#d2c5ae', '#b08d57'],
      ['Gri Flanel', 'gri', '#d5d3cf', '#9b9893', '#ffffff'],
      ['Lacivert', 'lacivert', '#25324a', '#3e4e6c', '#c4a265'],
    ]],
    ['Regency Çizgi', 'regency', 'cizgili', 'Kabartmalı Vinil', ['salon', 'yatak'], [
      ['Mint Krem', 'yesil', '#f1ede3', '#bccdbd', '#9fb4a1'],
      ['Bordo Krem', 'kirmizi', '#f3ece0', '#8a2a35', '#c4a265'],
      ['Gece', 'siyah', '#2a2928', '#1a1918', '#b08d57'],
    ]],
    ['Zikzak', 'chevron', 'geometrik', 'Non-woven', ['cocuk', 'ofis'], [
      ['Gri', 'gri', '#f0eeeb', '#b7b3ad', '#d6d2cc'],
      ['Hardal', 'altin', '#f5efe2', '#d3a94e', '#e5cc92'],
    ]],
    ['Dalga', 'waves', 'geometrik', 'Non-woven', ['yatak', 'cocuk'], [
      ['Deniz', 'mavi', '#e4edf2', '#6b93ad', '#a7c2d3'],
      ['Kum', 'bej', '#f3ebdd', '#c2a47b', '#ddc7a3'],
    ]],
    ['Keten Doku', 'linen', 'doku', 'Tekstil Yüzey', ['salon', 'yatak', 'ofis', 'antre'], [
      ['Kum', 'bej', '#e2d5c1', '#8c7656', '#000', null, 'best'],
      ['Taş', 'gri', '#cfcbc4', '#6f6a63', '#000'],
      ['Grafit', 'siyah', '#4a4846', '#1e1d1c', '#000'],
      ['Kil', 'kahve', '#b98d6e', '#6b432c', '#000', null, 'new'],
      ['Adaçayı', 'yesil', '#b9c2ad', '#5c6b52', '#000'],
      ['Gece Mavisi', 'lacivert', '#34435c', '#16202f', '#000'],
      ['Pudra', 'pembe', '#e7cbc3', '#a3746b', '#000'],
    ]],
    ['Mermer', 'marble', 'mermer', 'Saten Vinil', ['salon', 'antre', 'ofis'], [
      ['Carrara', 'beyaz', '#f3f1ee', '#8f8b86', '#c9c5bf', null, 'best'],
      ['Nero Marquina', 'siyah', '#1d1c1b', '#e8e4dd', '#5a5650'],
      ['Calacatta Altın', 'bej', '#f4efe6', '#a88a5c', '#d8c7a6', null, 'new'],
      ['Verde Alpi', 'yesil', '#1f3a33', '#cfd9cf', '#3f6a5c'],
    ]],
    ['Terrazzo', 'terrazzo', 'mermer', 'Non-woven', ['ofis', 'cocuk', 'salon'], [
      ['Pastel', 'beyaz', '#f4f0ea', '#e0a99b', '#9fb8a8', '#e4c98f'],
      ['Toprak', 'bej', '#ede4d6', '#a0623f', '#5e6b52', '#c79a5c'],
    ]],
    ['Ekose', 'tartan', 'cizgili', 'Tekstil Yüzey', ['ofis', 'salon'], [
      ['İskoç Kırmızı', 'kirmizi', '#6e1a26', '#1c2639', '#c4a265', '#f3ece0'],
      ['Orman', 'yesil', '#2b4535', '#1c2639', '#b9332f', '#e9dfc9'],
    ]],
    ['Yıldızlı Gece', 'stars', 'cocuk', 'Non-woven (Silinebilir)', ['cocuk', 'yatak'], [
      ['Lacivert', 'lacivert', '#1f2b44', '#e9d9a8', '#ffffff', null, 'best'],
      ['Pembe Rüya', 'pembe', '#f6e4e0', '#e3a9a1', '#c9a35e'],
      ['Bulut', 'beyaz', '#f7f6f3', '#c5d4dc', '#e2c98f'],
    ]],
    ['Gökkuşağı', 'rainbow', 'cocuk', 'Non-woven (Silinebilir)', ['cocuk'], [
      ['Toprak', 'bej', '#f6efe4', '#c9825e', '#e0b67a', '#9fae93', 'new'],
      ['Pastel', 'pembe', '#fbf3ef', '#e7aca2', '#f0cf9a', '#a9c4cf'],
    ]],
    ['Dağ Macerası', 'mountains', 'cocuk', 'Non-woven (Silinebilir)', ['cocuk'], [
      ['Mavi', 'mavi', '#eef3f5', '#7d9fb4', '#b5cad6', '#6f8c6a'],
      ['Orman', 'yesil', '#f2f0e8', '#7f9a7b', '#c5d1b8', '#4c6a4f'],
    ]],
    ['Puantiye', 'dots', 'cocuk', 'Non-woven (Silinebilir)', ['cocuk', 'yatak'], [
      ['Pembe', 'pembe', '#fbf1ee', '#e5aaa1', '#d6c08f'],
      ['Gri', 'gri', '#f3f2ef', '#b9b6b0', '#d9d6d1'],
      ['Mavi', 'mavi', '#f0f5f8', '#9bb8c9', '#d8c79f'],
    ]],
    ['Kemer', 'arches', 'geometrik', 'Non-woven', ['salon', 'antre', 'yatak'], [
      ['Terrakota', 'kahve', '#f1e4d6', '#b4643c', '#c9a35e', null, 'new'],
      ['Zeytin', 'yesil', '#ece9dc', '#6c7a4c', '#b49c6a'],
    ]],
    ['Fas Karosu', 'moroccan', 'geometrik', 'Non-woven', ['salon', 'antre'], [
      ['Krem Altın', 'bej', '#f4ede1', '#c8ab7c', '#b08d57'],
      ['Turkuaz', 'mavi', '#e3eeee', '#4f8b8f', '#c4a265'],
    ]],
    ['Balık Pulu', 'scales', 'geometrik', 'Metalik Vinil', ['salon', 'antre'], [
      ['Gece Altını', 'siyah', '#1d1d1d', '#b08d57', '#6e5a3a', '#262524'],
      ['Okyanus', 'mavi', '#dbe7ec', '#5b8197', '#9fbccb', '#e9f0f3'],
    ]],
  ];

  // Fotoğraf tabanlı ürünler (panoramik / özel desenler)
  const PHOTO_ITEMS = [
    { name: 'Çiçek Taşları', collection: 'Atölye', cat: 'doku', tone: 'bej', img: '1770983076558-14c5f119a4fd', rooms: ['salon', 'antre'], badge: 'new' },
    { name: 'Grafik Şehir', collection: 'Atölye', cat: 'geometrik', tone: 'gri', img: '1770983438037-7ca0ccc22464', rooms: ['ofis', 'salon'] },
    { name: 'Kış Ormanı', collection: 'Atölye', cat: 'panoramik', tone: 'beyaz', img: '1770983438181-a75147510daf', rooms: ['yatak', 'salon'], badge: 'best' },
    { name: 'Sarmaşık', collection: 'Atölye', cat: 'botanik', tone: 'yesil', img: '1770983438128-f4065cf02752', rooms: ['yatak', 'salon'] },
    { name: 'Bahar Dalı', collection: 'Atölye', cat: 'botanik', tone: 'beyaz', img: '1780672823983-6ab83c017906', rooms: ['yatak', 'cocuk'] },
    { name: 'Vintage Gül', collection: 'Atölye', cat: 'botanik', tone: 'kahve', img: '1612764550058-b7ccce95a20e', rooms: ['salon', 'yatak'] },
    { name: 'Saray Bahçesi', collection: 'Panorama', cat: 'panoramik', tone: 'yesil', img: '1763668193434-6abd23c3722c', rooms: ['salon', 'antre'], badge: 'best' },
    { name: 'Klasik Fresk', collection: 'Panorama', cat: 'panoramik', tone: 'mavi', img: '1763669029358-401b2f5516a9', rooms: ['salon', 'ofis'] },
  ];

  const PRODUCTS = [];
  let code = 1001;
  COLLECTIONS.forEach(([col, type, cat, material, rooms, variants], ci) => {
    variants.forEach(([vname, tone, bg, fg, ac, c3, badge], vi) => {
      PRODUCTS.push({
        id: 'hz' + code,
        code: 'HZ-' + code++,
        name: col,
        variant: vname,
        collection: col,
        cat, tone, rooms, material,
        badge: badge || null,
        pattern: { type, colors: { bg, fg, ac, c3: c3 || null }, seed: ci * 7 + vi + 1 },
        size: '0,53 × 10,05 m',
        repeat: type === 'linen' || type === 'marble' ? 0 : [32, 53, 64][(ci + vi) % 3],
        rollW: 0.53,
        rollL: 10.05,
      });
    });
  });
  PHOTO_ITEMS.forEach((p) => {
    PRODUCTS.push({
      id: 'hz' + code,
      code: 'HZ-' + code++,
      name: p.name,
      variant: p.cat === 'panoramik' ? 'Özel Ölçü' : 'Doğal',
      collection: p.collection,
      cat: p.cat, tone: p.tone, rooms: p.rooms,
      material: p.cat === 'panoramik' ? 'Dijital Baskı · Tekstil' : 'Non-woven',
      badge: p.badge || null,
      photo: p.img,
      size: p.cat === 'panoramik' ? 'Duvarınıza özel ölçü' : '0,53 × 10,05 m',
      repeat: 53,
      rollW: 0.53,
      rollL: 10.05,
      custom: p.cat === 'panoramik',
    });
  });

  // Ürün görselini CSS arka planı olarak döndürür
  function swatch(p, scale = 1) {
    if (p.photo) {
      return { image: `url("${IMG(p.photo)}")`, size: 'cover', position: 'center' };
    }
    const r = window.HazarPatterns.render(p.pattern.type, p.pattern.colors, p.pattern.seed);
    return { image: `url("${r.url}")`, size: `${Math.round(r.w * scale)}px ${Math.round(r.h * scale)}px`, position: '0 0' };
  }
  function applySwatch(el, p, scale) {
    const s = swatch(p, scale);
    el.style.backgroundImage = s.image;
    el.style.backgroundSize = s.size;
    el.style.backgroundPosition = s.position;
    el.style.backgroundRepeat = p.photo ? 'no-repeat' : 'repeat';
  }

  window.HazarData = { TONES, CATEGORIES, ROOMS, PRODUCTS, IMG, swatch, applySwatch };
})();
