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

    public AuthController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] UserRegisterDto request)
    {
        var user = await _context.Users.SingleOrDefaultAsync(u => u.Email == request.Email);
        if (user == null)
        {
            return Unauthorized("Invalid credentials");
        }

        var providedHash = HashPassword(request.Password);
        var isMatch = FixedTimeEquals(user.passwordHash, providedHash) || user.passwordHash == request.Password;
        if (!isMatch)
        {
            return Unauthorized("Invalid credentials");
        }

        return Ok(new
        {
            message = "Login successful",
            email = user.Email
        });
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

        Console.WriteLine("Signup successful for " + user.Email);
        return Ok(new
        {
            message = "Signup successful",
            email = user.Email
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