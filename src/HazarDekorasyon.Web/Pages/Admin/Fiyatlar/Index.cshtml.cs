using HazarDekorasyon.Web.Data;
using HazarDekorasyon.Web.Models;
using HazarDekorasyon.Web.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HazarDekorasyon.Web.Pages.Admin.Fiyatlar;

public class IndexModel(AppDbContext db, SiteSettingsService settings) : AdminPageModel
{
    public List<PriceService> Services { get; private set; } = new();
    public Dictionary<string, (int Count, decimal? Min, decimal? Max)> ProductPricesByMaterial { get; private set; } = new();
    public decimal LaborPerRoll { get; private set; }
    public decimal VatRate { get; private set; }

    /// <summary>Seçenek Id → yeni fiyat</summary>
    [BindProperty] public Dictionary<int, decimal> Prices { get; set; } = new();

    [BindProperty] public decimal Percent { get; set; }
    [BindProperty] public string Target { get; set; } = "services";
    [BindProperty] public string Rounding { get; set; } = "10";

    public async Task OnGetAsync()
    {
        Services = await db.PriceServices.AsNoTracking()
            .Include(s => s.Options.OrderBy(o => o.Kind).ThenBy(o => o.SortOrder))
            .OrderBy(s => s.SortOrder).ToListAsync();
        ProductPricesByMaterial = (await db.Products.AsNoTracking().Where(p => p.IsActive).ToListAsync())
            .GroupBy(p => p.Material)
            .OrderBy(g => g.Key)
            .ToDictionary(g => g.Key, g => (g.Count(), g.Min(p => p.Price), g.Max(p => p.Price)));
        LaborPerRoll = await settings.GetDecimalAsync(SettingKeys.WallpaperLaborPerRoll);
        VatRate = await settings.GetDecimalAsync(SettingKeys.VatRate);
    }

    public async Task<IActionResult> OnPostSaveAsync()
    {
        var ids = Prices.Keys.ToList();
        var options = await db.PriceOptions.Where(o => ids.Contains(o.Id)).ToListAsync();
        var changed = 0;
        foreach (var o in options)
        {
            var v = Math.Max(0, Prices[o.Id]);
            if (o.UnitPrice != v) { o.UnitPrice = v; changed++; }
        }
        await db.SaveChangesAsync();
        return Back(changed == 0 ? "Değişiklik yapılmadı." : $"{changed} fiyat güncellendi.");
    }

    public async Task<IActionResult> OnPostBulkAsync()
    {
        if (Percent == 0 || Percent < -90 || Percent > 500)
        {
            Error("Geçerli bir yüzde girin (−90 ile 500 arası, 0 hariç).");
            return RedirectToPage();
        }
        var step = Rounding switch { "1" => 1m, "5" => 5m, "50" => 50m, "100" => 100m, _ => 10m };
        decimal Apply(decimal v) => Math.Max(0, Math.Round(v * (1 + Percent / 100m) / step, MidpointRounding.AwayFromZero) * step);

        int n = 0;
        if (Target is "services" or "all")
        {
            foreach (var o in await db.PriceOptions.ToListAsync()) { o.UnitPrice = Apply(o.UnitPrice); n++; }
        }
        if (Target is "products" or "all")
        {
            foreach (var p in await db.Products.Where(p => p.Price != null).ToListAsync()) { p.Price = Apply(p.Price!.Value); n++; }
        }
        await db.SaveChangesAsync();
        var sign = Percent > 0 ? "+" : "";
        return Back($"{n} fiyata %{sign}{Percent:0.##} uygulandı ({step:0} ₺'ye yuvarlandı).");
    }

    public async Task<IActionResult> OnPostDeleteServiceAsync(int id)
    {
        var s = await db.PriceServices.FindAsync(id);
        if (s == null) return NotFound();
        db.PriceServices.Remove(s);
        await db.SaveChangesAsync();
        return Back($"“{s.Name}” hizmeti ve seçenekleri silindi.");
    }
}
