using HazarDekorasyon.Web.Data;
using HazarDekorasyon.Web.Models;
using Microsoft.EntityFrameworkCore;

namespace HazarDekorasyon.Web.Pages.Admin;

public class IndexModel(AppDbContext db) : AdminPageModel
{
    public int ProductCount { get; private set; }
    public int ActiveProductCount { get; private set; }
    public int CategoryCount { get; private set; }
    public int PriceOptionCount { get; private set; }
    public int ServiceCount { get; private set; }
    public int NoPriceCount { get; private set; }
    public List<Product> Recent { get; private set; } = new();
    public List<(string Name, int Count)> ByCategory { get; private set; } = new();

    public async Task OnGetAsync()
    {
        ProductCount = await db.Products.CountAsync();
        ActiveProductCount = await db.Products.CountAsync(p => p.IsActive);
        CategoryCount = await db.Categories.CountAsync();
        ServiceCount = await db.PriceServices.CountAsync();
        PriceOptionCount = await db.PriceOptions.CountAsync();
        NoPriceCount = await db.Products.CountAsync(p => p.IsActive && p.Price == null);
        Recent = await db.Products.AsNoTracking().Include(p => p.Category)
            .OrderByDescending(p => p.CreatedAt).ThenByDescending(p => p.Id).Take(6).ToListAsync();
        ByCategory = (await db.Categories.AsNoTracking().OrderBy(c => c.SortOrder)
            .Select(c => new { c.Name, Count = c.Products.Count })
            .ToListAsync()).Select(x => (x.Name, x.Count)).ToList();
    }
}
