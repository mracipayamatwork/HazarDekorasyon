using HazarDekorasyon.Web.Data;
using HazarDekorasyon.Web.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HazarDekorasyon.Web.Pages.Admin.Mekanlar;

public class IndexModel(AppDbContext db) : AdminPageModel
{
    [BindProperty] public Room Input { get; set; } = new();
    public List<(Room Room, int Count)> Rows { get; private set; } = new();
    public bool Editing => Input.Id != 0;

    public async Task OnGetAsync(int? duzenle)
    {
        if (duzenle is int id && await db.Rooms.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id) is { } r) Input = r;
        else Input = new Room { SortOrder = (await db.Rooms.MaxAsync(x => (int?)x.SortOrder) ?? -1) + 1 };
        await LoadAsync();
    }

    public async Task<IActionResult> OnPostSaveAsync()
    {
        Input.Slug = string.IsNullOrWhiteSpace(Input.Slug) ? Slugify(Input.Name ?? "") : Input.Slug.Trim().ToLowerInvariant();
        ModelState.Remove("Input.Slug");
        if (string.IsNullOrEmpty(Input.Slug) || !System.Text.RegularExpressions.Regex.IsMatch(Input.Slug, "^[a-z0-9-]+$"))
            ModelState.AddModelError("Input.Slug", "Sadece küçük harf, rakam ve tire kullanın.");
        else if (await db.Rooms.AnyAsync(r => r.Slug == Input.Slug && r.Id != Input.Id))
            ModelState.AddModelError("Input.Slug", "Bu kısa ad kullanılıyor.");
        if (!ModelState.IsValid) { await LoadAsync(); return Page(); }

        var e = Input.Id == 0 ? new Room() : await db.Rooms.FindAsync(Input.Id) ?? throw new InvalidOperationException();
        if (Input.Id == 0) db.Rooms.Add(e);
        e.Name = Input.Name!.Trim(); e.Slug = Input.Slug; e.SortOrder = Input.SortOrder;
        await db.SaveChangesAsync();
        return Back($"“{e.Name}” kaydedildi.");
    }

    public async Task<IActionResult> OnPostDeleteAsync(int id)
    {
        var r = await db.Rooms.Include(x => x.Products).FirstOrDefaultAsync(x => x.Id == id);
        if (r == null) return NotFound();
        r.Products.Clear();
        db.Rooms.Remove(r);
        await db.SaveChangesAsync();
        return Back($"“{r.Name}” silindi; ürünlerdeki bağlantısı kaldırıldı.");
    }

    private async Task LoadAsync()
    {
        Rows = (await db.Rooms.AsNoTracking().OrderBy(r => r.SortOrder)
            .Select(r => new { r, C = r.Products.Count }).ToListAsync()).Select(x => (x.r, x.C)).ToList();
    }
}
