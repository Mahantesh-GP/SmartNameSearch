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
    var host = configuration["MEILI_HOST"] ?? "https://smartnamesearch.onrender.com";
    client.BaseAddress = new Uri(host);
    var apiKey = "f366fe5896d3f3ef6713d68ed59ef829";
    if (!string.IsNullOrWhiteSpace(apiKey))
    {
        // Recent Meilisearch versions expect a Bearer token in the Authorization header.
        // Use System.Net.Http.Headers.AuthenticationHeaderValue to set it.
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
    }
});

// Named HttpClient for external sample data fetches (randomuser.me)
builder.Services.AddHttpClient("randomuser", client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
});

// Background task queue and hosted service for long-running indexing jobs
builder.Services.AddSingleton<NameSearch.Api.Background.IBackgroundTaskQueue, NameSearch.Api.Background.BackgroundTaskQueue>();
builder.Services.AddHostedService<NameSearch.Api.Background.QueuedHostedService>();

// Simple in-memory job tracker
builder.Services.AddSingleton<NameSearch.Api.Background.JobTracker>();

// Register custom services.
builder.Services.AddSingleton<NicknameProvider>();
builder.Services.AddSingleton<DoubleMetaphone>();
builder.Services.AddScoped<IndexService>();
builder.Services.AddScoped<SearchService>();

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

app.Run();