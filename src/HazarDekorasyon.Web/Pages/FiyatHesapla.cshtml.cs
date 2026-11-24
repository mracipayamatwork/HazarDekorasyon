using System.Text.Json;
using HazarDekorasyon.Web.Services;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace HazarDekorasyon.Web.Pages;

public class FiyatHesaplaModel(CatalogService catalog, SiteSettingsService settings) : PageModel
{
    public SiteInfo Site { get; private set; } = default!;
    public string PricingJson { get; private set; } = "[]";

    public async Task OnGetAsync()
    {
        Site = await settings.InfoAsync();
        PricingJson = JsonSerializer.Serialize(await catalog.PricingDataAsync(), CatalogService.Json);
    }
}
