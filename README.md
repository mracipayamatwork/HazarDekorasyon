# Hazar Dekorasyon — Web Sitesi

ASP.NET Core 9 (Razor Pages) + Entity Framework Core. Geliştirmede **SQLite**, yayında **SQL Server** kullanılacak şekilde hazırlanmıştır.

## Özellikler

- **Site:** Ana sayfa, duvar kağıdı kataloğu (filtre, arama, favoriler, ürün detayı, "Odada Gör", rulo hesabı) ve **fiyat hesaplama** sayfası (`/fiyat-hesapla`).
- **Yönetim paneli (`/Admin`):**
  - Ürünler: ekle, düzenle, kopyala, yayından kaldır, sil. Desen motoruyla canlı önizleme veya fotoğraf yükleme.
  - Kategoriler, renk tonları, mekânlar.
  - Fiyat listesi: hizmet fiyatlarını tek ekranda güncelleme, toplu yüzde artış/indirim, hizmet ve seçenek ekleme.
  - Site ayarları: telefon, WhatsApp, Instagram, adres, çalışma saatleri, duyuru şeridi, KDV, minimum iş bedeli, rulo işçiliği.
  - Şifre değiştirme. Giriş denemeleri IP başına sınırlıdır.

## Kurulum ve çalıştırma

Gereken: [.NET 9 SDK](https://dotnet.microsoft.com/download)

1. Admin hesabı için yerel ayar dosyası oluşturun. Bu dosya git'e eklenmez:

   ```
   copy src\HazarDekorasyon.Web\appsettings.Local.example.json src\HazarDekorasyon.Web\appsettings.Local.json
   ```

   Ardından `appsettings.Local.json` içindeki kullanıcı adı ve şifreyi değiştirin.

2. Çalıştırın:

   ```
   dotnet run --project src/HazarDekorasyon.Web
   ```

İlk çalıştırmada veritabanı (`src/HazarDekorasyon.Web/App_Data/hazar.db`) otomatik oluşturulur. Örnek katalog (74 ürün), örnek fiyat listesi ve admin hesabı da otomatik yüklenir. Admin hesabı yalnızca veritabanında hiç admin yokken oluşturulur; sonraki şifre değişiklikleri panelden yapılır.

## Proje yapısı

```
src/HazarDekorasyon.Web/
  Models/Entities.cs        Veri modelleri (Ürün, Kategori, Ton, Mekân, Fiyat hizmeti/seçeneği, Ayar, Admin)
  Data/AppDbContext.cs      EF Core bağlamı
  Data/SeedData.cs          İlk açılışta yüklenen örnek veri
  Data/Migrations/          Veritabanı şeması (SQLite)
  Services/                 Ayarlar, katalog JSON'u, görsel yükleme, ondalık sayı bağlayıcı
  Pages/                    Site sayfaları (Index, Katalog, FiyatHesapla)
  Pages/Admin/              Yönetim paneli
  wwwroot/assets/           CSS, JS (desen motoru: patterns.js)
```

## SQL Server'a geçiş (yayından önce)

Henüz canlı veri olmadığı için en temiz yol, SQL Server için yeni bir başlangıç migration'ı üretmektir.

1. `appsettings.json` (veya sunucudaki ortam değişkenleri) içinde:

   ```json
   "Database": { "Provider": "SqlServer" },
   "ConnectionStrings": { "SqlServer": "Server=...;Database=HazarDekorasyon;User Id=...;Password=...;TrustServerCertificate=True" }
   ```

   Ortam değişkeniyle: `Database__Provider=SqlServer`, `ConnectionStrings__SqlServer=...`

2. SQLite migration'larını silip SQL Server için yeniden oluşturun:

   ```
   rmdir /s /q src\HazarDekorasyon.Web\Data\Migrations
   dotnet tool restore
   dotnet dotnet-ef migrations add InitialCreate -p src/HazarDekorasyon.Web -o Data/Migrations
   ```

   `dotnet-ef` komutu, migration üretirken de `Database:Provider` ayarına göre SQL Server'ı kullanır.

3. Uygulama ilk açılışta tabloları oluşturur ve örnek veriyi yükler.

SQLite'ta panelden girdiğiniz veriyi taşımak isterseniz, migration'ı üretmeden önce haber verin; basit bir aktarım betiği yazılabilir.

## Yayınlama

GitHub Pages yalnızca statik dosya sunduğu için bu .NET uygulamasını çalıştıramaz. Yayın için ASP.NET Core destekleyen bir sunucu gerekir: Windows hosting (Plesk/IIS), Azure App Service veya bir VPS.

`.github/workflows/build.yml` her gönderimde projeyi derler ve yayına hazır paketi Actions sekmesinde **hazar-dekorasyon-web** adıyla saklar. Bu paket sunucuya yüklenebilir.

Yayında dikkat edilecekler:

- `ASPNETCORE_ENVIRONMENT=Production` olmalı.
- Admin bilgileri ve bağlantı dizesi ortam değişkeni veya `appsettings.Local.json` ile verilmeli; depoya yazılmamalı.
- `wwwroot/uploads` klasörü yazılabilir olmalı (panelden yüklenen görseller burada saklanır).

## Yayından önce güncellenecek içerikler

- Ürün ve hizmet fiyatları **örnek** değerlerdir; panelden güncellenmelidir.
- Ana sayfadaki rakamlar (500+ proje, 10+ yıl) ve müşteri yorumları örnek içeriktir.
- Galeri ve hizmet görselleri Unsplash'ten alınmıştır; firmanın kendi iş fotoğraflarıyla değiştirilmesi önerilir.
