/*!
 * ABEA logo — geometrik yeniden yapım (tek kaynak)
 * ------------------------------------------------
 * Logo, merkezi (125, 197) olan eş merkezli dairelerden kuruludur.
 * Her "şerit" iki parçadan oluşur:
 *   1) THIN  : x = 143.7 ayrım hattının solunda kalan ince yay (6 px)
 *   2) THICK : aynı hattın sağında, alttan dönüp yukarı çıkan kalın çubuk (13.5 px)
 * İkisinin çizim yönü aynıdır: üstten başlar, soldan aşağı döner,
 * alttan sağa kıvrılır ve yukarı çıkar. Animasyon tam olarak bu yolu izler.
 *
 * Ölçüler orijinal logo_abea.jpg.jpeg dosyasından piksel ölçümüyle çıkarıldı.
 */

export const ABEA = {
  viewBox: '0 0 458 332',
  color: '#28ADE5',
  center: { x: 125, y: 197 },
  splitX: 143.7,        // ince/kalın geçiş hattı
  dotR: 19,
  thinWidth: 6,
  thickWidth: 13.5,

  // i = 0 (en içteki) → 5 (en dıştaki)
  ribbons: [
    { thin: 'M 143.70 168.60 A 34.00 34.00 0 1 0 143.70 225.40',
      thick: 'M 143.70 214.34 A 25.50 25.50 0 0 0 150.50 197.00 L 150.50 5.50' },
    { thin: 'M 143.70 149.34 A 51.20 51.20 0 1 0 143.70 244.66',
      thick: 'M 143.70 235.39 A 42.70 42.70 0 0 0 167.70 197.00 L 167.70 5.50' },
    { thin: 'M 143.70 131.21 A 68.40 68.40 0 1 0 143.70 262.79',
      thick: 'M 143.70 253.91 A 59.90 59.90 0 0 0 184.90 197.00 L 184.90 5.50' },
    { thin: 'M 143.70 113.47 A 85.60 85.60 0 1 0 143.70 280.53',
      thick: 'M 143.70 271.80 A 77.10 77.10 0 0 0 202.10 197.00 L 202.10 5.50' },
    { thin: 'M 143.70 95.92 A 102.80 102.80 0 1 0 143.70 298.08',
      thick: 'M 143.70 289.43 A 94.30 94.30 0 0 0 219.30 197.00 L 219.30 5.50' },
    { thin: 'M 143.70 78.47 A 120.00 120.00 0 1 0 143.70 315.53',
      thick: 'M 143.70 306.92 A 111.50 111.50 0 0 0 236.50 197.00 L 236.50 5.50' }
  ],

  // Kelime markası: dört satır da aynı genişliğe (192 px) yaslanır.
  wordmark: {
    x: 265.5,
    width: 192,
    lines: [
      { text: 'Afet',      y: 106.5, size: 143 },
      { text: 'Bilinci',   y: 183.5, size: 99 },
      { text: 'Eğitim',    y: 269.5, size: 111 },
      { text: 'Araştırma', y: 317.5, size: 62 }
    ]
  }
};

const SVG_NS = 'http://www.w3.org/2000/svg';
const el = (name, attrs = {}) => {
  const n = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};

let uid = 0;

/**
 * Logoyu SVG olarak kurar ve animasyonda kullanılacak parçaları geri döner.
 *
 * @param {object} opts
 * @param {boolean} opts.wordmark  Kelime markası çizilsin mi (varsayılan: true)
 * @param {string}  opts.color     Renk (varsayılan: #28ADE5)
 * @returns {{svg: SVGSVGElement, dot, ripple, thin: SVGPathElement[],
 *            thick: SVGPathElement[], words: SVGTextElement[], wordClips: SVGRectElement[]}}
 */
export function buildLogo(opts = {}) {
  const { wordmark = true, color = ABEA.color } = opts;
  const id = `abea-${++uid}`;

  const svg = el('svg', {
    xmlns: SVG_NS,
    viewBox: wordmark ? ABEA.viewBox : '0 0 250 332',
    fill: 'none',
    role: 'img',
    'aria-label': 'Afet Bilinci Eğitim Araştırma Derneği'
  });

  // Ayrım hattının iki yanını kırpan maskeler: ince ve kalın uçların
  // tam dikey kesilmesini sağlar (butt cap eğik keserdi).
  const defs = el('defs');
  const clipL = el('clipPath', { id: `${id}-l` });
  clipL.append(el('rect', { x: 0, y: 0, width: ABEA.splitX, height: 332 }));
  const clipR = el('clipPath', { id: `${id}-r` });
  clipR.append(el('rect', { x: ABEA.splitX, y: 0, width: 458 - ABEA.splitX, height: 332 }));
  defs.append(clipL, clipR);
  svg.append(defs);

  // Merkezden yayılan şok halkası (yalnızca animasyonda görünür)
  const ripple = el('circle', {
    cx: ABEA.center.x, cy: ABEA.center.y, r: ABEA.dotR,
    fill: 'none', stroke: color, 'stroke-width': 3, opacity: 0
  });
  svg.append(ripple);

  const gThin = el('g', {
    'clip-path': `url(#${id}-l)`, stroke: color,
    'stroke-width': ABEA.thinWidth, fill: 'none', 'stroke-linecap': 'butt'
  });
  const gThick = el('g', {
    'clip-path': `url(#${id}-r)`, stroke: color,
    'stroke-width': ABEA.thickWidth, fill: 'none', 'stroke-linecap': 'butt'
  });

  const thin = [], thick = [];
  for (const r of ABEA.ribbons) {
    const a = el('path', { d: r.thin });
    const b = el('path', { d: r.thick });
    gThin.append(a); gThick.append(b);
    thin.push(a); thick.push(b);
  }
  svg.append(gThin, gThick);

  // Merkez nokta (episantr) — kırpma dışında, iki yarıyı birleştirir
  const dot = el('circle', { cx: ABEA.center.x, cy: ABEA.center.y, r: ABEA.dotR, fill: color });
  svg.append(dot);

  const words = [], wordClips = [];
  if (wordmark) {
    const gWords = el('g', { fill: color });
    ABEA.wordmark.lines.forEach((line, i) => {
      const clip = el('clipPath', { id: `${id}-w${i}` });
      const rect = el('rect', {
        x: ABEA.wordmark.x - 2, y: line.y - line.size,
        width: ABEA.wordmark.width + 6, height: line.size * 1.45
      });
      clip.append(rect);
      defs.append(clip);

      const t = el('text', {
        x: ABEA.wordmark.x, y: line.y,
        'font-size': line.size,
        'font-family': 'var(--abea-font, "Barlow Semi Condensed"), system-ui, sans-serif',
        'font-weight': 600,
        'clip-path': `url(#${id}-w${i})`
      });
      t.textContent = line.text;
      gWords.append(t);
      words.push(t); wordClips.push(rect);
    });
    svg.append(gWords);
  }

  return { svg, dot, ripple, thin, thick, words, wordClips };
}

/**
 * Yazı tipi yüklendikten sonra her satırı tam 192 px'e oturtur.
 * Harfleri yatay ezmek yerine punto ölçekler — deformasyon olmaz.
 */
export async function fitWordmark(words) {
  if (!words.length) return;
  try { await document.fonts.ready; } catch { /* yok sayılır */ }
  words.forEach((t, i) => {
    const natural = t.getComputedTextLength();
    if (!natural) return;
    const size = ABEA.wordmark.lines[i].size * (ABEA.wordmark.width / natural);
    t.setAttribute('font-size', size.toFixed(2));
  });
}
