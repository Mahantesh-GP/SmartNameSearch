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

// Enable API documentation (Swagger) in development environments.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(o => o.AddPolicy("ui", p =>
  p.WithOrigins("https://mahantesh-gp.github.io", "https://mahantesh-gp.github.io/SmartNameSearch")
   .AllowAnyHeader()
   .AllowAnyMethod()
   .AllowCredentials()
));




var app = builder.Build();
app.UseCors("ui");
// Only expose Swagger in development.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Map controllers.
app.MapControllers();

app.Run();