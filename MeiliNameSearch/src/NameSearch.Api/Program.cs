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