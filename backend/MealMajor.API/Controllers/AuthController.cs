using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using MealMajor.API.DTOs;
using MealMajor.API.Models;
using MealMajor.API.Data;

namespace MealMajor.API.Controllers;

[ApiController]
[Route("[controller]")]
public class AuthController : ControllerBase 
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _config; 

    public AuthController(AppDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;

    }

    [HttpPost("signup")]
    public async Task<IActionResult> SignUp([FromBody] UserRegisterDto request)
    {

        // Check if the email already exists
        if (await _context.Users.AnyAsync( u => u.Email == request.Email))
        {
            return BadRequest(new { message = "Email already exists"});
        }
        
        var newUser = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            
        };

        _context.Users.Add(newUser);
        await _context.SaveChangesAsync();

        return Ok(new { message = "User created successfully", email = request.Email});

    }


    [HttpPost("signin")]
    public async Task<IActionResult> SignIn([FromBody] UserLoginDto request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user == null || ~BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
    }
    
}