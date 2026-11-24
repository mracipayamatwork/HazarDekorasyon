using HazarDekorasyon.Web.Models;
using HazarDekorasyon.Web.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace HazarDekorasyon.Web.Data;

/// <summary>Boş veritabanına başlangıç verisini yükler. Veri varsa hiçbir şeye dokunmaz.</summary>
public static class SeedData
{
    public static async Task InitializeAsync(IServiceProvider sp)
    {
        using var scope = sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        var log = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("SeedData");

        await db.Database.MigrateAsync();

        await SeedAdminAsync(db, config, log);
        if (!await db.Categories.AnyAsync()) await SeedCatalogAsync(db);
        if (!await db.PriceServices.AnyAsync()) await SeedPricesAsync(db);
        if (!await db.SiteSettings.AnyAsync())
        {
            db.SiteSettings.AddRange(SettingKeys.All.Select(d => new SiteSetting { Key = d.Key, Value = d.Default }));
            await db.SaveChangesAsync();
        }
    }

    private static async Task SeedAdminAsync(AppDbContext db, IConfiguration config, ILogger log)
    {
        if (await db.AdminUsers.AnyAsync()) return;
        var user = config["Admin:UserName"];
        var pass = config["Admin:Password"];
        if (string.IsNullOrWhiteSpace(user) || string.IsNullOrWhiteSpace(pass))
        {
            log.LogWarning("Admin kullanıcısı oluşturulmadı: 'Admin:UserName' ve 'Admin:Password' ayarlarını girin.");
            return;
        }
        var admin = new AdminUser { UserName = user };
        admin.PasswordHash = new PasswordHasher<AdminUser>().HashPassword(admin, pass);
        db.AdminUsers.Add(admin);
        await db.SaveChangesAsync();
        log.LogInformation("İlk admin kullanıcısı oluşturuldu: {User}", user);
    }

    private static async Task SeedCatalogAsync(AppDbContext db)
    {
        var tones = new[]
        {
            ("bej", "Bej", "#e9dcc6", "#c9b28f"), ("beyaz", "Beyaz", "#f7f4ef", "#dcd6cc"), ("gri", "Gri", "#c9c6c1", "#8a8782"),
            ("siyah", "Siyah", "#3a3836", "#141312"), ("yesil", "Yeşil", "#a9b89a", "#3f5a43"), ("mavi", "Mavi", "#a8c1d1", "#5b7f99"),
            ("lacivert", "Lacivert", "#3d4d6a", "#1c2639"), ("pembe", "Pembe", "#f0d3cf", "#d49a95"), ("altin", "Altın", "#e3c98f", "#b08d57"),
            ("kahve", "Kahve", "#b89276", "#6d4b36"), ("kirmizi", "Bordo", "#b4545e", "#6e1a26"),
        }.Select((t, i) => new Tone { Slug = t.Item1, Name = t.Item2, Color1 = t.Item3, Color2 = t.Item4, SortOrder = i }).ToList();

        const string U = "https://images.unsplash.com/photo-";
        const string Q = "?auto=format&fit=crop&w=1000&q=80";
        var cats = new[]
        {
            ("klasik", "Damask & Klasik", "Zamansız şıklık", U + "1785119774310-84850a185fb4" + Q, true),
            ("geometrik", "Geometrik", "Modern çizgiler", null, false),
            ("botanik", "Botanik & Çiçek", "Doğanın dokunuşu", U + "1792574471342-0249c7608c62" + Q, true),
            ("cizgili", "Çizgili", "Klasik ritim", null, false),
            ("doku", "Düz & Doku", "Sade & sıcak", U + "1779648596385-bac45f45d1ed" + Q, true),
            ("mermer", "Mermer & Taş", "Doğal taş etkisi", null, true),
            ("cocuk", "Çocuk Odası", "Hayal gücüne alan", null, true),
            ("panoramik", "Panoramik & Duvar Resmi", "Duvarınıza özel", null, false),
        }.Select((c, i) => new Category { Slug = c.Item1, Name = c.Item2, Tagline = c.Item3, CoverImageUrl = c.Item4, ShowOnHome = c.Item5, SortOrder = i }).ToList();

        var rooms = new[] { ("salon", "Salon"), ("yatak", "Yatak Odası"), ("cocuk", "Çocuk Odası"), ("ofis", "Ofis & İşyeri"), ("antre", "Antre & Koridor") }
            .Select((r, i) => new Room { Slug = r.Item1, Name = r.Item2, SortOrder = i }).ToList();

        db.Tones.AddRange(tones);
        db.Categories.AddRange(cats);
        db.Rooms.AddRange(rooms);
        await db.SaveChangesAsync();

        Tone T(string s) => tones.First(t => t.Slug == s);
        Category C(string s) => cats.First(c => c.Slug == s);
        List<Room> R(params string[] s) => rooms.Where(r => s.Contains(r.Slug)).ToList();

        var materialPrice = new Dictionary<string, decimal>
        {
            ["Non-woven"] = 650, ["Kabartmalı Vinil"] = 900, ["Metalik Vinil"] = 1100, ["Tekstil Yüzey"] = 1200,
            ["Saten Vinil"] = 950, ["Non-woven (Silinebilir)"] = 700,
        };

        // (koleksiyon, desen, kategori, materyal, odalar, varyantlar[ad, ton, bg, fg, ac, c3, rozet])
        var collections = new (string Col, string Type, string Cat, string Mat, string[] Rooms, (string V, string Tone, string Bg, string Fg, string Ac, string? C3, ProductBadge B)[] Vars)[]
        {
            ("Osmanlı Damask", "damask", "klasik", "Kabartmalı Vinil", ["salon", "yatak", "antre"], [
                ("Altın Krem", "bej", "#efe6d6", "#d9c6a3", "#b08d57", null, ProductBadge.Best), ("Gece Mavisi", "lacivert", "#1f2a3d", "#2f3e58", "#c4a265", null, 0),
                ("Zümrüt", "yesil", "#1f3a31", "#2c4d41", "#c4a265", null, ProductBadge.New), ("Antrasit", "siyah", "#222222", "#333231", "#a8a39b", null, 0),
                ("Bordo Saray", "kirmizi", "#5e1621", "#741f2c", "#d1ae6c", null, 0)]),
            ("Küp Geometri", "cubes", "geometrik", "Non-woven", ["ofis", "salon", "antre"], [
                ("Taş Gri", "gri", "#dedbd6", "#a9a59f", "#c7c3bd", null, 0), ("Okyanus", "mavi", "#cfdde6", "#4f7590", "#93b0c3", null, 0),
                ("Toprak", "kahve", "#e8d8c6", "#8a5e43", "#c19a7c", null, 0)]),
            ("Gatsby Yelpaze", "fans", "klasik", "Metalik Vinil", ["salon", "antre", "ofis"], [
                ("Siyah Altın", "siyah", "#191919", "#c9a75d", "#e2c98f", null, ProductBadge.Best), ("Adaçayı", "yesil", "#dfe5d8", "#7d9273", "#b39b6b", null, 0),
                ("Pudra", "pembe", "#f3e1dc", "#c99a92", "#b08d57", null, 0)]),
            ("Ogee Kafes", "ogee", "klasik", "Non-woven", ["yatak", "salon"], [
                ("Krem Altın", "bej", "#f2ebdf", "#c8b089", "#b08d57", null, 0), ("İnci Gri", "gri", "#e6e4e0", "#9e9a94", "#c2bdb6", null, 0),
                ("Lacivert Beyaz", "lacivert", "#22304a", "#e9e4da", "#c4a265", null, ProductBadge.New)]),
            ("Halka", "rings", "geometrik", "Non-woven", ["yatak", "ofis"], [
                ("Kum", "bej", "#efe7da", "#bba684", "#a07f52", null, 0), ("Mint", "yesil", "#e2ece6", "#88aa98", "#5f8572", null, 0)]),
            ("Botanik Yaprak", "leaves", "botanik", "Tekstil Yüzey", ["salon", "yatak", "ofis"], [
                ("Orman", "yesil", "#e9e6dc", "#4c6b4f", "#8fa67f", null, ProductBadge.Best), ("Kum Tepesi", "bej", "#f1e9dc", "#c4a881", "#9c7d58", null, 0),
                ("Gece Bahçesi", "lacivert", "#1d2638", "#3c5a55", "#7f9b86", null, ProductBadge.New), ("Tropik Gece", "siyah", "#151816", "#2d4a3a", "#4f7a5c", null, 0)]),
            ("Ginkgo", "ginkgo", "botanik", "Non-woven", ["yatak", "salon", "antre"], [
                ("Altın Krem", "altin", "#f4ecdc", "#c9a35e", "#dcc08a", null, ProductBadge.Best), ("Haki", "yesil", "#d9dcc8", "#6f7a4f", "#a3a97c", null, 0),
                ("Gece Altını", "lacivert", "#1b2436", "#c9a35e", "#8e7445", null, 0)]),
            ("Okaliptüs", "eucalyptus", "botanik", "Tekstil Yüzey", ["yatak", "cocuk", "salon"], [
                ("Adaçayı", "yesil", "#eef0ea", "#7f9a86", "#a9bca8", null, ProductBadge.New), ("Beyaz Bahar", "beyaz", "#fbfaf7", "#a5b5a6", "#d1b98d", null, 0)]),
            ("İnce Çizgi", "pinstripe", "cizgili", "Non-woven", ["ofis", "yatak", "antre"], [
                ("Krem", "beyaz", "#f4efe6", "#d2c5ae", "#b08d57", null, 0), ("Gri Flanel", "gri", "#d5d3cf", "#9b9893", "#ffffff", null, 0),
                ("Lacivert", "lacivert", "#25324a", "#3e4e6c", "#c4a265", null, 0)]),
            ("Regency Çizgi", "regency", "cizgili", "Kabartmalı Vinil", ["salon", "yatak"], [
                ("Mint Krem", "yesil", "#f1ede3", "#bccdbd", "#9fb4a1", null, 0), ("Bordo Krem", "kirmizi", "#f3ece0", "#8a2a35", "#c4a265", null, 0),
                ("Gece", "siyah", "#2a2928", "#1a1918", "#b08d57", null, 0)]),
            ("Zikzak", "chevron", "geometrik", "Non-woven", ["cocuk", "ofis"], [
                ("Gri", "gri", "#f0eeeb", "#b7b3ad", "#d6d2cc", null, 0), ("Hardal", "altin", "#f5efe2", "#d3a94e", "#e5cc92", null, 0)]),
            ("Dalga", "waves", "geometrik", "Non-woven", ["yatak", "cocuk"], [
                ("Deniz", "mavi", "#e4edf2", "#6b93ad", "#a7c2d3", null, 0), ("Kum", "bej", "#f3ebdd", "#c2a47b", "#ddc7a3", null, 0)]),
            ("Keten Doku", "linen", "doku", "Tekstil Yüzey", ["salon", "yatak", "ofis", "antre"], [
                ("Kum", "bej", "#e2d5c1", "#8c7656", "#000", null, ProductBadge.Best), ("Taş", "gri", "#cfcbc4", "#6f6a63", "#000", null, 0),
                ("Grafit", "siyah", "#4a4846", "#1e1d1c", "#000", null, 0), ("Kil", "kahve", "#b98d6e", "#6b432c", "#000", null, ProductBadge.New),
                ("Adaçayı", "yesil", "#b9c2ad", "#5c6b52", "#000", null, 0), ("Gece Mavisi", "lacivert", "#34435c", "#16202f", "#000", null, 0),
                ("Pudra", "pembe", "#e7cbc3", "#a3746b", "#000", null, 0)]),
            ("Mermer", "marble", "mermer", "Saten Vinil", ["salon", "antre", "ofis"], [
                ("Carrara", "beyaz", "#f3f1ee", "#8f8b86", "#c9c5bf", null, ProductBadge.Best), ("Nero Marquina", "siyah", "#1d1c1b", "#e8e4dd", "#5a5650", null, 0),
                ("Calacatta Altın", "bej", "#f4efe6", "#a88a5c", "#d8c7a6", null, ProductBadge.New), ("Verde Alpi", "yesil", "#1f3a33", "#cfd9cf", "#3f6a5c", null, 0)]),
            ("Terrazzo", "terrazzo", "mermer", "Non-woven", ["ofis", "cocuk", "salon"], [
                ("Pastel", "beyaz", "#f4f0ea", "#e0a99b", "#9fb8a8", "#e4c98f", 0), ("Toprak", "bej", "#ede4d6", "#a0623f", "#5e6b52", "#c79a5c", 0)]),
            ("Ekose", "tartan", "cizgili", "Tekstil Yüzey", ["ofis", "salon"], [
                ("İskoç Kırmızı", "kirmizi", "#6e1a26", "#1c2639", "#c4a265", "#f3ece0", 0), ("Orman", "yesil", "#2b4535", "#1c2639", "#b9332f", "#e9dfc9", 0)]),
            ("Yıldızlı Gece", "stars", "cocuk", "Non-woven (Silinebilir)", ["cocuk", "yatak"], [
                ("Lacivert", "lacivert", "#1f2b44", "#e9d9a8", "#ffffff", null, ProductBadge.Best), ("Pembe Rüya", "pembe", "#f6e4e0", "#e3a9a1", "#c9a35e", null, 0),
                ("Bulut", "beyaz", "#f7f6f3", "#c5d4dc", "#e2c98f", null, 0)]),
            ("Gökkuşağı", "rainbow", "cocuk", "Non-woven (Silinebilir)", ["cocuk"], [
                ("Toprak", "bej", "#f6efe4", "#c9825e", "#e0b67a", "#9fae93", ProductBadge.New), ("Pastel", "pembe", "#fbf3ef", "#e7aca2", "#f0cf9a", "#a9c4cf", 0)]),
            ("Dağ Macerası", "mountains", "cocuk", "Non-woven (Silinebilir)", ["cocuk"], [
                ("Mavi", "mavi", "#eef3f5", "#7d9fb4", "#b5cad6", "#6f8c6a", 0), ("Orman", "yesil", "#f2f0e8", "#7f9a7b", "#c5d1b8", "#4c6a4f", 0)]),
            ("Puantiye", "dots", "cocuk", "Non-woven (Silinebilir)", ["cocuk", "yatak"], [
                ("Pembe", "pembe", "#fbf1ee", "#e5aaa1", "#d6c08f", null, 0), ("Gri", "gri", "#f3f2ef", "#b9b6b0", "#d9d6d1", null, 0),
                ("Mavi", "mavi", "#f0f5f8", "#9bb8c9", "#d8c79f", null, 0)]),
            ("Kemer", "arches", "geometrik", "Non-woven", ["salon", "antre", "yatak"], [
                ("Terrakota", "kahve", "#f1e4d6", "#b4643c", "#c9a35e", null, ProductBadge.New), ("Zeytin", "yesil", "#ece9dc", "#6c7a4c", "#b49c6a", null, 0)]),
            ("Fas Karosu", "moroccan", "geometrik", "Non-woven", ["salon", "antre"], [
                ("Krem Altın", "bej", "#f4ede1", "#c8ab7c", "#b08d57", null, 0), ("Turkuaz", "mavi", "#e3eeee", "#4f8b8f", "#c4a265", null, 0)]),
            ("Balık Pulu", "scales", "geometrik", "Metalik Vinil", ["salon", "antre"], [
                ("Gece Altını", "siyah", "#1d1d1d", "#b08d57", "#6e5a3a", "#262524", 0), ("Okyanus", "mavi", "#dbe7ec", "#5b8197", "#9fbccb", "#e9f0f3", 0)]),
        };

        var code = 1001;
        var order = 0;
        var products = new List<Product>();
        for (var ci = 0; ci < collections.Length; ci++)
        {
            var c = collections[ci];
            for (var vi = 0; vi < c.Vars.Length; vi++)
            {
                var v = c.Vars[vi];
                products.Add(new Product
                {
                    Code = "HZ-" + code++,
                    Name = c.Col, Variant = v.V, Collection = c.Col,
                    Category = C(c.Cat), Tone = T(v.Tone), Rooms = R(c.Rooms), Material = c.Mat, Badge = v.B,
                    PatternType = c.Type, BgColor = v.Bg, FgColor = v.Fg, AccentColor = v.Ac, Color3 = v.C3, Seed = ci * 7 + vi + 1,
                    RepeatCm = c.Type is "linen" or "marble" ? 0 : new[] { 32, 53, 64 }[(ci + vi) % 3],
                    Price = materialPrice.GetValueOrDefault(c.Mat, 750),
                    SortOrder = order++,
                });
            }
        }

        var photos = new (string Name, string Col, string Cat, string Tone, string Img, string[] Rooms, ProductBadge B)[]
        {
            ("Çiçek Taşları", "Atölye", "doku", "bej", "1770983076558-14c5f119a4fd", ["salon", "antre"], ProductBadge.New),
            ("Grafik Şehir", "Atölye", "geometrik", "gri", "1770983438037-7ca0ccc22464", ["ofis", "salon"], 0),
            ("Kış Ormanı", "Atölye", "panoramik", "beyaz", "1770983438181-a75147510daf", ["yatak", "salon"], ProductBadge.Best),
            ("Sarmaşık", "Atölye", "botanik", "yesil", "1770983438128-f4065cf02752", ["yatak", "salon"], 0),
            ("Bahar Dalı", "Atölye", "botanik", "beyaz", "1780672823983-6ab83c017906", ["yatak", "cocuk"], 0),
            ("Vintage Gül", "Atölye", "botanik", "kahve", "1612764550058-b7ccce95a20e", ["salon", "yatak"], 0),
            ("Saray Bahçesi", "Panorama", "panoramik", "yesil", "1763668193434-6abd23c3722c", ["salon", "antre"], ProductBadge.Best),
            ("Klasik Fresk", "Panorama", "panoramik", "mavi", "1763669029358-401b2f5516a9", ["salon", "ofis"], 0),
        };
        foreach (var p in photos)
        {
            var custom = p.Cat == "panoramik";
            products.Add(new Product
            {
                Code = "HZ-" + code++,
                Name = p.Name, Variant = custom ? "Özel Ölçü" : "Doğal", Collection = p.Col,
                Category = C(p.Cat), Tone = T(p.Tone), Rooms = R(p.Rooms), Badge = p.B,
                Material = custom ? "Dijital Baskı · Tekstil" : "Non-woven",
                PhotoUrl = U + p.Img + "?auto=format&fit=crop&w=900&q=75",
                Size = custom ? "Duvarınıza özel ölçü" : "0,53 × 10,05 m",
                RepeatCm = 53, IsCustomSize = custom,
                Price = custom ? 750 : 850,
                SortOrder = order++,
            });
        }
        db.Products.AddRange(products);
        await db.SaveChangesAsync();

        // Kategori örnek desenleri
        var sample = new Dictionary<string, string>
        {
            ["klasik"] = "HZ-1001", ["geometrik"] = "HZ-1006", ["botanik"] = "HZ-1017", ["cizgili"] = "HZ-1029",
            ["doku"] = "HZ-1036", ["mermer"] = "HZ-1043", ["cocuk"] = "HZ-1052", ["panoramik"] = "HZ-1069",
        };
        foreach (var cat in cats) cat.SampleProductId = products.First(p => p.Code == sample[cat.Slug]).Id;
        await db.SaveChangesAsync();
    }

    private static async Task SeedPricesAsync(AppDbContext db)
    {
        PriceOption O(string name, PriceOptionKind kind, PriceUnit unit, decimal price, string? desc = null) =>
            new() { Name = name, Kind = kind, Unit = unit, UnitPrice = price, Description = desc };
        const PriceOptionKind M = PriceOptionKind.Main, E = PriceOptionKind.Extra;

        var services = new List<PriceService>
        {
            new()
            {
                Name = "Duvar Kağıdı", Description = "Malzeme ve uygulama işçiliği dahil, duvar alanına göre.", SortOrder = 0,
                Options =
                [
                    O("Ekonomik seri", M, PriceUnit.WallSquareMeter, 450, "Non-woven, düz ve küçük desenler"),
                    O("Standart seri", M, PriceUnit.WallSquareMeter, 650, "Vinil ve desenli koleksiyonlar"),
                    O("Premium seri", M, PriceUnit.WallSquareMeter, 950, "Tekstil yüzey, metalik ve panoramik"),
                    O("Eski duvar kağıdı sökümü", E, PriceUnit.WallSquareMeter, 60),
                    O("Alçı / yüzey hazırlığı", E, PriceUnit.WallSquareMeter, 90),
                ],
            },
            new()
            {
                Name = "Gergi Tavan", Description = "Tavan alanına göre; profil ve montaj dahil.", SortOrder = 1,
                Options =
                [
                    O("Mat gergi tavan", M, PriceUnit.CeilingSquareMeter, 650),
                    O("Saten gergi tavan", M, PriceUnit.CeilingSquareMeter, 700),
                    O("Parlak (lake) gergi tavan", M, PriceUnit.CeilingSquareMeter, 800),
                    O("Baskılı gergi tavan", M, PriceUnit.CeilingSquareMeter, 1200),
                    O("Işıklı (translucent) gergi tavan", M, PriceUnit.CeilingSquareMeter, 1400),
                    O("Gizli LED şerit", E, PriceUnit.LinearMeter, 250, "Oda çevresi boyunca"),
                    O("Spot aydınlatma", E, PriceUnit.Piece, 450, "Adet başına"),
                    O("Yıldız tavan efekti", E, PriceUnit.CeilingSquareMeter, 900),
                ],
            },
            new()
            {
                Name = "Boya & Badana", Description = "Duvar alanına göre; malzeme ve işçilik dahil.", SortOrder = 2,
                Options =
                [
                    O("Tek kat yenileme", M, PriceUnit.WallSquareMeter, 120),
                    O("İki kat boya", M, PriceUnit.WallSquareMeter, 180),
                    O("Silinebilir premium boya", M, PriceUnit.WallSquareMeter, 240),
                    O("Tavan boyası", E, PriceUnit.CeilingSquareMeter, 110),
                    O("Alçı tamiri", E, PriceUnit.WallSquareMeter, 70),
                ],
            },
            new()
            {
                Name = "Kartonpiyer & Söve", Description = "Oda çevresine göre.", SortOrder = 3,
                Options =
                [
                    O("Sade kartonpiyer", M, PriceUnit.LinearMeter, 180),
                    O("Desenli kartonpiyer", M, PriceUnit.LinearMeter, 280),
                    O("Kapı sövesi", E, PriceUnit.Piece, 900, "Adet başına"),
                ],
            },
        };
        foreach (var s in services)
            for (var i = 0; i < s.Options.Count; i++) s.Options[i].SortOrder = i;
        db.PriceServices.AddRange(services);
        await db.SaveChangesAsync();
    }
}
