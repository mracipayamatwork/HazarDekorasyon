# Hazar Dekorasyon — Tanıtım Sitesi

Sadece frontend (HTML + CSS + JavaScript). Kurulum veya derleme gerekmez.

## Çalıştırma

`index.html` dosyasına çift tıklayarak açabilirsiniz. Yerel sunucu ile açmak için:

```
python -m http.server 5173
```

Ardından tarayıcıda `http://localhost:5173` adresini açın.

## Yayınlama (GitHub Pages + Actions)

`.github/workflows/deploy.yml`, `main` dalına yapılan her gönderimde siteyi otomatik yayınlar.

1. GitHub'da depoyu açın, **Settings → Pages → Build and deployment → Source** alanını **GitHub Actions** yapın.
2. Kodu `main` dalına gönderin (`git push`).
3. **Actions** sekmesinde iş akışı bitince site `https://<kullanıcı-adı>.github.io/<depo-adı>/` adresinde yayında olur.

## Sayfalar

| Dosya | İçerik |
|---|---|
| `index.html` | Ana sayfa: hero, renkler, hizmetler, **Odanda Gör** (önce/sonra), koleksiyonlar, çok satanlar, süreç, galeri, yorumlar, Instagram, iletişim |
| `katalog.html` | Duvar kağıdı kataloğu: kategori, renk, mekân, materyal filtreleri, arama, sıralama, favoriler, ürün detayı, rulo hesaplayıcı |

## Klasör yapısı

```
assets/
  css/style.css      Ortak stiller (renkler, tipografi, bileşenler)
  css/katalog.css    Katalog sayfasına özel stiller
  js/patterns.js     Duvar kağıdı desenlerini SVG olarak üreten motor
  js/data.js         Katalog verisi (ürünler, renk tonları, kategoriler)
  js/main.js         Ortak bileşenler (menü, modal, favoriler, Odanda Gör)
  js/home.js         Ana sayfa etkileşimleri
  js/katalog.js      Katalog filtreleme ve arama
```

## Katalog nasıl güncellenir?

`assets/js/data.js` dosyasında:

- **Desenli ürün eklemek:** `COLLECTIONS` listesindeki bir koleksiyona yeni renk satırı ekleyin
  (`['Varyant adı', 'ton', '#arkaplan', '#desen', '#vurgu']`).
- **Fotoğraflı ürün eklemek:** `PHOTO_ITEMS` listesine satır ekleyin. Şimdilik Unsplash görsel kimliği kullanılıyor.
  Kendi ürün fotoğraflarınızı `assets/img/` klasörüne koyup `data.js` içindeki `IMG` fonksiyonunu
  buna göre düzenleyebilirsiniz.

## Backend gerektirmeyen çözümler

- İletişim formu → bilgileri WhatsApp mesajı olarak hazırlar (`wa.me`).
- Favoriler → tarayıcının `localStorage` alanında saklanır, listeyi WhatsApp'tan gönderme butonu vardır.
- Fiyat sorma → her üründe ürün koduyla hazır WhatsApp mesajı.

## Yayına almadan önce güncellenecekler

- `index.html` içindeki rakamlar (500+ proje, 10+ yıl), müşteri yorumları ve çalışma saatleri **örnek** içeriktir.
- Galeri, hizmet ve Instagram görselleri Unsplash'ten alınmış ücretsiz görsellerdir; firmanın kendi iş fotoğraflarıyla değiştirilmesi önerilir.
- Adres bilgisi eklenmedi (Instagram profilinde yer almıyor).
