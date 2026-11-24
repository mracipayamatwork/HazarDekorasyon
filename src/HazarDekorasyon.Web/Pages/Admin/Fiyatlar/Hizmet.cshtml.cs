using System.ComponentModel.DataAnnotations;
using HazarDekorasyon.Web.Data;
using HazarDekorasyon.Web.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HazarDekorasyon.Web.Pages.Admin.Fiyatlar;

public class HizmetModel(AppDbContext db) : AdminPageModel
{
    public class OptionRow
    {
        public int Id { get; set; }
        [StringLength(100)] public string? Name { get; set; }
        [StringLength(200)] public string? Description { get; set; }
        public PriceOptionKind Kind { get; set; }
        public PriceUnit Unit { get; set; }
        [Range(0, 10_000_000, ErrorMessage = "Geçerli fiyat girin.")] public decimal UnitPrice { get; set; }
        public int SortOrder { get; set; }
        public bool IsActive { get; set; } = true;
        public bool Delete { get; set; }
    }

    [BindProperty] public PriceService Input { get; set; } = new();
    [BindProperty] public List<OptionRow> Options { get; set; } = new();
    public bool IsNew => Input.Id == 0;
    private const int BlankRows = 3;

    public async Task<IActionResult> OnGetAsync(int? id)
    {
        if (id is int sid)
        {
            var s = await db.PriceServices.AsNoTracking().Include(x => x.Options).FirstOrDefaultAsync(x => x.Id == sid);
            if (s == null) return NotFound();
            Input = s;
            Options = s.Options.OrderBy(o => o.Kind).ThenBy(o => o.SortOrder).Select(o => new OptionRow
            {
                Id = o.Id, Name = o.Name, Description = o.Description, Kind = o.Kind, Unit = o.Unit,
                UnitPrice = o.UnitPrice, SortOrder = o.SortOrder, IsActive = o.IsActive,
            }).ToList();
        }
        else
        {
            Input = new PriceService { IsActive = true, SortOrder = (await db.PriceServices.MaxAsync(x => (int?)x.SortOrder) ?? -1) + 1 };
        }
        AddBlankRows();
        return Page();
    }

    public async Task<IActionResult> OnPostAsync(int? id)
    {
        Input.Id = id ?? 0;
        var rows = Options.Where(o => o.Id != 0 || !string.IsNullOrWhiteSpace(o.Name)).ToList();
        for (var i = 0; i < Options.Count; i++)
        {
            var o = Options[i];
            if (!o.Delete && (o.Id != 0 || !string.IsNullOrWhiteSpace(o.Name)) && string.IsNullOrWhiteSpace(o.Name))
                ModelState.AddModelError($"Options[{i}].Name", "Seçenek adı boş olamaz.");
        }
        if (!rows.Any(o => !o.Delete && o.Kind == PriceOptionKind.Main && o.IsActive))
            ModelState.AddModelError("", "Hizmetin hesaplayıcıda görünmesi için en az bir aktif “Ana seçenek” gerekir.");

        if (!ModelState.IsValid)
        {
            AddBlankRows();
            return Page();
        }

        PriceService entity;
        if (Input.Id == 0)
        {
            entity = new PriceService();
            db.PriceServices.Add(entity);
        }
        else
        {
            entity = await db.PriceServices.Include(s => s.Options).FirstOrDefaultAsync(s => s.Id == Input.Id) ?? throw new InvalidOperationException();
        }
        entity.Name = Input.Name.Trim();
        entity.Description = Input.Description?.Trim();
        entity.SortOrder = Input.SortOrder;
        entity.IsActive = Input.IsActive;

        foreach (var r in rows)
        {
            var existing = r.Id == 0 ? null : entity.Options.FirstOrDefault(o => o.Id == r.Id);
            if (r.Delete)
            {
                if (existing != null) db.PriceOptions.Remove(existing);
                continue;
            }
            var o = existing ?? new PriceOption();
            o.Name = r.Name!.Trim();
            o.Description = string.IsNullOrWhiteSpace(r.Description) ? null : r.Description.Trim();
            o.Kind = r.Kind;
            o.Unit = r.Unit;
            o.UnitPrice = r.UnitPrice;
            o.SortOrder = r.SortOrder;
            o.IsActive = r.IsActive;
            if (existing == null) entity.Options.Add(o);
        }
        await db.SaveChangesAsync();
        Success($"“{entity.Name}” hizmeti kaydedildi.");
        return RedirectToPage("Hizmet", new { id = entity.Id });
    }

    private void AddBlankRows()
    {
        var next = Options.Count == 0 ? 0 : Options.Max(o => o.SortOrder) + 1;
        var blanks = Options.Count(o => o.Id == 0 && string.IsNullOrWhiteSpace(o.Name));
        for (var i = blanks; i < BlankRows; i++)
            Options.Add(new OptionRow { SortOrder = next++, Kind = Options.Any(o => o.Kind == PriceOptionKind.Main) ? PriceOptionKind.Extra : PriceOptionKind.Main });
    }
}
