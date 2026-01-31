using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using MealMajor.API.Data;

var builder = WebApplication.CreateBuilder(args); // 

// -

// 1 register services

// -

// enable controllers from services 
builder.Services.AddControllers();

// database configuration

builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("defaultConnection")));

// Authentication configuration Supabase JWT
// we read teh secretkey from appsettings.json
var jwtSecret = builder.Configuration["jwtSection:Secret"];

// Fallback just in case it's missing to prevent crash on startup, but auth won't work

var keyBytes = Encoding.UTF8.GetBytes(jwtSecret ??  "temp_key_so_it_compiles");


// what even are these
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

// maps all the apis in teh controllers
builder.Services.AddOpenApi();

var supabaseUrl = builder.Configuration["Supabase:Url"];
var supabaseKey = builder.Configuration["Supabase:Key"];
var options = new Supabase.SupabaseOptions {
    AutoRefreshToken = true,
    AutoConnectRealtime = true

};

//Register the service
builder.Services.AddSingleton(provider => new Supabase.Client(supabaseUrl, supabaseKey, options));

var app = builder.Build();


//===========
//2. COnfiguraiton

//=========


if (app.Environment.IsDevelopment()){
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// order matters

app.UseAuthentication(); // user
app.UseAuthorization(); // is allowed?


app.MapControllers();

app.Run();