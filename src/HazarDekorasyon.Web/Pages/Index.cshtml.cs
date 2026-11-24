using System.Text.Json;
using HazarDekorasyon.Web.Data;
using HazarDekorasyon.Web.Models;
using HazarDekorasyon.Web.Services;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace HazarDekorasyon.Web.Pages;

public class IndexModel(AppDbContext db, CatalogService catalog, SiteSettingsService settings) : PageModel
{
    public SiteInfo Site { get; private set; } = default!;
    public List<Category> HomeCategories { get; private set; } = new();
    public List<PriceTeaserItem> PriceTeaser { get; private set; } = new();
    public string HomeJson { get; private set; } = "{}";
    private List<Product> _products = new();

    public record PriceTeaserItem(string Name, decimal FromPrice, string UnitLabel);

    public async Task OnGetAsync()
    {
        Site = await settings.InfoAsync();
        _products = await catalog.ActiveProductsAsync();
        HomeCategories = (await catalog.ActiveCategoriesAsync()).Where(c => c.ShowOnHome).Take(5).ToList();

        // Öne çıkan ürün ve "Odanda Gör" seçimleri
        var featured = _products.FirstOrDefault(p => p.Badge == ProductBadge.Best && p.PatternType == "ginkgo")
                       ?? _products.FirstOrDefault(p => p.Badge == ProductBadge.Best)
                       ?? _products.FirstOrDefault();
        var visualizer = _products
            .Where(p => !p.IsCustomSize)
            .GroupBy(p => p.Name).Select(g => g.OrderByDescending(p => p.Badge).First())
            .OrderByDescending(p => p.Badge).ThenBy(p => p.SortOrder)
            .Take(12).Select(p => CatalogService.Key(p.Id)).ToList();
        HomeJson = JsonSerializer.Serialize(new { featured = featured == null ? null : CatalogService.Key(featured.Id), visualizer }, CatalogService.Json);

        // Fiyat hesaplama tanıtım kartları: her hizmetin en düşük ana seçeneği
        var services = await db.PriceServices.AsNoTracking().Where(s => s.IsActive)
            .Include(s => s.Options).OrderBy(s => s.SortOrder).ToListAsync();
        PriceTeaser = services
            .Select(s => new { s, min = s.Options.Where(o => o.IsActive && o.Kind == PriceOptionKind.Main).OrderBy(o => o.UnitPrice).FirstOrDefault() })
            .Where(x => x.min != null)
            .Take(4)
            .Select(x => new PriceTeaserItem(x.s.Name, x.min!.UnitPrice, UnitLabel(x.min.Unit)))
            .ToList();
    }

    public string? SampleKey(Category c)
    {
        var id = c.SampleProductId is int sid && _products.Any(p => p.Id == sid) ? sid : _products.FirstOrDefault(p => p.CategoryId == c.Id)?.Id;
        return id == null ? null : CatalogService.Key(id.Value);
    }

    public static string UnitLabel(PriceUnit u) => u switch
    {
        PriceUnit.WallSquareMeter or PriceUnit.CeilingSquareMeter => " / m²",
        PriceUnit.LinearMeter => " / mt",
        PriceUnit.Piece => " / adet",
        _ => "",
    };
}
