using System.ComponentModel.DataAnnotations;
using HazarDekorasyon.Web.Data;
using HazarDekorasyon.Web.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HazarDekorasyon.Web.Pages.Admin;

public class SifreModel(AppDbContext db) : AdminPageModel
{
    [BindProperty, Required(ErrorMessage = "Mevcut şifrenizi girin."), DataType(DataType.Password), Display(Name = "Mevcut şifre")]
    public string Current { get; set; } = "";

    [BindProperty, Required(ErrorMessage = "Yeni şifre girin."), DataType(DataType.Password), Display(Name = "Yeni şifre")]
    [StringLength(100, MinimumLength = 10, ErrorMessage = "Yeni şifre en az 10 karakter olmalı.")]
    public string New { get; set; } = "";

    [BindProperty, DataType(DataType.Password), Display(Name = "Yeni şifre (tekrar)")]
    [Compare(nameof(New), ErrorMessage = "Şifreler eşleşmiyor.")]
    public string Confirm { get; set; } = "";

    public void OnGet() { }

    public async Task<IActionResult> OnPostAsync()
    {
        if (!ModelState.IsValid) return Page();
        var user = await db.AdminUsers.FirstOrDefaultAsync(u => u.UserName == User.Identity!.Name);
        if (user == null) return Forbid();
        var hasher = new PasswordHasher<AdminUser>();
        if (hasher.VerifyHashedPassword(user, user.PasswordHash, Current) == PasswordVerificationResult.Failed)
        {
            ModelState.AddModelError(nameof(Current), "Mevcut şifre hatalı.");
            return Page();
        }
        user.PasswordHash = hasher.HashPassword(user, New);
        await db.SaveChangesAsync();
        return Back("Şifreniz değiştirildi.");
    }
}
