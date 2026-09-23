# ABEA — "Yakında" sayfası

Afet Bilinci Eğitim Araştırma Derneği'nin geçici açılış sayfası.
Bağımlılık yok, derleme adımı yok — düz HTML, CSS ve ES modülleri.

## Çalıştırma

`type="module"` kullanıldığı için dosyayı çift tıklayarak (`file://`) açmak
çalışmaz, küçük bir sunucu gerekir:

```bash
python -m http.server 8777
# http://127.0.0.1:8777/
```

Animasyon oturumda bir kez oynar (`sessionStorage`). Tekrar izlemek için yeni
sekmede aç ya da konsolda `sessionStorage.clear()` çalıştır.

## Vercel'e alma

Statik site; ayar dosyası gerekmez. Repoyu bağlayıp deploy etmek yeterli
(Framework Preset: **Other**, build komutu yok, output dizini kök).
CLI ile çıkarsan `.vercelignore` kaynak belgeleri zaten hariç tutuyor.

## Dosyalar

| Dosya | İş |
|---|---|
| `index.html` | Sayfanın tamamı |
| `assets/js/abea-logo.js` | Logonun vektör geometrisi — **tek kaynak** |
| `assets/js/abea-intro.js` | Açılış animasyonunun zaman çizelgesi |
| `assets/css/abea-intro.css` | Animasyon katmanının stilleri (bağımsız) |
| `assets/css/abea.css` | Renk değişkenleri ve sayfa stilleri |
| `assets/img/abea-mark.svg` | Yalnızca sembol — favicon |
| `logo-animasyon.svg` | Animasyonun kendi kendine yeten vektör hâli (4 KB) |

Depoya girmeyenler (bkz. `.gitignore`): PDF/DOCX kaynak belgeler, WhatsApp
görselleri, orijinal logo JPEG'i ve üretilen GIF'ler.

## Logonun geometrisi

Orijinal logo piksel piksel ölçülüp yeniden kurgulandı:

- merkez `(125, 197)`, episantr yarıçapı `19`
- 6 eş merkezli halka; ince yay yarıçapları `34 + 17.2·i`,
  kalın çubuk yarıçapları bunun `8.5` içi
- ince çizgi `6` px, kalın çizgi `13.5` px
- ince/kalın ayrım hattı: `x = 143.7`

Her şerit iki `<path>`tir ve ikisi de **aynı yönde** çizilir: üstten başlar,
soldan aşağı döner, ayrım hattında kalınlaşır, alttan sağa kıvrılır, yukarı
çubuk olur. Animasyon bu yolu izler — uydurma değil, logonun kendi mantığı.

## Animasyon tekniği

`stroke-dasharray` yolun tam uzunluğuna eşitlenir, `stroke-dashoffset` aynı
değerden `0`'a animasyonlanır; çizgi çiziliyormuş gibi görünür. İnce ve kalın
parçalar ardışık tetiklendiği için kalınlık değişimi tek bir sürekli hareket
olarak okunur.

İki kritik ayrıntı — bozulursa logo bir an tam hâliyle görünür:

1. Gizli başlangıç durumu, DOM'a eklendikten sonra **ilk kare çizilmeden
   senkron olarak** verilir (`prepare()`).
2. Tüm animasyonlar `fill: 'both'` kullanır; `'forwards'` yetmez, çünkü
   gecikmeli başlayan parçalar gecikme boyunca görünür kalır.

## Başka projeye taşımak

Üç dosya kendi kendine yeter, sayfayla sıfır bağı vardır:

```
abea-logo.js  +  abea-intro.js  +  abea-intro.css
```

```js
import { playIntro } from './abea-intro.js';

await playIntro({
  flyTo: '#header-logo svg',   // bitince logo oradaki kutuya oturur (FLIP)
  once:  'abea-intro-played',  // oturumda bir kez
  speed: 1,                    // 1.3 = daha hızlı
  onSettle: () => document.body.classList.add('abea-ready')
});
```

React/Next için `useEffect` içinde çağırmak yeterli. Yalnızca animasyonu kendin
sürmek istersen `buildLogo()` → `prepare()` → `animateLogo()` üçlüsü de dışa
aktarılmış durumda.

`prefers-reduced-motion: reduce` seçiliyse animasyon otomatik atlanır.

## Yazı tipi

Kelime markası **Barlow Semi Condensed** ile diziliyor — orijinale çok yakın
ama birebir değil. Gerçek logo yazı tipi öğrenilirse `assets/css/abea.css`
içindeki `--abea-font` değişkenini değiştirmek yeterli. Kesin sonuç için yazı
outline'a çevrilip `<path>` olarak gömülmeli.

Dört satır `fitWordmark()` ile tam `192` birime oturtulur: punto ölçeklenir,
harfler yatay ezilmez.

## Renk

Logodan ölçülen mavi: `#28ADE5`. Beyaz üzerinde kontrast oranı ~2.2:1 — logo
için sorun değil, **gövde metni ve bağlantı rengi olarak kullanılamaz**. Onun
için `--abea-blue-deep` (`#1B7FAB`) tanımlı.

## Metinlerin kaynağı

Başlık, derneğin `WEB.docx` belgesindeki "Değerlerimiz" bölümünün 02. maddesinin
kısaltılmış hâlidir; özgün cümle "…bir yardım konusu olarak değil, herkesin
sahip olduğu bir hak olarak görürüz" biçimindedir. Slogana dönüştürülmüş hâli
yönetimin onayına tabidir.
