using Microsoft.EntityFrameworkCore;
using MealMajor.API.Data;
using Supabase;
using System.Configuration;

var builder = WebApplication.CreateBuilder(args);

    var url = "https://fhrltmywppxsfuorbpdt.supabase.co/";
    var key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocmx0bXl3cHB4c2Z1b3JicGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0ODI1NjUsImV4cCI6MjA4NTA1ODU2NX0.Wo0acq3UAJyJ4ZzKZ7BW_VsKIgXOU1Gfm21EPTz0XX0";
    var options = new SupabaseOptions

    {
        AutoRefreshToken = true,
        AutoConnectRealtime = true,
         // SessionHandler = new SupabaseSessionHandler() <-- This must be implemented by the developer
    };

// Note the creation as a singleton.
builder.Services.AddSingleton(provider => new Supabase.Client(url, key, options));


// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
// maps out aall the endpoints
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
 
