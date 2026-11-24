using HazarDekorasyon.Web.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace HazarDekorasyon.Web.Pages.Admin;

/// <summary>Admin sayfaları için ortak yardımcılar (bildirim mesajları, desen listesi).</summary>
public abstract class AdminPageModel : PageModel
{
    [TempData] public string? Flash { get; set; }
    [TempData] public string? FlashType { get; set; }

    protected void Success(string msg) { Flash = msg; FlashType = "success"; }
    protected void Error(string msg) { Flash = msg; FlashType = "error"; }

    protected IActionResult Back(string msg)
    {
        Success(msg);
        return RedirectToPage();
    }

    public static readonly (string Value, string Label)[] PatternTypes =
    [
        ("damask", "Damask"), ("cubes", "Küp (3D)"), ("fans", "Art Deco yelpaze"), ("ogee", "Ogee kafes"),
        ("rings", "İç içe halkalar"), ("leaves", "Botanik yaprak"), ("ginkgo", "Ginkgo"), ("eucalyptus", "Okaliptüs"),
        ("pinstripe", "İnce çizgi"), ("regency", "Regency çizgi"), ("chevron", "Zikzak"), ("waves", "Dalga"),
        ("linen", "Keten doku"), ("marble", "Mermer"), ("terrazzo", "Terrazzo"), ("tartan", "Ekose"),
        ("stars", "Yıldızlı gece"), ("rainbow", "Gökkuşağı"), ("mountains", "Dağlar"), ("dots", "Puantiye"),
        ("arches", "Kemer"), ("moroccan", "Fas karosu"), ("scales", "Balık pulu"),
    ];

    public static string BadgeLabel(ProductBadge b) => b switch { ProductBadge.New => "Yeni", ProductBadge.Best => "Çok Satan", _ => "" };

    public static string UnitLabel(PriceUnit u) => u switch
    {
        PriceUnit.WallSquareMeter => "Duvar m²",
        PriceUnit.CeilingSquareMeter => "Tavan m²",
        PriceUnit.LinearMeter => "Çevre (mt)",
        PriceUnit.Piece => "Adet",
        _ => "Sabit",
    };

    /// <summary>Türkçe karakterleri dönüştürerek URL uyumlu kısa ad üretir.</summary>
    public static string Slugify(string text)
    {
        var map = new Dictionary<char, string> { ['ç'] = "c", ['ğ'] = "g", ['ı'] = "i", ['İ'] = "i", ['ö'] = "o", ['ş'] = "s", ['ü'] = "u", ['Ç'] = "c", ['Ğ'] = "g", ['Ö'] = "o", ['Ş'] = "s", ['Ü'] = "u" };
        var sb = new System.Text.StringBuilder();
        foreach (var ch in text.Trim())
        {
            if (map.TryGetValue(ch, out var r)) sb.Append(r);
            else if (char.IsLetterOrDigit(ch)) sb.Append(char.ToLowerInvariant(ch));
            else sb.Append('-');
        }
        var s = System.Text.RegularExpressions.Regex.Replace(sb.ToString(), "-+", "-").Trim('-');
        return s.Length > 50 ? s[..50] : s;
    }
}
