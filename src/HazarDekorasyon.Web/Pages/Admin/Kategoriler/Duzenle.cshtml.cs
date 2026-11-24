using HazarDekorasyon.Web.Data;
using HazarDekorasyon.Web.Models;
using HazarDekorasyon.Web.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HazarDekorasyon.Web.Pages.Admin.Kategoriler;

public class DuzenleModel(AppDbContext db, ImageUploadService uploads) : AdminPageModel
{
    [BindProperty] public Category Input { get; set; } = new();
    [BindProperty] public IFormFile? Upload { get; set; }
    public bool IsNew => Input.Id == 0;
    public List<Product> Products { get; private set; } = new();

    public async Task<IActionResult> OnGetAsync(int? id)
    {
        if (id is int cid)
        {
            var c = await db.Categories.AsNoTracking().FirstOrDefaultAsync(x => x.Id == cid);
            if (c == null) return NotFound();
            Input = c;
        }
        else
        {
            Input = new Category { SortOrder = (await db.Categories.MaxAsync(c => (int?)c.SortOrder) ?? -1) + 1, IsActive = true };
        }
        await LoadAsync();
        return Page();
    }

    public async Task<IActionResult> OnPostAsync(int? id)
    {
        Input.Id = id ?? 0;
        Input.Slug = string.IsNullOrWhiteSpace(Input.Slug) ? Slugify(Input.Name ?? "") : Input.Slug.Trim().ToLowerInvariant();
        ModelState.Remove("Input.Slug");
        if (string.IsNullOrEmpty(Input.Slug) || !System.Text.RegularExpressions.Regex.IsMatch(Input.Slug, "^[a-z0-9-]+$"))
            ModelState.AddModelError("Input.Slug", "Sadece küçük harf, rakam ve tire kullanın.");
        else if (await db.Categories.AnyAsync(c => c.Slug == Input.Slug && c.Id != Input.Id))
            ModelState.AddModelError("Input.Slug", "Bu kısa ad başka bir kategoride kullanılıyor.");

        string? uploaded = null;
        if (Upload is { Length: > 0 })
        {
            var (url, err) = await uploads.SaveAsync(Upload, "kategoriler");
            if (err != null) ModelState.AddModelError(nameof(Upload), err);
            uploaded = url;
        }

        if (!ModelState.IsValid)
        {
            await LoadAsync();
            return Page();
        }

        var entity = Input.Id == 0 ? new Category() : await db.Categories.FindAsync(Input.Id) ?? throw new InvalidOperationException();
        if (Input.Id == 0) db.Categories.Add(entity);
        entity.Name = Input.Name!.Trim();
        entity.Slug = Input.Slug;
        entity.Tagline = Input.Tagline?.Trim();
        entity.CoverImageUrl = uploaded ?? (string.IsNullOrWhiteSpace(Input.CoverImageUrl) ? null : Input.CoverImageUrl.Trim());
        entity.SampleProductId = Input.SampleProductId is > 0 ? Input.SampleProductId : null;
        entity.ShowOnHome = Input.ShowOnHome;
        entity.SortOrder = Input.SortOrder;
        entity.IsActive = Input.IsActive;
        await db.SaveChangesAsync();

        Success($"“{entity.Name}” kategorisi kaydedildi.");
        return RedirectToPage("Index");
    }

    private async Task LoadAsync()
    {
        Products = await db.Products.AsNoTracking()
            .Where(p => Input.Id == 0 || p.CategoryId == Input.Id)
            .OrderBy(p => p.SortOrder).ToListAsync();
    }
}
