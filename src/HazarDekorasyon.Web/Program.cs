using System.Globalization;
using System.Threading.RateLimiting;
using HazarDekorasyon.Web.Data;
using HazarDekorasyon.Web.Services;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Localization;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Gizli yerel ayarlar (admin şifresi, bağlantı dizesi vb.) — git'e eklenmez
builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);

// --- Veritabanı: appsettings içindeki "Database:Provider" ile seçilir (Sqlite | SqlServer) ---
var provider = builder.Configuration["Database:Provider"] ?? "Sqlite";
builder.Services.AddDbContext<AppDbContext>(opt =>
{
    if (provider.Equals("SqlServer", StringComparison.OrdinalIgnoreCase))
        opt.UseSqlServer(builder.Configuration.GetConnectionString("SqlServer"));
    else
        opt.UseSqlite(builder.Configuration.GetConnectionString("Sqlite"));
});
if (!provider.Equals("SqlServer", StringComparison.OrdinalIgnoreCase))
    Directory.CreateDirectory(Path.Combine(builder.Environment.ContentRootPath, "App_Data"));

builder.Services.AddScoped<SiteSettingsService>();
builder.Services.AddScoped<CatalogService>();
builder.Services.AddScoped<ImageUploadService>();

builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(o =>
    {
        o.LoginPath = "/Admin/Giris";
        o.LogoutPath = "/Admin/Cikis";
        o.AccessDeniedPath = "/Admin/Giris";
        o.Cookie.Name = "hazar.admin";
        o.Cookie.HttpOnly = true;
        o.Cookie.SameSite = SameSiteMode.Strict;
        o.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        o.ExpireTimeSpan = TimeSpan.FromHours(8);
        o.SlidingExpiration = true;
    });
builder.Services.AddAuthorization();
builder.Services.Configure<RouteOptions>(o => o.LowercaseUrls = true);

// Admin girişine IP başına deneme sınırı (5 dakikada 10 deneme)
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.AddPolicy("login", ctx =>
        HttpMethods.IsPost(ctx.Request.Method)
            ? RateLimitPartition.GetFixedWindowLimiter(ctx.Connection.RemoteIpAddress?.ToString() ?? "?",
                _ => new FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromMinutes(5), QueueLimit = 0 })
            : RateLimitPartition.GetNoLimiter("get"));
});

builder.Services.AddRazorPages(o =>
{
    o.Conventions.AuthorizeFolder("/Admin");
    o.Conventions.AllowAnonymousToPage("/Admin/Giris");
    o.Conventions.AddPageRoute("/FiyatHesapla", "/fiyat-hesapla");
}).AddMvcOptions(o => o.ModelBinderProviders.Insert(0, new FlexibleDecimalModelBinderProvider()));

var app = builder.Build();

var tr = new CultureInfo("tr-TR");
app.UseRequestLocalization(new RequestLocalizationOptions
{
    DefaultRequestCulture = new RequestCulture(tr),
    SupportedCultures = [tr],
    SupportedUICultures = [tr],
});

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapRazorPages();

// Eski statik sayfa adreslerini yeni adreslere yönlendir
app.MapGet("/index.html", () => Results.Redirect("/", permanent: true));
app.MapGet("/katalog.html", (HttpContext ctx) => Results.Redirect("/katalog" + ctx.Request.QueryString, permanent: true));

await SeedData.InitializeAsync(app.Services);

app.Run();
