using Microsoft.AspNetCore.Mvc;
using NameSearch.Infrastructure.Services;
using NameSearch.Infrastructure.Models;
using System.Net.Http.Headers;

var builder = WebApplication.CreateBuilder(args);

// Add controllers (MVC) support.
builder.Services.AddControllers();

// Register HttpClient for MeiliSearch interactions. Use the MEILI_HOST and MEILI_API_KEY
// environment variables to configure the client at runtime.
builder.Services.AddHttpClient<MeiliSearchClient>((serviceProvider, client) =>
{
    var configuration = serviceProvider.GetRequiredService<IConfiguration>();
    var host = configuration["MEILI_HOST"] ?? "https://meilisearch-latest-mhph.onrender.com/";
    if (!host.EndsWith("/", StringComparison.Ordinal)) host += "/";
    client.BaseAddress = new Uri(host);
    var apiKey = configuration["MEILI_API_KEY"] ?? "f366fe5896d3f3ef6713d68ed59ef829";
    if (!string.IsNullOrWhiteSpace(apiKey))
    {
        // Send both headers to be compatible across Meilisearch versions
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
        client.DefaultRequestHeaders.Remove("X-Meili-API-Key");
        client.DefaultRequestHeaders.Add("X-Meili-API-Key", apiKey);
    }
});

// Register HttpClient for SearchService (same configuration as MeiliSearchClient)
builder.Services.AddHttpClient<SearchService>((serviceProvider, client) =>
{
    var configuration = serviceProvider.GetRequiredService<IConfiguration>();
    var host = configuration["MEILI_HOST"] ?? "https://meilisearch-latest-mhph.onrender.com/";
    if (!host.EndsWith("/", StringComparison.Ordinal)) host += "/";
    client.BaseAddress = new Uri(host);
    var apiKey = configuration["MEILI_API_KEY"] ?? "f366fe5896d3f3ef6713d68ed59ef829";
    if (!string.IsNullOrWhiteSpace(apiKey))
    {
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
        client.DefaultRequestHeaders.Remove("X-Meili-API-Key");
        client.DefaultRequestHeaders.Add("X-Meili-API-Key", apiKey);
    }
});

// Named HttpClient for external sample data fetches (randomuser.me)
builder.Services.AddHttpClient("randomuser", client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
    // Some public APIs reject requests without a User-Agent. Ensure we send a friendly UA and JSON accept header.
    client.DefaultRequestHeaders.UserAgent.ParseAdd("SmartNameSearch/1.0 (+https://smartnamesearch.onrender.com)");
    client.DefaultRequestHeaders.Accept.Clear();
    client.DefaultRequestHeaders.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));
});

// Background task queue and hosted service for long-running indexing jobs
builder.Services.AddSingleton<NameSearch.Api.Background.IBackgroundTaskQueue, NameSearch.Api.Background.BackgroundTaskQueue>();
builder.Services.AddHostedService<NameSearch.Api.Background.QueuedHostedService>();

// Simple in-memory job tracker
builder.Services.AddSingleton<NameSearch.Api.Background.JobTracker>();

// Register custom services.
builder.Services.AddSingleton<DoubleMetaphoneEncoder>(_ => new DoubleMetaphoneEncoder(true, 4));
builder.Services.AddSingleton<IPhoneticEncoder>(sp => sp.GetRequiredService<DoubleMetaphoneEncoder>());
builder.Services.AddSingleton<INicknameProvider>(_ =>
{
    var path = builder.Configuration["NICKNAMES_PATH"] ?? Path.Combine(AppContext.BaseDirectory, "tools", "dictionaries", "nicknames.json");
    return new NicknameProvider(path);
});
builder.Services.AddScoped<IndexService>();

// Note: SearchService HttpClient is already registered via AddHttpClient<SearchService> above
// So we don't need AddScoped here - it's automatically registered by the HttpClient factory

// Configure CORS using ALLOWED_ORIGINS env var (semicolon-separated). Provide sensible defaults
// so the frontend (GitHub Pages, Render static site, or local Vite) can reach the API.
var configuration = builder.Configuration;
var allowedOriginsEnv = configuration["ALLOWED_ORIGINS"];
var allowedOrigins = (string.IsNullOrWhiteSpace(allowedOriginsEnv)
    ? new[] { "https://mahantesh-gp.github.io", "https://smartnamesearch.onrender.com", "http://localhost:5173" }
    : allowedOriginsEnv.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));

// Enable API documentation (Swagger) in development environments.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(o => o.AddPolicy("ui", p =>
    p.WithOrigins(allowedOrigins)
     .AllowAnyHeader()
     .AllowAnyMethod()
     .AllowCredentials()
));

var app = builder.Build();
app.UseCors("ui");

// If you want to verify which origins are allowed at runtime, uncomment the line below (for debugging):
// Console.WriteLine($"Allowed CORS origins: {string.Join(', ', allowedOrigins)}");
// Expose Swagger when running in Development, or when the ENABLE_SWAGGER env var is set to true.
var enableSwaggerEnv = configuration["ENABLE_SWAGGER"];
var enableSwagger = app.Environment.IsDevelopment()
    || (bool.TryParse(enableSwaggerEnv, out var parsed) && parsed);
if (enableSwagger)
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Map controllers.
app.MapControllers();

// Lightweight health endpoint
app.MapGet("/healthz", () => Results.Ok(new { status = "ok" }));

app.Run();