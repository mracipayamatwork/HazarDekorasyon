using HazarDekorasyon.Web.Data;
using HazarDekorasyon.Web.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HazarDekorasyon.Web.Pages.Admin.Kategoriler;

public class IndexModel(AppDbContext db) : AdminPageModel
{
    public record Row(Category Category, int ProductCount, Product? Sample);
    public List<Row> Rows { get; private set; } = new();

    public async Task OnGetAsync()
    {
        var cats = await db.Categories.AsNoTracking().OrderBy(c => c.SortOrder).ThenBy(c => c.Name).ToListAsync();
        var counts = await db.Products.GroupBy(p => p.CategoryId).Select(g => new { g.Key, C = g.Count() }).ToDictionaryAsync(x => x.Key, x => x.C);
        var sampleIds = cats.Where(c => c.SampleProductId != null).Select(c => c.SampleProductId!.Value).ToList();
        var samples = await db.Products.AsNoTracking().Where(p => sampleIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id);
        Rows = cats.Select(c => new Row(c, counts.GetValueOrDefault(c.Id), c.SampleProductId is int s ? samples.GetValueOrDefault(s) : null)).ToList();
    }

    public async Task<IActionResult> OnPostMoveAsync(int id, int dir)
    {
        var list = await db.Categories.OrderBy(c => c.SortOrder).ThenBy(c => c.Name).ToListAsync();
        var i = list.FindIndex(c => c.Id == id);
        var j = i + dir;
        if (i >= 0 && j >= 0 && j < list.Count) (list[i], list[j]) = (list[j], list[i]);
        for (var k = 0; k < list.Count; k++) list[k].SortOrder = k;
        await db.SaveChangesAsync();
        return RedirectToPage();
    }

    public async Task<IActionResult> OnPostDeleteAsync(int id)
    {
        var c = await db.Categories.FindAsync(id);
        if (c == null) return NotFound();
        var n = await db.Products.CountAsync(p => p.CategoryId == id);
        if (n > 0)
        {
            Error($"“{c.Name}” kategorisinde {n} ürün var. Önce ürünleri başka bir kategoriye taşıyın veya kategoriyi pasif yapın.");
            return RedirectToPage();
        }
        db.Categories.Remove(c);
        await db.SaveChangesAsync();
        return Back($"“{c.Name}” kategorisi silindi.");
    }
}
