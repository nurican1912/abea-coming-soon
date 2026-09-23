/*!
 * ABEA açılış animasyonu
 * ----------------------
 * Hikâye: merkezde episantr belirir → dalga halkası yayılır →
 * ince yaylar soldan aşağı kıvrılır → ayrım hattında kalınlaşıp
 * alttan dönerek yukarı çubuklara dönüşür → yanında kelime markası açılır.
 *
 * Teknik: her şerit bir <path>. stroke-dasharray = yolun tam uzunluğu,
 * stroke-dashoffset aynı değerden 0'a animasyonlanınca çizgi "çizilmiş" gibi
 * görünür. İnce ve kalın parçalar ardışık tetiklendiği için kalınlık
 * değişimi tek bir sürekli hareket gibi okunur.
 *
 * Kullanım:
 *   import { playIntro } from './abea-intro.js';
 *   playIntro({ flyTo: '#site-logo' }).then(() => document.body.classList.add('ready'));
 */

import { buildLogo, fitWordmark } from './abea-logo.js';

const EASE_DRAW = 'cubic-bezier(.33, 0, .12, 1)';
const EASE_POP  = 'cubic-bezier(.2, .9, .25, 1.25)';
const EASE_SOFT = 'cubic-bezier(.4, 0, .2, 1)';

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Tüm parçaları başlangıç (gizli) durumuna alır.
 * DOM'a eklendikten hemen sonra, ilk kare çizilmeden çağrılmalıdır —
 * aksi halde logo bir an tam hâliyle görünüp sonra kaybolur.
 */
export function prepare(logo) {
  for (const path of [...logo.thin, ...logo.thick]) {
    const len = path.getTotalLength();
    path.dataset.len = len;
    path.style.strokeDasharray = `${len}`;
    path.style.strokeDashoffset = `${len}`;
  }
  logo.dot.style.transformBox = 'fill-box';
  logo.dot.style.transformOrigin = 'center';
  logo.dot.style.transform = 'scale(0)';

  logo.ripple.style.transformBox = 'fill-box';
  logo.ripple.style.transformOrigin = 'center';

  logo.wordClips.forEach(rect => {
    rect.style.transformBox = 'fill-box';
    rect.style.transformOrigin = 'left center';
    rect.style.transform = 'scaleX(0)';
  });
  logo.words.forEach(t => { t.style.opacity = '0'; });
}

/** Hazırlanmış bir <path>'i çizer. */
function draw(path, { delay, duration, easing = EASE_DRAW }) {
  const len = Number(path.dataset.len);
  return path.animate(
    [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
    { delay, duration, easing, fill: 'both' }
  );
}

/**
 * Zaman çizelgesi. `prepare()` çağrılmış bir logoyu oynatır ve
 * Animation nesnelerini döner. Katmandan, sayfadan ve CSS'ten bağımsızdır —
 * açılış katmanı da, dışa aktarma sayfası da bunu kullanır.
 *
 * @param {ReturnType<import('./abea-logo.js').buildLogo>} logo
 * @param {{speed?: number}} [opts]
 * @returns {Animation[]}
 */
export function animateLogo(logo, { speed = 1 } = {}) {
  const s = (ms) => Math.round(ms / speed);
  const anims = [];

  // 1) Episantr
  anims.push(logo.dot.animate(
    [{ transform: 'scale(0)' }, { transform: 'scale(1)' }],
    { duration: s(440), easing: EASE_POP, fill: 'both' }
  ));

  // 2) Yayılan dalga
  anims.push(logo.ripple.animate(
    [{ transform: 'scale(1)', opacity: 0.55 },
     { transform: 'scale(6.4)', opacity: 0 }],
    { delay: s(120), duration: s(1000), easing: EASE_SOFT, fill: 'both' }
  ));

  // 3) İnce yaylar → 4) kalınlaşıp yukarı çıkan çubuklar
  logo.thin.forEach((path, i) => {
    anims.push(draw(path, { delay: s(220 + i * 80), duration: s(700) }));
  });
  logo.thick.forEach((path, i) => {
    anims.push(draw(path, { delay: s(220 + i * 80 + 540), duration: s(760), easing: EASE_SOFT }));
  });

  // 5) Kelime markası — soldan sağa açılan perde
  logo.wordClips.forEach((rect, i) => {
    anims.push(rect.animate(
      [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
      { delay: s(1150 + i * 110), duration: s(620), easing: EASE_SOFT, fill: 'both' }
    ));
  });
  logo.words.forEach((t, i) => {
    anims.push(t.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { delay: s(1150 + i * 110), duration: s(300), easing: 'linear', fill: 'both' }
    ));
  });

  return anims;
}

/**
 * @param {object} opts
 * @param {HTMLElement|string} [opts.mount]   Animasyonun basılacağı kap (varsayılan: tam ekran katman)
 * @param {string}  [opts.flyTo]              Bitince logonun uçacağı hedef seçici (ör. header logosu)
 * @param {number}  [opts.speed=1]            1'den büyük = daha hızlı
 * @param {string}  [opts.once]               sessionStorage anahtarı; verilirse oturumda bir kez oynar
 * @param {Function}[opts.onSettle]           Logo yerine oturmadan hemen önce çalışır (sayfayı açmak için)
 * @returns {Promise<void>}
 */
export async function playIntro(opts = {}) {
  const { flyTo = null, speed = 1, once = null, onSettle = null } = opts;
  const s = (ms) => Math.round(ms / speed);

  const overlay = document.createElement('div');
  overlay.className = 'abea-intro';
  overlay.setAttribute('aria-hidden', 'true');

  const stage = document.createElement('div');
  stage.className = 'abea-intro__stage';
  overlay.append(stage);

  const logo = buildLogo();
  logo.svg.classList.add('abea-intro__logo');
  stage.append(logo.svg);

  const mount = typeof opts.mount === 'string'
    ? document.querySelector(opts.mount)
    : (opts.mount || document.body);
  mount.append(overlay);

  // Animasyonu atlaması gereken durumlar: hareket azaltma tercihi veya
  // bu oturumda zaten oynatılmış olması.
  const skip = prefersReducedMotion() || (once && sessionStorage.getItem(once) === '1');
  if (once) sessionStorage.setItem(once, '1');

  if (skip) {
    onSettle?.();
    overlay.remove();
    return;
  }

  // DOM'a eklendikten sonraki ilk kareden önce, senkron olarak gizle.
  prepare(logo);

  // Yazı tipi ağdan gelene kadar beklenir; logo bu sırada zaten gizli.
  await fitWordmark(logo.words);

  const anims = animateLogo(logo, { speed });

  await Promise.allSettled(anims.map(a => a.finished));
  await wait(s(260));

  if (flyTo) await flyToTarget(logo.svg, overlay, flyTo, s(700));
  else await fadeOut(overlay, s(480));

  overlay.remove();
  onSettle?.();
}

/** Katmanı söndürür. */
function fadeOut(overlay, duration) {
  return overlay.animate(
    [{ opacity: 1 }, { opacity: 0 }],
    { duration, easing: EASE_SOFT, fill: 'forwards' }
  ).finished.catch(() => {});
}

/**
 * FLIP: ortadaki büyük logoyu, sayfadaki asıl logo kutusunun üstüne taşıyıp
 * ölçekler. Katman opak kalır; logo yerine oturduğunda altındaki gerçek logo
 * zaten tıpatıp aynı yerdedir, bu yüzden katmanı kaldırmak görsel bir sıçrama
 * yaratmaz — çapraz geçiş gerekmez.
 */
async function flyToTarget(svg, overlay, selector, duration) {
  const target = document.querySelector(selector);
  if (!target) return fadeOut(overlay, duration);

  const from = svg.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  if (!to.width || !to.height) return fadeOut(overlay, duration);

  const scale = to.width / from.width;
  const dx = (to.left + to.width / 2) - (from.left + from.width / 2);
  const dy = (to.top + to.height / 2) - (from.top + from.height / 2);

  target.style.visibility = 'hidden';

  const move = svg.animate(
    [{ transform: 'translate(0,0) scale(1)' },
     { transform: `translate(${dx}px, ${dy}px) scale(${scale})` }],
    { duration, easing: 'cubic-bezier(.65,0,.2,1)', fill: 'both' }
  );

  await move.finished.catch(() => {});
  target.style.visibility = '';
}

const wait = (ms) => new Promise(r => setTimeout(r, ms));

export { buildLogo, fitWordmark };
