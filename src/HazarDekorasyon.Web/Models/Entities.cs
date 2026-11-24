using System.ComponentModel.DataAnnotations;

namespace HazarDekorasyon.Web.Models;

/// <summary>Katalog kategorisi (Damask & Klasik, Botanik ...)</summary>
public class Category
{
    public int Id { get; set; }

    [Required(ErrorMessage = "Kısa ad zorunludur."), StringLength(60)]
    [RegularExpression("^[a-z0-9-]+$", ErrorMessage = "Sadece küçük harf, rakam ve tire kullanın.")]
    [Display(Name = "Kısa ad (URL)")]
    public string Slug { get; set; } = "";

    [Required(ErrorMessage = "Ad zorunludur."), StringLength(100)]
    [Display(Name = "Kategori adı")]
    public string Name { get; set; } = "";

    [StringLength(120)]
    [Display(Name = "Kısa slogan")]
    public string? Tagline { get; set; }

    [StringLength(500)]
    [Display(Name = "Kapak görseli (URL)")]
    public string? CoverImageUrl { get; set; }

    [Display(Name = "Örnek desen ürünü")]
    public int? SampleProductId { get; set; }

    [Display(Name = "Ana sayfada göster")]
    public bool ShowOnHome { get; set; }

    [Display(Name = "Sıra")]
    public int SortOrder { get; set; }

    [Display(Name = "Aktif")]
    public bool IsActive { get; set; } = true;

    public List<Product> Products { get; set; } = new();
}

/// <summary>Renk tonu (Bej, Yeşil ...)</summary>
public class Tone
{
    public int Id { get; set; }

    [Required(ErrorMessage = "Kısa ad zorunludur."), StringLength(40)]
    [RegularExpression("^[a-z0-9-]+$", ErrorMessage = "Sadece küçük harf, rakam ve tire kullanın.")]
    [Display(Name = "Kısa ad (URL)")]
    public string Slug { get; set; } = "";

    [Required(ErrorMessage = "Ad zorunludur."), StringLength(60)]
    [Display(Name = "Ton adı")]
    public string Name { get; set; } = "";

    [Required, StringLength(9)]
    [Display(Name = "Açık renk")]
    public string Color1 { get; set; } = "#e9dcc6";

    [Required, StringLength(9)]
    [Display(Name = "Koyu renk")]
    public string Color2 { get; set; } = "#c9b28f";

    [Display(Name = "Sıra")]
    public int SortOrder { get; set; }

    public List<Product> Products { get; set; } = new();
}

/// <summary>Uygun mekân (Salon, Yatak Odası ...)</summary>
public class Room
{
    public int Id { get; set; }

    [Required(ErrorMessage = "Kısa ad zorunludur."), StringLength(40)]
    [RegularExpression("^[a-z0-9-]+$", ErrorMessage = "Sadece küçük harf, rakam ve tire kullanın.")]
    [Display(Name = "Kısa ad (URL)")]
    public string Slug { get; set; } = "";

    [Required(ErrorMessage = "Ad zorunludur."), StringLength(60)]
    [Display(Name = "Mekân adı")]
    public string Name { get; set; } = "";

    [Display(Name = "Sıra")]
    public int SortOrder { get; set; }

    public List<Product> Products { get; set; } = new();
}

public enum ProductBadge
{
    [Display(Name = "Yok")] None = 0,
    [Display(Name = "Yeni")] New = 1,
    [Display(Name = "Çok Satan")] Best = 2,
}

/// <summary>Duvar kağıdı ürünü. Desen ya SVG motoru ile (PatternType) ya da fotoğrafla (PhotoUrl) gösterilir.</summary>
public class Product
{
    public int Id { get; set; }

    [Required(ErrorMessage = "Ürün kodu zorunludur."), StringLength(30)]
    [Display(Name = "Ürün kodu")]
    public string Code { get; set; } = "";

    [Required(ErrorMessage = "Ürün adı zorunludur."), StringLength(100)]
    [Display(Name = "Ürün / desen adı")]
    public string Name { get; set; } = "";

    [Required(ErrorMessage = "Renk/varyant adı zorunludur."), StringLength(100)]
    [Display(Name = "Renk / varyant")]
    public string Variant { get; set; } = "";

    [Required(ErrorMessage = "Koleksiyon zorunludur."), StringLength(100)]
    [Display(Name = "Koleksiyon")]
    public string Collection { get; set; } = "";

    [Display(Name = "Kategori")]
    public int CategoryId { get; set; }
    public Category? Category { get; set; }

    [Display(Name = "Renk tonu")]
    public int ToneId { get; set; }
    public Tone? Tone { get; set; }

    public List<Room> Rooms { get; set; } = new();

    [Required(ErrorMessage = "Materyal zorunludur."), StringLength(80)]
    [Display(Name = "Materyal")]
    public string Material { get; set; } = "Non-woven";

    [Display(Name = "Rozet")]
    public ProductBadge Badge { get; set; }

    // --- Desen motoru ---
    [StringLength(30)]
    [Display(Name = "Desen tipi")]
    public string? PatternType { get; set; }

    [StringLength(9), Display(Name = "Zemin rengi")]
    public string? BgColor { get; set; }

    [StringLength(9), Display(Name = "Desen rengi")]
    public string? FgColor { get; set; }

    [StringLength(9), Display(Name = "Vurgu rengi")]
    public string? AccentColor { get; set; }

    [StringLength(9), Display(Name = "3. renk")]
    public string? Color3 { get; set; }

    [Display(Name = "Desen tohumu")]
    public int Seed { get; set; } = 1;

    // --- Fotoğraf ---
    [StringLength(500)]
    [Display(Name = "Fotoğraf (URL)")]
    public string? PhotoUrl { get; set; }

    // --- Teknik bilgiler ---
    [Required, StringLength(60), Display(Name = "Ölçü")]
    public string Size { get; set; } = "0,53 × 10,05 m";

    [Range(0, 500), Display(Name = "Desen tekrarı (cm)")]
    public int RepeatCm { get; set; }

    [Range(0.1, 5), Display(Name = "Rulo eni (m)")]
    public decimal RollWidth { get; set; } = 0.53m;

    [Range(1, 100), Display(Name = "Rulo boyu (m)")]
    public decimal RollLength { get; set; } = 10.05m;

    [Display(Name = "Özel ölçü (panoramik)")]
    public bool IsCustomSize { get; set; }

    [Range(0, 1_000_000), Display(Name = "Rulo fiyatı / m² fiyatı (₺)")]
    public decimal? Price { get; set; }

    [Display(Name = "Sıra")]
    public int SortOrder { get; set; }

    [Display(Name = "Aktif")]
    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>Fiyat hesaplayıcıdaki hizmet (Duvar Kağıdı, Gergi Tavan, Boya ...)</summary>
public class PriceService
{
    public int Id { get; set; }

    [Required(ErrorMessage = "Hizmet adı zorunludur."), StringLength(80)]
    [Display(Name = "Hizmet adı")]
    public string Name { get; set; } = "";

    [StringLength(250), Display(Name = "Açıklama")]
    public string? Description { get; set; }

    [Display(Name = "Sıra")]
    public int SortOrder { get; set; }

    [Display(Name = "Aktif")]
    public bool IsActive { get; set; } = true;

    public List<PriceOption> Options { get; set; } = new();
}

public enum PriceOptionKind
{
    [Display(Name = "Ana seçenek (biri seçilir)")] Main = 0,
    [Display(Name = "Ek seçenek (isteğe bağlı)")] Extra = 1,
}

public enum PriceUnit
{
    [Display(Name = "Duvar alanı m² başına")] WallSquareMeter = 0,
    [Display(Name = "Tavan alanı m² başına")] CeilingSquareMeter = 1,
    [Display(Name = "Oda çevresi metre başına")] LinearMeter = 2,
    [Display(Name = "Adet başına")] Piece = 3,
    [Display(Name = "Sabit ücret")] Fixed = 4,
}

public class PriceOption
{
    public int Id { get; set; }

    public int PriceServiceId { get; set; }
    public PriceService? PriceService { get; set; }

    [Required(ErrorMessage = "Seçenek adı zorunludur."), StringLength(100)]
    [Display(Name = "Seçenek adı")]
    public string Name { get; set; } = "";

    [StringLength(200), Display(Name = "Açıklama")]
    public string? Description { get; set; }

    [Display(Name = "Tür")]
    public PriceOptionKind Kind { get; set; }

    [Display(Name = "Birim")]
    public PriceUnit Unit { get; set; }

    [Range(0, 10_000_000, ErrorMessage = "Geçerli bir fiyat girin.")]
    [Display(Name = "Birim fiyat (₺)")]
    public decimal UnitPrice { get; set; }

    [Display(Name = "Sıra")]
    public int SortOrder { get; set; }

    [Display(Name = "Aktif")]
    public bool IsActive { get; set; } = true;
}

/// <summary>Anahtar–değer site ayarları (telefon, KDV oranı, duyuru metni ...)</summary>
public class SiteSetting
{
    [Key, StringLength(60)]
    public string Key { get; set; } = "";

    [StringLength(1000)]
    public string? Value { get; set; }
}

public class AdminUser
{
    public int Id { get; set; }

    [Required, StringLength(60)]
    public string UserName { get; set; } = "";

    [Required]
    public string PasswordHash { get; set; } = "";

    public DateTime? LastLoginAt { get; set; }
}
