using HazarDekorasyon.Web.Data;
using Microsoft.EntityFrameworkCore;

namespace HazarDekorasyon.Web.Services;

/// <summary>Admin panelinden düzenlenebilen site ayarlarının tanımları.</summary>
public static class SettingKeys
{
    public const string Phone = "Phone";
    public const string PhoneDisplay = "PhoneDisplay";
    public const string WhatsApp = "WhatsApp";
    public const string Instagram = "Instagram";
    public const string Address = "Address";
    public const string WorkingHours = "WorkingHours";
    public const string Announcement = "Announcement";
    public const string VatRate = "VatRate";
    public const string PricesIncludeVat = "PricesIncludeVat";
    public const string PriceRangePercent = "PriceRangePercent";
    public const string MinimumCharge = "MinimumCharge";
    public const string WallpaperLaborPerRoll = "WallpaperLaborPerRoll";
    public const string PriceNote = "PriceNote";

    public record Def(string Key, string Label, string Default, string Group, string? Help = null, string Type = "text");

    public static readonly Def[] All =
    [
        new(Phone, "Telefon (uluslararası, boşluksuz)", "+905432038730", "İletişim", "Arama bağlantılarında kullanılır. Ör: +905432038730"),
        new(PhoneDisplay, "Telefon (görünen)", "0 543 203 87 30", "İletişim"),
        new(WhatsApp, "WhatsApp numarası", "905432038730", "İletişim", "Başında + olmadan, ülke koduyla. Ör: 905432038730"),
        new(Instagram, "Instagram kullanıcı adı", "hazardekorasyon", "İletişim"),
        new(Address, "Adres / hizmet bölgesi", "", "İletişim", "Boş bırakılırsa sitede gösterilmez.", "textarea"),
        new(WorkingHours, "Çalışma saatleri", "Pazartesi – Cumartesi · 09:00 – 19:00", "İletişim"),
        new(Announcement, "Üst duyuru şeridi", "Ücretsiz keşif ve ölçü hizmeti|Yüzlerce duvar kağıdı deseni|Gergi tavan & aydınlatma çözümleri|Anahtar teslim dekorasyon", "Genel", "Her duyuruyu | işaretiyle ayırın."),
        new(VatRate, "KDV oranı (%)", "20", "Fiyatlandırma", null, "number"),
        new(PricesIncludeVat, "Girilen fiyatlara KDV dahil mi?", "false", "Fiyatlandırma", null, "bool"),
        new(PriceRangePercent, "Tahmin aralığı (± %)", "10", "Fiyatlandırma", "Hesaplanan tutarın alt–üst aralığı.", "number"),
        new(MinimumCharge, "Minimum iş bedeli (₺)", "2500", "Fiyatlandırma", "Toplam bunun altındaysa bu tutar gösterilir.", "number"),
        new(WallpaperLaborPerRoll, "Duvar kağıdı işçiliği (₺ / rulo)", "350", "Fiyatlandırma", "Ürün detayındaki tahmini fiyata eklenir.", "number"),
        new(PriceNote, "Fiyat açıklama notu", "Tahmini fiyatlar bilgi amaçlıdır; kesin fiyat ücretsiz keşif sonrası verilir.", "Fiyatlandırma", null, "textarea"),
    ];
}

/// <summary>Ayarları istek başına bir kez okuyan servis.</summary>
public class SiteSettingsService(AppDbContext db)
{
    private Dictionary<string, string?>? _cache;

    public async Task<Dictionary<string, string?>> AllAsync()
    {
        if (_cache != null) return _cache;
        var stored = await db.SiteSettings.AsNoTracking().ToDictionaryAsync(s => s.Key, s => s.Value);
        _cache = SettingKeys.All.ToDictionary(d => d.Key, d => stored.TryGetValue(d.Key, out var v) ? v : d.Default);
        return _cache;
    }

    public async Task<string> GetAsync(string key) => (await AllAsync()).GetValueOrDefault(key) ?? "";

    public async Task<decimal> GetDecimalAsync(string key)
    {
        var v = (await GetAsync(key)).Replace(',', '.');
        return decimal.TryParse(v, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var d) ? d : 0;
    }

    public async Task<bool> GetBoolAsync(string key) => (await GetAsync(key)).Equals("true", StringComparison.OrdinalIgnoreCase);
}

/// <summary>Sayfalarda kullanılan, ayarlardan türetilmiş iletişim bilgileri.</summary>
public record SiteInfo(string Phone, string PhoneDisplay, string WhatsApp, string Instagram, string Address, string WorkingHours, string[] Announcements)
{
    public string InstagramUrl => $"https://www.instagram.com/{Instagram.TrimStart('@')}/";
    public string WhatsAppUrl(string? text = null) =>
        $"https://wa.me/{new string(WhatsApp.Where(char.IsDigit).ToArray())}" + (string.IsNullOrEmpty(text) ? "" : "?text=" + Uri.EscapeDataString(text));
}

public static class SiteSettingsServiceExtensions
{
    public static async Task<SiteInfo> InfoAsync(this SiteSettingsService s)
    {
        var a = await s.AllAsync();
        string G(string k) => a.GetValueOrDefault(k) ?? "";
        return new SiteInfo(G(SettingKeys.Phone), G(SettingKeys.PhoneDisplay), G(SettingKeys.WhatsApp), G(SettingKeys.Instagram),
            G(SettingKeys.Address), G(SettingKeys.WorkingHours),
            G(SettingKeys.Announcement).Split('|', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
    }
}
