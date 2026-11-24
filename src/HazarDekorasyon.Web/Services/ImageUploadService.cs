namespace HazarDekorasyon.Web.Services;

/// <summary>Admin panelinden yüklenen görselleri wwwroot/uploads altına kaydeder.</summary>
public class ImageUploadService(IWebHostEnvironment env)
{
    private static readonly Dictionary<string, byte[][]> Signatures = new()
    {
        [".jpg"] = [[0xFF, 0xD8, 0xFF]],
        [".jpeg"] = [[0xFF, 0xD8, 0xFF]],
        [".png"] = [[0x89, 0x50, 0x4E, 0x47]],
        [".webp"] = [[0x52, 0x49, 0x46, 0x46]],
    };
    public const long MaxBytes = 5 * 1024 * 1024;

    /// <returns>Kaydedilen dosyanın site içi yolu ya da hata mesajı.</returns>
    public async Task<(string? Url, string? Error)> SaveAsync(IFormFile file, string folder)
    {
        if (file.Length == 0) return (null, "Dosya boş.");
        if (file.Length > MaxBytes) return (null, "Görsel en fazla 5 MB olabilir.");
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!Signatures.TryGetValue(ext, out var sigs)) return (null, "Sadece JPG, PNG veya WEBP yükleyebilirsiniz.");

        await using var stream = file.OpenReadStream();
        var head = new byte[8];
        var read = await stream.ReadAsync(head);
        if (!sigs.Any(sig => read >= sig.Length && head.Take(sig.Length).SequenceEqual(sig)))
            return (null, "Dosya içeriği geçerli bir görsel değil.");
        stream.Position = 0;

        var dir = Path.Combine(env.WebRootPath, "uploads", folder);
        Directory.CreateDirectory(dir);
        var name = $"{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid():N}"[..28] + ext;
        await using (var fs = File.Create(Path.Combine(dir, name)))
            await stream.CopyToAsync(fs);
        return ($"/uploads/{folder}/{name}", null);
    }
}
