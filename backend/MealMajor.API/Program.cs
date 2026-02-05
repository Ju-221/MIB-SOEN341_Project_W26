using Microsoft.EntityFrameworkCore;
using MealMajor.API.Data;

// MIB 2026 (C) - MealMajor Project
// This is the main entry point for the MealMajor API application.
// It sets up the web application, configures services, and defines middleware.
// see CONTRIBUTING.md for more info on how to contribute to the project.

var builder = WebApplication.CreateBuilder(args); // 


// database configuration (SQLite)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// maps all the apis in the controllers
builder.Services.AddOpenApi();

// Add controllers
builder.Services.AddControllers();

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
 
