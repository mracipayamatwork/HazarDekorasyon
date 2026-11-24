using System.Globalization;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace HazarDekorasyon.Web.Services;

/// <summary>
/// Ondalık sayıları hem "0,53" hem "0.53" biçiminde kabul eder.
/// (Sunucu tr-TR kültüründe çalıştığı için varsayılan bağlayıcı noktayı binlik ayırıcı sanıyor.)
/// </summary>
public class FlexibleDecimalModelBinder : IModelBinder
{
    public Task BindModelAsync(ModelBindingContext ctx)
    {
        var result = ctx.ValueProvider.GetValue(ctx.ModelName);
        if (result == ValueProviderResult.None) return Task.CompletedTask;
        ctx.ModelState.SetModelValue(ctx.ModelName, result);

        var raw = result.FirstValue?.Trim().Replace(" ", "").Replace("₺", "");
        if (string.IsNullOrEmpty(raw))
        {
            if (Nullable.GetUnderlyingType(ctx.ModelType) != null) ctx.Result = ModelBindingResult.Success(null);
            return Task.CompletedTask;
        }
        if (raw.Contains(',') && raw.Contains('.')) raw = raw.Replace(".", ""); // 1.250,50
        raw = raw.Replace(',', '.');

        if (decimal.TryParse(raw, NumberStyles.Number, CultureInfo.InvariantCulture, out var value))
            ctx.Result = ModelBindingResult.Success(value);
        else
            ctx.ModelState.TryAddModelError(ctx.ModelName, "Geçerli bir sayı girin.");
        return Task.CompletedTask;
    }
}

public class FlexibleDecimalModelBinderProvider : IModelBinderProvider
{
    public IModelBinder? GetBinder(ModelBinderProviderContext context) =>
        context.Metadata.ModelType == typeof(decimal) || context.Metadata.ModelType == typeof(decimal?)
            ? new FlexibleDecimalModelBinder()
            : null;
}
