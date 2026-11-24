using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using HazarDekorasyon.Web.Data;
using HazarDekorasyon.Web.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace HazarDekorasyon.Web.Pages.Admin;

[EnableRateLimiting("login")]
public class GirisModel(AppDbContext db) : PageModel
{
    [BindProperty, Required(ErrorMessage = "Kullanıcı adı zorunludur.")]
    public string UserName { get; set; } = "";

    [BindProperty, Required(ErrorMessage = "Şifre zorunludur."), DataType(DataType.Password)]
    public string Password { get; set; } = "";

    [BindProperty(SupportsGet = true)]
    public string? ReturnUrl { get; set; }

    public string? ErrorMessage { get; set; }
    public bool NoAdmin { get; set; }

    public async Task<IActionResult> OnGetAsync()
    {
        if (User.Identity?.IsAuthenticated == true) return LocalRedirect(SafeReturn());
        NoAdmin = !await db.AdminUsers.AnyAsync();
        return Page();
    }

    public async Task<IActionResult> OnPostAsync()
    {
        if (!ModelState.IsValid) return Page();

        var user = await db.AdminUsers.FirstOrDefaultAsync(u => u.UserName == UserName.Trim());
        var hasher = new PasswordHasher<AdminUser>();
        var ok = user != null && hasher.VerifyHashedPassword(user, user.PasswordHash, Password) != PasswordVerificationResult.Failed;
        if (!ok)
        {
            await Task.Delay(400); // deneme yanılmayı yavaşlat
            ErrorMessage = "Kullanıcı adı veya şifre hatalı.";
            return Page();
        }

        user!.LastLoginAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        var identity = new ClaimsIdentity(
            [new Claim(ClaimTypes.Name, user.UserName), new Claim(ClaimTypes.NameIdentifier, user.Id.ToString())],
            CookieAuthenticationDefaults.AuthenticationScheme);
        await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(identity));
        return LocalRedirect(SafeReturn());
    }

    private string SafeReturn() => !string.IsNullOrEmpty(ReturnUrl) && Url.IsLocalUrl(ReturnUrl) && ReturnUrl.StartsWith("/Admin", StringComparison.OrdinalIgnoreCase) ? ReturnUrl : "/Admin";
}
