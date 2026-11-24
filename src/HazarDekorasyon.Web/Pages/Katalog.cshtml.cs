using HazarDekorasyon.Web.Services;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace HazarDekorasyon.Web.Pages;

public class KatalogModel(SiteSettingsService settings) : PageModel
{
    public SiteInfo Site { get; private set; } = default!;

    public async Task OnGetAsync() => Site = await settings.InfoAsync();
}
