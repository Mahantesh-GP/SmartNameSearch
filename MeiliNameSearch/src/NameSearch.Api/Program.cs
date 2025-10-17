using Microsoft.AspNetCore.Mvc;
using NameSearch.Infrastructure.Services;
using NameSearch.Infrastructure.Models;

var builder = WebApplication.CreateBuilder(args);

// Add controllers (MVC) support.
builder.Services.AddControllers();

// Register HttpClient for MeiliSearch interactions. Use the MEILI_HOST and MEILI_API_KEY
// environment variables to configure the client at runtime.
builder.Services.AddHttpClient<MeiliSearchClient>((serviceProvider, client) =>
{
    var configuration = serviceProvider.GetRequiredService<IConfiguration>();
    var host = configuration["MEILI_HOST"] ?? "http://localhost:7700";
    client.BaseAddress = new Uri(host);
    var apiKey = configuration["MEILI_API_KEY"];
    if (!string.IsNullOrWhiteSpace(apiKey))
    {
        // Meilisearch expects the API key in the X-Meili-API-Key header by default.
        client.DefaultRequestHeaders.Add("X-Meili-API-Key", apiKey);
    }
});

// Register custom services.
builder.Services.AddSingleton<NicknameProvider>();
builder.Services.AddSingleton<DoubleMetaphone>();
builder.Services.AddScoped<IndexService>();
builder.Services.AddScoped<SearchService>();

// Enable API documentation (Swagger) in development environments.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Only expose Swagger in development.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Map controllers.
app.MapControllers();

app.Run();