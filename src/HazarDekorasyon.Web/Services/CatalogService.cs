using System.Text.Json;
using System.Text.Json.Serialization;
using HazarDekorasyon.Web.Data;
using HazarDekorasyon.Web.Models;
using Microsoft.EntityFrameworkCore;

namespace HazarDekorasyon.Web.Services;

/// <summary>Veritabanındaki katalog ve fiyat verisini, sayfadaki JavaScript'in beklediği JSON biçimine çevirir.</summary>
public class CatalogService(AppDbContext db, SiteSettingsService settings)
{
    public static readonly JsonSerializerOptions Json = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        Encoder = System.Text.Encodings.Web.JavaScriptEncoder.Default,
    };

    public static string Key(int id) => "p" + id;

    public async Task<List<Product>> ActiveProductsAsync() =>
        await db.Products.AsNoTracking()
            .Include(p => p.Category).Include(p => p.Tone).Include(p => p.Rooms)
            .Where(p => p.IsActive && p.Category!.IsActive)
            .OrderBy(p => p.SortOrder).ThenBy(p => p.Id)
            .AsSplitQuery()
            .ToListAsync();

    public async Task<List<Category>> ActiveCategoriesAsync() =>
        await db.Categories.AsNoTracking().Where(c => c.IsActive).OrderBy(c => c.SortOrder).ThenBy(c => c.Name).ToListAsync();

    public async Task<object> ClientDataAsync()
    {
        var products = await ActiveProductsAsync();
        var cats = await ActiveCategoriesAsync();
        var tones = await db.Tones.AsNoTracking().OrderBy(t => t.SortOrder).ToListAsync();
        var rooms = await db.Rooms.AsNoTracking().OrderBy(r => r.SortOrder).ToListAsync();
        var s = await settings.AllAsync();

        return new
        {
            tones = tones.Select(t => new { id = t.Slug, name = t.Name, c = new[] { t.Color1, t.Color2 } }),
            categories = cats.Select(c => new
            {
                id = c.Slug, name = c.Name,
                sample = c.SampleProductId is int sid && products.Any(p => p.Id == sid) ? Key(sid) : products.Where(p => p.CategoryId == c.Id).Select(p => Key(p.Id)).FirstOrDefault(),
            }),
            rooms = rooms.Select(r => new { id = r.Slug, name = r.Name }),
            products = products.Select(ToClient),
            settings = new
            {
                whatsApp = s[SettingKeys.WhatsApp],
                phone = s[SettingKeys.Phone],
                laborPerRoll = await settings.GetDecimalAsync(SettingKeys.WallpaperLaborPerRoll),
                vatRate = await settings.GetDecimalAsync(SettingKeys.VatRate),
                pricesIncludeVat = await settings.GetBoolAsync(SettingKeys.PricesIncludeVat),
                rangePercent = await settings.GetDecimalAsync(SettingKeys.PriceRangePercent),
                minimumCharge = await settings.GetDecimalAsync(SettingKeys.MinimumCharge),
                priceNote = s[SettingKeys.PriceNote],
            },
        };
    }

    public static object ToClient(Product p) => new
    {
        id = Key(p.Id),
        code = p.Code,
        name = p.Name,
        variant = p.Variant,
        collection = p.Collection,
        cat = p.Category?.Slug,
        tone = p.Tone?.Slug,
        rooms = p.Rooms.OrderBy(r => r.SortOrder).Select(r => r.Slug),
        material = p.Material,
        badge = p.Badge switch { ProductBadge.New => "new", ProductBadge.Best => "best", _ => null },
        pattern = string.IsNullOrEmpty(p.PhotoUrl) && !string.IsNullOrEmpty(p.PatternType)
            ? new { type = p.PatternType, colors = new { bg = p.BgColor, fg = p.FgColor, ac = p.AccentColor, c3 = p.Color3 }, seed = p.Seed }
            : null,
        photo = string.IsNullOrEmpty(p.PhotoUrl) ? null : p.PhotoUrl,
        size = p.Size,
        repeat = p.RepeatCm,
        rollW = p.RollWidth,
        rollL = p.RollLength,
        custom = p.IsCustomSize,
        price = p.Price,
    };

    public async Task<object> PricingDataAsync()
    {
        var services = await db.PriceServices.AsNoTracking()
            .Where(s => s.IsActive)
            .Include(s => s.Options.Where(o => o.IsActive).OrderBy(o => o.SortOrder))
            .OrderBy(s => s.SortOrder)
            .ToListAsync();
        return services.Where(s => s.Options.Any(o => o.Kind == PriceOptionKind.Main)).Select(s => new
        {
            id = s.Id,
            name = s.Name,
            description = s.Description,
            options = s.Options.Select(o => new
            {
                id = o.Id, name = o.Name, description = o.Description,
                kind = o.Kind == PriceOptionKind.Main ? "main" : "extra",
                unit = o.Unit switch
                {
                    PriceUnit.WallSquareMeter => "wall", PriceUnit.CeilingSquareMeter => "ceiling",
                    PriceUnit.LinearMeter => "perimeter", PriceUnit.Piece => "piece", _ => "fixed",
                },
                price = o.UnitPrice,
            }),
        });
    }
}
