/* =========================================================
   Hazar Dekorasyon — Desen Motoru
   Duvar kağıdı desenlerini kesintisiz (seamless) SVG karoları
   olarak üretir. Her desen bir data-URI döndürür.
   ========================================================= */
(function () {
  const enc = (s) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  const svg = (w, h, inner, bg, defs = '') =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    (defs ? `<defs>${defs}</defs>` : '') +
    `<rect width="${w}" height="${h}" fill="${bg}"/>${inner}</svg>`;

  // deterministik rastgele
  function rng(seed) {
    let s = (seed * 9301 + 49297) % 233280 || 1;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }
  // kenarlardan taşan öğeleri karşı kenara kopyalar (kesintisiz döşeme)
  function wrapped(w, h, x, y, r, fn) {
    let out = '';
    for (const dx of [-w, 0, w])
      for (const dy of [-h, 0, h]) {
        const X = x + dx, Y = y + dy;
        if (X + r < 0 || X - r > w || Y + r < 0 || Y - r > h) continue;
        out += fn(X, Y);
      }
    return out;
  }
  const f = (n) => Math.round(n * 100) / 100;

  const G = {};

  /* ---------- Damask ---------- */
  G.damask = (c) => {
    const w = 120, h = 170;
    const half = 'M0 -64 C5 -56 3 -50 9 -45 C19 -38 30 -30 27 -15 C25 -5 15 -1 17 8 C19 17 31 20 31 33 C31 47 19 54 8 56 C4 57 2 60 0 66 Z';
    const leaves = 'M27 -15 C38 -22 46 -14 42 -6 C38 -10 32 -12 27 -15Z M31 33 C42 28 48 36 44 44 C40 40 36 37 31 33Z';
    const curl = 'M6 -55 C14 -60 22 -54 18 -48 C15 -45 11 -48 13 -50';
    const motif = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">
      <g fill="${c.fg}">
        <path d="${half}"/><path d="${half}" transform="scale(-1 1)"/>
        <path d="${leaves}"/><path d="${leaves}" transform="scale(-1 1)"/>
        <circle cx="0" cy="-71" r="3.2"/><circle cx="0" cy="73" r="2.6"/>
      </g>
      <path d="${curl}" fill="none" stroke="${c.fg}" stroke-width="2"/><path d="${curl}" transform="scale(-1 1)" fill="none" stroke="${c.fg}" stroke-width="2"/>
      <path d="M0 -44 C8 -38 17 -30 15 -19 C13 -10 5 -8 0 -3 C-5 -8 -13 -10 -15 -19 C-17 -30 -8 -38 0 -44Z M0 8 C9 12 21 21 20 33 C19 44 9 49 0 49 C-9 49 -19 44 -20 33 C-21 21 -9 12 0 8Z" fill="${c.bg}"/>
      <g fill="${c.ac}"><path d="M0 -34 L7 -22 L0 -10 L-7 -22Z"/><path d="M0 16 C7 22 11 30 0 42 C-11 30 -7 22 0 16Z"/><circle cx="0" cy="2.5" r="2.2"/></g>
    </g>`;
    const rosette = (x, y) => `<g fill="${c.ac}" transform="translate(${x} ${y})"><circle r="2.4"/><circle cx="0" cy="-7" r="1.6"/><circle cx="0" cy="7" r="1.6"/><circle cx="-7" cy="0" r="1.6"/><circle cx="7" cy="0" r="1.6"/></g>`;
    let inner = motif(60, 85, 0.8);
    for (const [x, y] of [[0, 0], [120, 0], [0, 170], [120, 170]]) inner += motif(x, y, 0.8);
    inner += rosette(60, 0) + rosette(60, 170) + rosette(0, 85) + rosette(120, 85);
    return { w, h, svg: svg(w, h, inner, c.bg) };
  };

  /* ---------- Küp (tumbling blocks) ---------- */
  G.cubes = (c) => {
    const s = 26, a = s * Math.cos(Math.PI / 6);
    const w = 2 * a, h = 3 * s;
    const cube = (cx, ty) => {
      const p = (pts) => pts.map(([x, y]) => `${f(x)},${f(y)}`).join(' ');
      return `<polygon points="${p([[cx, ty], [cx + a, ty + s / 2], [cx, ty + s], [cx - a, ty + s / 2]])}" fill="${c.ac}"/>` +
        `<polygon points="${p([[cx - a, ty + s / 2], [cx, ty + s], [cx, ty + 2 * s], [cx - a, ty + 1.5 * s]])}" fill="${c.fg}"/>` +
        `<polygon points="${p([[cx, ty + s], [cx + a, ty + s / 2], [cx + a, ty + 1.5 * s], [cx, ty + 2 * s]])}" fill="${c.bg}"/>`;
    };
    let inner = '';
    for (let j = -1; j <= 1; j++)
      for (let i = -1; i <= 1; i++) {
        inner += cube(a + 2 * a * i, 3 * s * j);
        inner += cube(2 * a * i, 1.5 * s + 3 * s * j);
      }
    return { w: f(w), h, svg: svg(f(w), h, inner, c.bg) };
  };

  /* ---------- Art Deco yelpaze ---------- */
  G.fans = (c) => {
    const r = 30, w = 60, h = 60;
    const fan = (x, y) => {
      let g = `<circle cx="${x}" cy="${y}" r="${r}" fill="${c.bg}"/>`;
      for (const rr of [29, 23, 17, 11]) g += `<circle cx="${x}" cy="${y}" r="${rr}" fill="none" stroke="${c.fg}" stroke-width="1.4"/>`;
      for (let k = 1; k < 6; k++) {
        const ang = Math.PI + (Math.PI * k) / 6;
        g += `<line x1="${f(x + Math.cos(ang) * 11)}" y1="${f(y + Math.sin(ang) * 11)}" x2="${f(x + Math.cos(ang) * 17)}" y2="${f(y + Math.sin(ang) * 17)}" stroke="${c.ac}" stroke-width="1.2"/>`;
      }
      g += `<circle cx="${x}" cy="${y}" r="4.5" fill="${c.ac}"/>`;
      return g;
    };
    let inner = '';
    const rows = [[-30, [30]], [0, [0, 60]], [30, [30]], [60, [0, 60]], [90, [30]]];
    for (const [y, xs] of rows) for (const x of xs) inner += fan(x, y);
    return { w, h, svg: svg(w, h, inner, c.bg) };
  };

  /* ---------- Ogee kafes ---------- */
  G.ogee = (c) => {
    const w = 64, h = 88;
    const inner = `<g fill="none" stroke="${c.fg}" stroke-width="2.2">
      <path d="M32 0 C32 22 64 22 64 44 C64 66 32 66 32 88"/>
      <path d="M32 0 C32 22 0 22 0 44 C0 66 32 66 32 88"/>
    </g>
    <g fill="none" stroke="${c.ac}" stroke-width="1">
      <path d="M32 10 C32 26 54 28 54 44 C54 60 32 62 32 78 C32 62 10 60 10 44 C10 28 32 26 32 10Z"/>
    </g>
    <g fill="${c.ac}"><circle cx="32" cy="44" r="3"/><circle cx="0" cy="0" r="3.5"/><circle cx="64" cy="0" r="3.5"/><circle cx="0" cy="88" r="3.5"/><circle cx="64" cy="88" r="3.5"/>
    <path d="M32 36 L35 44 L32 52 L29 44Z"/></g>`;
    return { w, h, svg: svg(w, h, inner, c.bg) };
  };

  /* ---------- İç içe halkalar ---------- */
  G.rings = (c) => {
    const w = 48, h = 48, r = 24;
    let inner = `<g fill="none" stroke="${c.fg}" stroke-width="1.3">`;
    for (const [x, y] of [[0, 0], [48, 0], [0, 48], [48, 48], [24, 24]]) inner += `<circle cx="${x}" cy="${y}" r="${r}"/>`;
    inner += `</g><g fill="${c.ac}">`;
    for (const [x, y] of [[24, 0], [0, 24], [48, 24], [24, 48]]) inner += `<circle cx="${x}" cy="${y}" r="2"/>`;
    inner += `</g>`;
    return { w, h, svg: svg(w, h, inner, c.bg) };
  };

  /* ---------- Botanik yapraklar ---------- */
  G.leaves = (c, seed = 3) => {
    const w = 180, h = 180, R = rng(seed);
    const leaf = (x, y, rot, s, col) =>
      `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})">
        <path d="M-6 0 L0 0" stroke="${col}" stroke-width="2"/>
        <path d="M0 0 C12 -15 40 -16 54 0 C40 16 12 15 0 0Z" fill="${col}"/>
        <path d="M2 0 L50 0 M14 0 L22 -7 M26 0 L34 -8 M14 0 L22 7 M26 0 L34 8" stroke="${c.bg}" stroke-width="1" opacity=".55" fill="none"/>
      </g>`;
    let inner = '';
    const n = 4;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const x = (i + 0.5) * (w / n) + (R() - 0.5) * 22;
        const y = (j + 0.5) * (h / n) + (R() - 0.5) * 22;
        const rot = R() * 360, s = 0.55 + R() * 0.35;
        const col = R() > 0.38 ? c.fg : c.ac;
        inner += wrapped(w, h, x, y, 52 * s, (X, Y) => leaf(X, Y, rot, s, col));
      }
    return { w, h, svg: svg(w, h, inner, c.bg) };
  };

  /* ---------- Ginkgo ---------- */
  G.ginkgo = (c, seed = 11) => {
    const w = 160, h = 160, R = rng(seed);
    const leaf = (x, y, rot, s, col) =>
      `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})">
        <path d="M0 0 L0 14" stroke="${col}" stroke-width="1.8"/>
        <path d="M0 0 C-4 -8 -22 -22 -20 -34 C-12 -42 -3 -40 0 -36 C3 -40 12 -42 20 -34 C22 -22 4 -8 0 0Z" fill="${col}"/>
        <path d="M0 -2 L-14 -32 M0 -2 L-7 -36 M0 -2 L7 -36 M0 -2 L14 -32" stroke="${c.bg}" stroke-width=".8" opacity=".5"/>
      </g>`;
    let inner = '';
    const n = 4;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const x = (i + 0.5) * (w / n) + (R() - 0.5) * 16 + (j % 2) * 10;
        const y = (j + 0.5) * (h / n) + (R() - 0.5) * 14;
        const rot = (R() - 0.5) * 120 + (R() > 0.5 ? 180 : 0), s = 0.6 + R() * 0.3;
        inner += wrapped(w, h, x, y, 42 * s, (X, Y) => leaf(X, Y, rot, s, R() > 0.3 ? c.fg : c.ac));
      }
    return { w, h, svg: svg(w, h, inner, c.bg) };
  };

  /* ---------- Okaliptüs dalları ---------- */
  G.eucalyptus = (c) => {
    const w = 150, h = 200;
    const branch = (x, y, rot, flip) => {
      let g = `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${flip} 1)"><path d="M0 0 C10 -40 4 -90 18 -140" stroke="${c.fg}" stroke-width="1.6" fill="none"/>`;
      for (let k = 0; k < 7; k++) {
        const t = k / 7;
        const px = 10 * t + 6 * Math.sin(t * 3), py = -140 * t - 8;
        const side = k % 2 ? 1 : -1;
        const r = 9 - k * 0.6;
        g += `<ellipse cx="${f(px + side * r)}" cy="${f(py)}" rx="${f(r)}" ry="${f(r * 0.8)}" fill="${k % 3 === 0 ? c.ac : c.fg}" opacity=".92"/>`;
      }
      return g + `</g>`;
    };
    let inner = '';
    inner += wrapped(w, h, 40, 170, 160, (X, Y) => branch(X, Y, 8, 1));
    inner += wrapped(w, h, 115, 70, 160, (X, Y) => branch(X, Y, -12, -1));
    return { w, h, svg: svg(w, h, inner, c.bg) };
  };

  /* ---------- İnce çizgi ---------- */
  G.pinstripe = (c) => {
    const w = 22, h = 4;
    const inner = `<rect x="0" width="1.2" height="${h}" fill="${c.fg}"/><rect x="11" width=".6" height="${h}" fill="${c.ac}" opacity=".8"/>`;
    return { w, h, svg: svg(w, h, inner, c.bg) };
  };

  /* ---------- Regency geniş çizgi ---------- */
  G.regency = (c) => {
    const w = 64, h = 4;
    const inner = `<rect x="0" width="26" height="${h}" fill="${c.fg}"/><rect x="30" width="1.6" height="${h}" fill="${c.ac}"/><rect x="60" width="1.6" height="${h}" fill="${c.ac}"/>`;
    return { w, h, svg: svg(w, h, inner, c.bg) };
  };

  /* ---------- Zikzak ---------- */
  G.chevron = (c) => {
    const w = 40, h = 26;
    const inner = `<polygon points="0,0 20,10 40,0 40,7 20,17 0,7" fill="${c.fg}"/><polyline points="0,15 20,25 40,15" fill="none" stroke="${c.ac}" stroke-width="1.2"/>`;
    return { w, h, svg: svg(w, h, inner, c.bg) };
  };

  /* ---------- Dalga ---------- */
  G.waves = (c) => {
    const w = 56, h = 28;
    const inner = `<path d="M0 8 Q14 0 28 8 T56 8" fill="none" stroke="${c.fg}" stroke-width="2"/><path d="M0 22 Q14 14 28 22 T56 22" fill="none" stroke="${c.ac}" stroke-width="1.2"/>`;
    return { w, h, svg: svg(w, h, inner, c.bg) };
  };

  /* ---------- Keten doku ---------- */
  G.linen = (c, seed = 2) => {
    const w = 200, h = 200;
    const defs = `<filter id="a" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9 0.035" numOctaves="2" seed="${seed}" stitchTiles="stitch"/><feColorMatrix type="luminanceToAlpha"/></filter>
      <filter id="b" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.035 0.9" numOctaves="2" seed="${seed + 5}" stitchTiles="stitch"/><feColorMatrix type="luminanceToAlpha"/></filter>
      <filter id="d" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed="${seed + 9}" stitchTiles="stitch"/><feColorMatrix type="luminanceToAlpha"/></filter>`;
    const inner = `<rect width="${w}" height="${h}" fill="${c.fg}" filter="url(#d)" opacity=".35"/>
      <rect width="${w}" height="${h}" filter="url(#a)" opacity=".22"/>
      <rect width="${w}" height="${h}" filter="url(#b)" opacity=".18"/>`;
    return { w, h, svg: svg(w, h, inner, c.bg, defs) };
  };

  /* ---------- Mermer ---------- */
  G.marble = (c, seed = 7) => {
    const w = 420, h = 420;
    const defs = `<filter id="m" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
        <feTurbulence type="turbulence" baseFrequency="0.0035 0.009" numOctaves="5" seed="${seed}" stitchTiles="stitch" result="t"/>
        <feColorMatrix in="t" type="luminanceToAlpha" result="a"/>
        <feComponentTransfer in="a" result="v"><feFuncA type="table" tableValues="0 0.05 0.9 0.15 0 0 0 0 0 0 0 0"/></feComponentTransfer>
        <feFlood flood-color="${c.fg}"/><feComposite in2="v" operator="in"/>
      </filter>
      <filter id="g" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
        <feTurbulence type="turbulence" baseFrequency="0.006 0.014" numOctaves="4" seed="${seed + 3}" stitchTiles="stitch" result="t"/>
        <feColorMatrix in="t" type="luminanceToAlpha" result="a"/>
        <feComponentTransfer in="a" result="v"><feFuncA type="table" tableValues="0 0 0 0.7 0 0 0 0 0 0"/></feComponentTransfer>
        <feFlood flood-color="${c.ac}"/><feComposite in2="v" operator="in"/>
      </filter>
      <filter id="cl" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.004" numOctaves="3" seed="${seed + 8}" stitchTiles="stitch"/><feColorMatrix type="luminanceToAlpha"/></filter>`;
    const inner = `<rect width="${w}" height="${h}" fill="${c.fg}" filter="url(#cl)" opacity=".14"/>
      <rect width="${w}" height="${h}" filter="url(#g)" opacity=".8"/>
      <rect width="${w}" height="${h}" filter="url(#m)"/>`;
    return { w, h, svg: svg(w, h, inner, c.bg, defs) };
  };

  /* ---------- Terrazzo ---------- */
  G.terrazzo = (c, seed = 5) => {
    const w = 220, h = 220, R = rng(seed);
    const cols = [c.fg, c.ac, c.c3 || c.fg];
    let inner = '';
    for (let k = 0; k < 46; k++) {
      const x = R() * w, y = R() * h, r = 3 + R() * 9, n = 4 + Math.floor(R() * 3), rot = R() * 6.28;
      const col = cols[k % 3];
      const pts = [];
      for (let p = 0; p < n; p++) {
        const ang = rot + (p / n) * Math.PI * 2, rr = r * (0.6 + R() * 0.5);
        pts.push([Math.cos(ang) * rr, Math.sin(ang) * rr]);
      }
      inner += wrapped(w, h, x, y, r * 1.2, (X, Y) =>
        `<polygon points="${pts.map(([px, py]) => `${f(X + px)},${f(Y + py)}`).join(' ')}" fill="${col}"/>`);
    }
    for (let k = 0; k < 90; k++) {
      const x = R() * w, y = R() * h;
      inner += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.6 + R() * 1.2)}" fill="${cols[k % 3]}" opacity=".7"/>`;
    }
    return { w, h, svg: svg(w, h, inner, c.bg) };
  };

  /* ---------- Ekose ---------- */
  G.tartan = (c) => {
    const w = 96, h = 96;
    const inner = `<g opacity=".55" fill="${c.fg}"><rect y="0" width="${w}" height="30"/><rect x="0" width="30" height="${h}"/></g>
      <g opacity=".35" fill="${c.fg}"><rect y="48" width="${w}" height="10"/><rect x="48" width="10" height="${h}"/></g>
      <g fill="${c.ac}" opacity=".85"><rect y="13" width="${w}" height="3"/><rect x="13" width="3" height="${h}"/></g>
      <g fill="${c.c3 || c.bg}" opacity=".7"><rect y="72" width="${w}" height="2"/><rect x="72" width="2" height="${h}"/></g>`;
    return { w, h, svg: svg(w, h, inner, c.bg) };
  };

  /* ---------- Yıldızlı gece (çocuk) ---------- */
  G.stars = (c, seed = 9) => {
    const w = 180, h = 180, R = rng(seed);
    const star = (x, y, r, col, rot) => {
      const pts = [];
      for (let k = 0; k < 10; k++) {
        const ang = rot + (k * Math.PI) / 5 - Math.PI / 2, rr = k % 2 ? r * 0.45 : r;
        pts.push(`${f(x + Math.cos(ang) * rr)},${f(y + Math.sin(ang) * rr)}`);
      }
      return `<polygon points="${pts.join(' ')}" fill="${col}"/>`;
    };
    let inner = '';
    const n = 4;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const x = (i + 0.5) * (w / n) + (R() - 0.5) * 24, y = (j + 0.5) * (h / n) + (R() - 0.5) * 24;
        const r = 5 + R() * 7, rot = R(), col = R() > 0.5 ? c.fg : c.ac;
        inner += wrapped(w, h, x, y, r, (X, Y) => star(X, Y, r, col, rot));
      }
    for (let k = 0; k < 40; k++) inner += `<circle cx="${f(R() * w)}" cy="${f(R() * h)}" r="${f(0.8 + R() * 1.3)}" fill="${k % 2 ? c.fg : c.ac}" opacity=".8"/>`;
    inner += wrapped(w, h, 128, 40, 14, (X, Y) => `<path d="M${X} ${Y - 12} A12 12 0 1 0 ${X} ${Y + 12} A9 9 0 1 1 ${X} ${Y - 12}Z" fill="${c.ac}"/>`);
    return { w, h, svg: svg(w, h, inner, c.bg) };
  };

  /* ---------- Gökkuşağı (çocuk) ---------- */
  G.rainbow = (c) => {
    const w = 90, h = 104;
    const arch = (x, y) => {
      const cols = [c.fg, c.ac, c.c3 || c.fg];
      let g = '';
      [26, 19, 12].forEach((r, i) => {
        g += `<path d="M${x - r} ${y} A${r} ${r} 0 0 1 ${x + r} ${y}" fill="none" stroke="${cols[i]}" stroke-width="5.5" stroke-linecap="round"/>`;
      });
      return g;
    };
    let inner = wrapped(w, h, 24, 40, 30, arch) + wrapped(w, h, 69, 92, 30, arch);
    inner += `<g fill="${c.ac}" opacity=".6"><circle cx="66" cy="22" r="2"/><circle cx="20" cy="76" r="2"/><circle cx="84" cy="54" r="1.4"/><circle cx="44" cy="62" r="1.4"/></g>`;
    return { w, h, svg: svg(w, h, inner, c.bg) };
  };

  /* ---------- Dağlar (çocuk) ---------- */
  G.mountains = (c) => {
    const w = 140, h = 110;
    const m = (x, y, s, col) =>
      `<g transform="translate(${x} ${y}) scale(${s})"><polygon points="-30,0 0,-44 30,0" fill="${col}"/><polygon points="0,-44 -9,-31 -3,-34 2,-29 9,-31" fill="${c.bg}"/></g>`;
    const tree = (x, y) => `<g transform="translate(${x} ${y})"><polygon points="-6,0 0,-16 6,0" fill="${c.c3 || c.fg}"/><rect x="-1" y="0" width="2" height="4" fill="${c.c3 || c.fg}"/></g>`;
    let inner = '';
    inner += wrapped(w, h, 36, 50, 34, (X, Y) => m(X, Y, 1, c.fg)) + wrapped(w, h, 66, 50, 34, (X, Y) => m(X, Y, 0.75, c.ac));
    inner += wrapped(w, h, 106, 104, 34, (X, Y) => m(X, Y, 1, c.fg)) + wrapped(w, h, 136, 104, 34, (X, Y) => m(X, Y, 0.75, c.ac));
    inner += tree(14, 54) + tree(92, 52) + tree(80, 108) + tree(48, 106);
    inner += `<g fill="${c.ac}"><circle cx="110" cy="20" r="2"/><circle cx="20" cy="84" r="1.6"/><circle cx="60" cy="76" r="1.3"/></g>`;
    return { w, h, svg: svg(w, h, inner, c.bg) };
  };

  /* ---------- Puantiye ---------- */
  G.dots = (c) => {
    const w = 36, h = 36;
    const inner = `<circle cx="9" cy="9" r="3.4" fill="${c.fg}"/><circle cx="27" cy="27" r="3.4" fill="${c.ac}"/>`;
    return { w, h, svg: svg(w, h, inner, c.bg) };
  };

  /* ---------- Kemer (deco) ---------- */
  G.arches = (c) => {
    const w = 60, h = 76;
    const inner = `<path d="M7 76 L7 32 A23 23 0 0 1 53 32 L53 76" fill="${c.fg}" opacity=".16"/>
      <path d="M7 76 L7 32 A23 23 0 0 1 53 32 L53 76" fill="none" stroke="${c.fg}" stroke-width="2"/>
      <path d="M15 76 L15 34 A15 15 0 0 1 45 34 L45 76" fill="none" stroke="${c.ac}" stroke-width="1.2"/>
      <circle cx="30" cy="22" r="2.6" fill="${c.ac}"/>`;
    return { w, h, svg: svg(w, h, inner, c.bg) };
  };

  /* ---------- Fas karosu ---------- */
  G.moroccan = (c) => {
    const w = 60, h = 60;
    const lantern = (x, y) => `<path transform="translate(${x} ${y})" d="M0 -30 C8 -22 18 -18 18 -10 C18 -2 12 0 12 0 C12 0 18 2 18 10 C18 18 8 22 0 30 C-8 22 -18 18 -18 10 C-18 2 -12 0 -12 0 C-12 0 -18 -2 -18 -10 C-18 -18 -8 -22 0 -30Z" fill="none" stroke="${c.fg}" stroke-width="2"/>`;
    let inner = lantern(30, 30) + lantern(0, 0) + lantern(60, 0) + lantern(0, 60) + lantern(60, 60);
    inner += `<g fill="${c.ac}"><circle cx="30" cy="30" r="2.5"/><circle cx="0" cy="30" r="2"/><circle cx="60" cy="30" r="2"/><circle cx="30" cy="0" r="2"/><circle cx="30" cy="60" r="2"/></g>`;
    return { w, h, svg: svg(w, h, inner, c.bg) };
  };

  /* ---------- Balık pulu ---------- */
  G.scales = (c) => {
    const w = 40, h = 40, r = 20;
    let inner = '';
    const rows = [[-20, [20]], [0, [0, 40]], [20, [20]], [40, [0, 40]], [60, [20]]];
    for (const [y, xs] of rows)
      for (const x of xs)
        inner += `<circle cx="${x}" cy="${y}" r="${r}" fill="${(x + y) % 40 === 0 ? c.bg : c.c3 || c.bg}" stroke="${c.fg}" stroke-width="1.4"/><circle cx="${x}" cy="${y}" r="${r - 6}" fill="none" stroke="${c.ac}" stroke-width=".8"/>`;
    return { w, h, svg: svg(w, h, inner, c.bg) };
  };

  /* ---------- Genel API ---------- */
  const cache = new Map();
  function render(type, colors, seed) {
    const key = type + JSON.stringify(colors) + (seed || '');
    if (cache.has(key)) return cache.get(key);
    const gen = G[type];
    if (!gen) throw new Error('Bilinmeyen desen: ' + type);
    const r = gen(colors, seed);
    const out = { url: enc(r.svg), w: r.w, h: r.h };
    cache.set(key, out);
    return out;
  }

  window.HazarPatterns = { render, types: Object.keys(G) };
})();
