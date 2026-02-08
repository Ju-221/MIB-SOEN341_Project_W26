using Microsoft.EntityFrameworkCore;
using MealMajor.API.Data;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using System.Threading;

// MIB 2026 (C) - MealMajor Project
// This is the main entry point for the MealMajor API application.
// It sets up the web application, configures services, and defines middleware.
// see CONTRIBUTING.md for more info on how to contribute to the project.

const string SingleInstanceMutexName = "MealMajor.API.SingleInstance";
using var singleInstanceMutex = new Mutex(true, SingleInstanceMutexName, out var isFirstInstance);

//adding threadlock to prevent multiple instances.
if (!isFirstInstance)
{
    Console.Error.WriteLine("MealMajor.API is already running. Aborting startup.");
    Environment.Exit(1);
}

var builder = WebApplication.CreateBuilder(args); // 


// database configuration (SQLite)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// maps all the apis in the controllers
builder.Services.AddOpenApi();

// Add controllers
builder.Services.AddControllers();

builder.Services.AddScoped<TokenService>();

var jwtSecret = builder.Configuration["JwtSettings:Secret"] ?? throw new InvalidOperationException("JWT secret not configured");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(jwtSecret)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true
        };
    });

builder.Services.AddAuthorization();

// Add CORS to allow frontend to make requests
//I don't feel too confident about having this here, but it works for now.
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:8080", "http://localhost:5173", "http://localhost:3000")
              .AllowAnyHeader() //really we couldn't find a way to limit this better?
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Ensure Users table exists (temporary placement)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    EnsureTable.EnsureUsersTable(db);
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// Enable CORS
app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

// Map all controllers
app.MapControllers();


// To be removed out of Program.cs into the proper service files later
//--------------- template -----------

//easter egg - documented tho
var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast =  Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast");


app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}

