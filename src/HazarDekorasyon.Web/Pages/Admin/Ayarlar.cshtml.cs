using HazarDekorasyon.Web.Data;
using HazarDekorasyon.Web.Models;
using HazarDekorasyon.Web.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HazarDekorasyon.Web.Pages.Admin;

public class AyarlarModel(AppDbContext db, SiteSettingsService settings) : AdminPageModel
{
    [BindProperty] public Dictionary<string, string?> Values { get; set; } = new();

    public async Task OnGetAsync() => Values = await settings.AllAsync();

    public async Task<IActionResult> OnPostAsync()
    {
        foreach (var def in SettingKeys.All)
        {
            var v = Values.GetValueOrDefault(def.Key)?.Trim();
            if (def.Type == "bool") v = v == "true" ? "true" : "false";
            if (def.Type == "number")
            {
                var norm = (v ?? "0").Replace(',', '.');
                if (!decimal.TryParse(norm, System.Globalization.NumberStyles.Number, System.Globalization.CultureInfo.InvariantCulture, out var d) || d < 0)
                    ModelState.AddModelError($"Values[{def.Key}]", $"“{def.Label}” için geçerli bir sayı girin.");
                v = norm;
            }
            Values[def.Key] = v;
        }
        if (!ModelState.IsValid) return Page();

        var stored = await db.SiteSettings.ToDictionaryAsync(s => s.Key);
        foreach (var def in SettingKeys.All)
        {
            if (stored.TryGetValue(def.Key, out var s)) s.Value = Values[def.Key];
            else db.SiteSettings.Add(new SiteSetting { Key = def.Key, Value = Values[def.Key] });
        }
        await db.SaveChangesAsync();
        return Back("Ayarlar kaydedildi.");
    }
}
