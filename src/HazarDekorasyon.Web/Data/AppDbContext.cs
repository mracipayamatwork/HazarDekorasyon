using HazarDekorasyon.Web.Models;
using Microsoft.EntityFrameworkCore;

namespace HazarDekorasyon.Web.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Tone> Tones => Set<Tone>();
    public DbSet<Room> Rooms => Set<Room>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<PriceService> PriceServices => Set<PriceService>();
    public DbSet<PriceOption> PriceOptions => Set<PriceOption>();
    public DbSet<SiteSetting> SiteSettings => Set<SiteSetting>();
    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Category>().HasIndex(x => x.Slug).IsUnique();
        b.Entity<Tone>().HasIndex(x => x.Slug).IsUnique();
        b.Entity<Room>().HasIndex(x => x.Slug).IsUnique();
        b.Entity<AdminUser>().HasIndex(x => x.UserName).IsUnique();

        b.Entity<Product>(e =>
        {
            e.HasIndex(x => x.Code).IsUnique();
            e.Property(x => x.RollWidth).HasPrecision(6, 2);
            e.Property(x => x.RollLength).HasPrecision(6, 2);
            e.Property(x => x.Price).HasPrecision(18, 2);
            e.HasOne(x => x.Category).WithMany(c => c.Products).HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Tone).WithMany(t => t.Products).HasForeignKey(x => x.ToneId).OnDelete(DeleteBehavior.Restrict);
            e.HasMany(x => x.Rooms).WithMany(r => r.Products).UsingEntity(j => j.ToTable("ProductRooms"));
        });

        b.Entity<PriceOption>(e =>
        {
            e.Property(x => x.UnitPrice).HasPrecision(18, 2);
            e.HasOne(x => x.PriceService).WithMany(s => s.Options).HasForeignKey(x => x.PriceServiceId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
