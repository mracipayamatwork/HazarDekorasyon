using HazarDekorasyon.Web.Data;
using HazarDekorasyon.Web.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HazarDekorasyon.Web.Pages.Admin.Urunler;

public class IndexModel(AppDbContext db) : AdminPageModel
{
    [BindProperty(SupportsGet = true)] public string? Q { get; set; }
    [BindProperty(SupportsGet = true)] public int? Kategori { get; set; }
    [BindProperty(SupportsGet = true)] public string? Durum { get; set; }
    [BindProperty(SupportsGet = true)] public int? Fiyatsiz { get; set; }

    public List<Product> Products { get; private set; } = new();
    public List<Category> Categories { get; private set; } = new();
    public int Total { get; private set; }

    public async Task OnGetAsync()
    {
        Categories = await db.Categories.AsNoTracking().OrderBy(c => c.SortOrder).ToListAsync();
        Total = await db.Products.CountAsync();
        var q = db.Products.AsNoTracking().Include(p => p.Category).Include(p => p.Tone).AsQueryable();
        if (Kategori is int k) q = q.Where(p => p.CategoryId == k);
        if (Durum == "aktif") q = q.Where(p => p.IsActive);
        if (Durum == "pasif") q = q.Where(p => !p.IsActive);
        if (Fiyatsiz == 1) q = q.Where(p => p.Price == null);
        var list = await q.OrderBy(p => p.SortOrder).ThenBy(p => p.Id).ToListAsync();
        if (!string.IsNullOrWhiteSpace(Q))
        {
            var term = Q.Trim().ToLower(new System.Globalization.CultureInfo("tr-TR"));
            list = list.Where(p => $"{p.Code} {p.Name} {p.Variant} {p.Collection} {p.Material}".ToLower(new System.Globalization.CultureInfo("tr-TR")).Contains(term)).ToList();
        }
        Products = list;
    }

    public async Task<IActionResult> OnPostToggleAsync(int id)
    {
        var p = await db.Products.FindAsync(id);
        if (p == null) return NotFound();
        p.IsActive = !p.IsActive;
        await db.SaveChangesAsync();
        Success($"{p.Code} {(p.IsActive ? "yayına alındı" : "yayından kaldırıldı")}.");
        return RedirectToPage(new { Q, Kategori, Durum, Fiyatsiz });
    }

    public async Task<IActionResult> OnPostDeleteAsync(int id)
    {
        var p = await db.Products.Include(x => x.Rooms).FirstOrDefaultAsync(x => x.Id == id);
        if (p == null) return NotFound();
        await db.Categories.Where(c => c.SampleProductId == id).ExecuteUpdateAsync(s => s.SetProperty(c => c.SampleProductId, (int?)null));
        db.Products.Remove(p);
        await db.SaveChangesAsync();
        Success($"{p.Code} – {p.Name} silindi.");
        return RedirectToPage(new { Q, Kategori, Durum, Fiyatsiz });
    }
}
