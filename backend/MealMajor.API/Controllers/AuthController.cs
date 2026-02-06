using Microsoft.AspNetCore.Mvc;
using MealMajor.API.DTOs;
using MealMajor.API.Data;
using MealMajor.API.Entities;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace MealMajor.API.Controllers;

[Route("auth")]
public class AuthController : ControllerBase 
{
    private readonly AppDbContext _context;
    private readonly TokenService _tokenService;
    
    public AuthController(AppDbContext context, TokenService tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] UserLoginDto loginDto )
    {
        var user = await _context.Users.SingleOrDefaultAsync(u => u.Email == loginDto.Email);
        if (user == null)
        {
            return Unauthorized("Invalid credentials");
        }

        var providedHash = HashPassword(loginDto.Password);
        var isMatch = FixedTimeEquals(user.passwordHash, providedHash) || user.passwordHash == loginDto.Password;
        if (!isMatch)
        {
            return Unauthorized("Invalid credentials");
        }

        var token = _tokenService.GenerateToken(user.Id.ToString());
        return Ok(new { token = token, message = "Login successful" });
    }

    [HttpPost("signup")]
    public async Task<IActionResult> Signup([FromBody] UserRegisterDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("email, and password are required.");
        }

        var exists = await _context.Users.AnyAsync(u => u.Email == request.Email);
        if (exists)
        {
            return Conflict("Email already in use.");
        }

        var user = new User
        {
            Email = request.Email,
            passwordHash = HashPassword(request.Password)
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var token = _tokenService.GenerateToken(user.Id.ToString());
        Console.WriteLine("Signup successful for " + user.Email);
        return Ok(new
        {
            message = "Signup successful",
            email = user.Email,
            token = token
        });
    }

    //we're doing our own hashing now.
    //honestly if we follow OOP this should be done at the entity level but whatever.
    private static string HashPassword(string password)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        return Convert.ToHexString(bytes);
    }

    private static bool FixedTimeEquals(string left, string right)
    {
        var leftBytes = Encoding.UTF8.GetBytes(left);
        var rightBytes = Encoding.UTF8.GetBytes(right);
        return leftBytes.Length == rightBytes.Length && CryptographicOperations.FixedTimeEquals(leftBytes, rightBytes);
    }
}