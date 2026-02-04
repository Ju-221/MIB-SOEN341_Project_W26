using Microsoft.EntityFrameworkCore;
using MealMajor.API.Data;
using Supabase;
using System.Configuration;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

// MIB 2026 (C) - MealMajor Project
// This is the main entry point for the MealMajor API application.
// It sets up the web application, configures services, and defines middleware.
// see CONTRIBUTING.md for more info on how to contribute to the project.

var builder = WebApplication.CreateBuilder(args); // 


// enable controllers from services 
builder.Services.AddControllers();

// database configuration

builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("SupabasedConnectionString")));

// Authentication configuration Supabase JWT
// we read teh secretkey from appsettings.json
var jwtSecret = builder.Configuration["jwtSection:Secret"];

// Fallback just in case it's missing to prevent crash on startup, but auth won't work

var keyBytes = Encoding.UTF8.GetBytes(jwtSecret ??  "temp_key_so_it_compiles");


// what even are these
// ^lmao
builder.Services.AddAuthentication(options => {
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options => {
    options.RequireHttpsMetadata = false; // why https if we run local will it work 
    options.SaveToken = true;
    options.TokenValidationParameters  = new TokenValidationParameters 
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
        ValidateIssuer = false,
        ValidateAudience = false
    };
});

// maps all the apis in the controllers
builder.Services.AddOpenApi();

// Add controllers
builder.Services.AddControllers();

// Add authorization
builder.Services.AddAuthorization();


// default connection in in teh appsettings.Development.json and is the supabase URI
// we specify the DbContext to be of type AppDbContext which we know to be a posgres db and we pass the right URI

builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("SupabasedConnectionString")));
//builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// Use authentication and authorization
//app.UseAuthentication();
//app.UseAuthorization();

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
 
