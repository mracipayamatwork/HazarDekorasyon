using HazarDekorasyon.Web.Data;
using HazarDekorasyon.Web.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HazarDekorasyon.Web.Pages.Admin.Tonlar;

public class IndexModel(AppDbContext db) : AdminPageModel
{
    [BindProperty] public Tone Input { get; set; } = new();
    public List<(Tone Tone, int Count)> Rows { get; private set; } = new();
    public bool Editing => Input.Id != 0;

    public async Task OnGetAsync(int? duzenle)
    {
        if (duzenle is int id && await db.Tones.AsNoTracking().FirstOrDefaultAsync(t => t.Id == id) is { } t) Input = t;
        else Input = new Tone { SortOrder = (await db.Tones.MaxAsync(x => (int?)x.SortOrder) ?? -1) + 1 };
        await LoadAsync();
    }

    public async Task<IActionResult> OnPostSaveAsync()
    {
        Input.Slug = string.IsNullOrWhiteSpace(Input.Slug) ? Slugify(Input.Name ?? "") : Input.Slug.Trim().ToLowerInvariant();
        ModelState.Remove("Input.Slug");
        if (string.IsNullOrEmpty(Input.Slug) || !System.Text.RegularExpressions.Regex.IsMatch(Input.Slug, "^[a-z0-9-]+$"))
            ModelState.AddModelError("Input.Slug", "Sadece küçük harf, rakam ve tire kullanın.");
        else if (await db.Tones.AnyAsync(t => t.Slug == Input.Slug && t.Id != Input.Id))
            ModelState.AddModelError("Input.Slug", "Bu kısa ad kullanılıyor.");
        foreach (var (k, v) in new[] { ("Color1", Input.Color1), ("Color2", Input.Color2) })
            if (!System.Text.RegularExpressions.Regex.IsMatch(v ?? "", "^#[0-9a-fA-F]{6}$")) ModelState.AddModelError("Input." + k, "Renk #rrggbb biçiminde olmalı.");
        if (!ModelState.IsValid) { await LoadAsync(); return Page(); }

        var e = Input.Id == 0 ? new Tone() : await db.Tones.FindAsync(Input.Id) ?? throw new InvalidOperationException();
        if (Input.Id == 0) db.Tones.Add(e);
        e.Name = Input.Name!.Trim(); e.Slug = Input.Slug; e.Color1 = Input.Color1.ToLowerInvariant(); e.Color2 = Input.Color2.ToLowerInvariant(); e.SortOrder = Input.SortOrder;
        await db.SaveChangesAsync();
        return Back($"“{e.Name}” tonu kaydedildi.");
    }

    public async Task<IActionResult> OnPostDeleteAsync(int id)
    {
        var t = await db.Tones.FindAsync(id);
        if (t == null) return NotFound();
        var n = await db.Products.CountAsync(p => p.ToneId == id);
        if (n > 0) { Error($"“{t.Name}” tonunu {n} ürün kullanıyor; önce bu ürünlerin tonunu değiştirin."); return RedirectToPage(); }
        db.Tones.Remove(t);
        await db.SaveChangesAsync();
        return Back($"“{t.Name}” tonu silindi.");
    }

    private async Task LoadAsync()
    {
        var counts = await db.Products.GroupBy(p => p.ToneId).Select(g => new { g.Key, C = g.Count() }).ToDictionaryAsync(x => x.Key, x => x.C);
        Rows = (await db.Tones.AsNoTracking().OrderBy(t => t.SortOrder).ToListAsync()).Select(t => (t, counts.GetValueOrDefault(t.Id))).ToList();
    }
}
