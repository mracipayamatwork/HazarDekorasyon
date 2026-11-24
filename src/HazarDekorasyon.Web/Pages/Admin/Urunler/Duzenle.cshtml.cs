using System.Text.RegularExpressions;
using HazarDekorasyon.Web.Data;
using HazarDekorasyon.Web.Models;
using HazarDekorasyon.Web.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HazarDekorasyon.Web.Pages.Admin.Urunler;

public class DuzenleModel(AppDbContext db, ImageUploadService uploads) : AdminPageModel
{
    [BindProperty] public Product Input { get; set; } = new();
    [BindProperty] public string Mode { get; set; } = "pattern";
    [BindProperty] public int[] SelectedRooms { get; set; } = [];
    [BindProperty] public IFormFile? Upload { get; set; }

    public bool IsNew => Input.Id == 0;
    public List<Category> Categories { get; private set; } = new();
    public List<Tone> Tones { get; private set; } = new();
    public List<Room> Rooms { get; private set; } = new();
    public List<string> Collections { get; private set; } = new();
    public List<string> Materials { get; private set; } = new();

    public async Task<IActionResult> OnGetAsync(int? id)
    {
        if (id is int pid)
        {
            var p = await db.Products.Include(x => x.Rooms).AsNoTracking().FirstOrDefaultAsync(x => x.Id == pid);
            if (p == null) return NotFound();
            Input = p;
            Mode = string.IsNullOrEmpty(p.PhotoUrl) ? "pattern" : "photo";
            SelectedRooms = p.Rooms.Select(r => r.Id).ToArray();
        }
        else
        {
            Input = new Product
            {
                Code = await NextCodeAsync(),
                PatternType = "damask", BgColor = "#efe6d6", FgColor = "#d9c6a3", AccentColor = "#b08d57",
                Seed = Random.Shared.Next(1, 999),
                SortOrder = (await db.Products.MaxAsync(p => (int?)p.SortOrder) ?? 0) + 1,
            };
            if (Request.Query.TryGetValue("kopya", out var src) && int.TryParse(src, out var srcId))
            {
                var s = await db.Products.Include(x => x.Rooms).AsNoTracking().FirstOrDefaultAsync(x => x.Id == srcId);
                if (s != null)
                {
                    var code = Input.Code; var order = Input.SortOrder;
                    Input = s; Input.Id = 0; Input.Code = code; Input.SortOrder = order; Input.Variant = s.Variant + " (kopya)";
                    Input.Badge = ProductBadge.None; Input.CreatedAt = DateTime.UtcNow;
                    Mode = string.IsNullOrEmpty(s.PhotoUrl) ? "pattern" : "photo";
                    SelectedRooms = s.Rooms.Select(r => r.Id).ToArray();
                    Input.Rooms = new();
                }
            }
        }
        await LoadListsAsync();
        return Page();
    }

    public async Task<IActionResult> OnPostAsync(int? id)
    {
        Input.Id = id ?? 0;
        Input.Code = (Input.Code ?? "").Trim().ToUpperInvariant();

        if (await db.Products.AnyAsync(p => p.Code == Input.Code && p.Id != Input.Id))
            ModelState.AddModelError("Input.Code", "Bu ürün kodu başka bir üründe kullanılıyor.");
        if (!await db.Categories.AnyAsync(c => c.Id == Input.CategoryId))
            ModelState.AddModelError("Input.CategoryId", "Kategori seçin.");
        if (!await db.Tones.AnyAsync(t => t.Id == Input.ToneId))
            ModelState.AddModelError("Input.ToneId", "Renk tonu seçin.");

        string? uploaded = null;
        if (Mode == "photo")
        {
            if (Upload is { Length: > 0 })
            {
                var (url, err) = await uploads.SaveAsync(Upload, "urunler");
                if (err != null) ModelState.AddModelError(nameof(Upload), err);
                uploaded = url;
            }
            if (uploaded == null && string.IsNullOrWhiteSpace(Input.PhotoUrl))
                ModelState.AddModelError("Input.PhotoUrl", "Fotoğraf yükleyin veya bir görsel adresi girin.");
        }
        else
        {
            if (string.IsNullOrWhiteSpace(Input.PatternType) || PatternTypes.All(t => t.Value != Input.PatternType))
                ModelState.AddModelError("Input.PatternType", "Desen tipi seçin.");
            foreach (var (name, val) in new[] { ("BgColor", Input.BgColor), ("FgColor", Input.FgColor), ("AccentColor", Input.AccentColor) })
                if (!IsColor(val)) ModelState.AddModelError("Input." + name, "Geçerli bir renk girin (ör. #b08d57).");
            if (!string.IsNullOrWhiteSpace(Input.Color3) && !IsColor(Input.Color3))
                ModelState.AddModelError("Input.Color3", "Geçerli bir renk girin.");
        }

        if (!ModelState.IsValid)
        {
            await LoadListsAsync();
            return Page();
        }

        Product entity;
        if (Input.Id == 0)
        {
            entity = new Product { CreatedAt = DateTime.UtcNow };
            db.Products.Add(entity);
        }
        else
        {
            entity = await db.Products.Include(p => p.Rooms).FirstOrDefaultAsync(p => p.Id == Input.Id) ?? throw new InvalidOperationException();
        }

        entity.Code = Input.Code;
        entity.Name = Input.Name.Trim();
        entity.Variant = Input.Variant.Trim();
        entity.Collection = string.IsNullOrWhiteSpace(Input.Collection) ? Input.Name.Trim() : Input.Collection.Trim();
        entity.CategoryId = Input.CategoryId;
        entity.ToneId = Input.ToneId;
        entity.Material = Input.Material.Trim();
        entity.Badge = Input.Badge;
        entity.Size = Input.Size.Trim();
        entity.RepeatCm = Input.RepeatCm;
        entity.RollWidth = Input.RollWidth;
        entity.RollLength = Input.RollLength;
        entity.IsCustomSize = Input.IsCustomSize;
        entity.Price = Input.Price;
        entity.SortOrder = Input.SortOrder;
        entity.IsActive = Input.IsActive;
        if (Mode == "photo")
        {
            entity.PhotoUrl = uploaded ?? Input.PhotoUrl!.Trim();
            entity.PatternType = Input.PatternType; // yedek olarak sakla
        }
        else
        {
            entity.PhotoUrl = null;
            entity.PatternType = Input.PatternType;
            entity.BgColor = Input.BgColor?.ToLowerInvariant();
            entity.FgColor = Input.FgColor?.ToLowerInvariant();
            entity.AccentColor = Input.AccentColor?.ToLowerInvariant();
            entity.Color3 = string.IsNullOrWhiteSpace(Input.Color3) ? null : Input.Color3.ToLowerInvariant();
            entity.Seed = Input.Seed;
        }
        var rooms = await db.Rooms.Where(r => SelectedRooms.Contains(r.Id)).ToListAsync();
        entity.Rooms.Clear();
        entity.Rooms.AddRange(rooms);

        await db.SaveChangesAsync();
        Success(Input.Id == 0 ? $"{entity.Code} – {entity.Name} eklendi." : $"{entity.Code} – {entity.Name} kaydedildi.");
        return Request.Form.ContainsKey("saveAndNew")
            ? RedirectToPage("Duzenle", new { id = (int?)null })
            : RedirectToPage("Duzenle", new { id = entity.Id });
    }

    private static bool IsColor(string? v) => v != null && Regex.IsMatch(v.Trim(), "^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$");

    private async Task<string> NextCodeAsync()
    {
        var codes = await db.Products.Select(p => p.Code).ToListAsync();
        var max = codes.Select(c => Regex.Match(c, @"(\d+)$")).Where(m => m.Success).Select(m => int.Parse(m.Value)).DefaultIfEmpty(1000).Max();
        return "HZ-" + (max + 1);
    }

    private async Task LoadListsAsync()
    {
        Categories = await db.Categories.AsNoTracking().OrderBy(c => c.SortOrder).ToListAsync();
        Tones = await db.Tones.AsNoTracking().OrderBy(t => t.SortOrder).ToListAsync();
        Rooms = await db.Rooms.AsNoTracking().OrderBy(r => r.SortOrder).ToListAsync();
        Collections = await db.Products.Select(p => p.Collection).Distinct().OrderBy(x => x).ToListAsync();
        Materials = await db.Products.Select(p => p.Material).Distinct().OrderBy(x => x).ToListAsync();
    }
}
