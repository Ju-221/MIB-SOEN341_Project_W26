using Microsoft.AspNetCore.Mvc;
using MealMajor.API.DTOs;
using Supabase;
using MealMajor.API.Entities;
using MealMajor.API.Data;

namespace MealMajor.API.Controllers;

[ApiController]
[Route("[controller]")]
public class AuthController : ControllerBase 
{

    private readonly Client _supabase;
    private readonly AppDbContext _context;

    // we ask for the lcient in the constructor
    public AuthController(Client supabase, AppDbContext context)
    {
        _supabase = supabase;
        _context = context;
    }

    [HttpPost("signup")]
    public async Task<IActionResult> SignUp([FromBody] UserRegisterDto request)
    {
        var session = await _supabase.Auth.SignUp(request.Email, request.Password);
        
        if (session == null)
        {
            return BadRequest("signup failed");
        }

        //2 Create user in db
        if (string.IsNullOrEmpty(session.User.Id))
        {
            return BadRequest("Failed to get user ID from signup");
        }

        var newUser = new User{
            
            //we need to fix this to use proper OOP and not handle direct string to int conversion.
            Id = session.User.Id, // use the supabase id 
            
            Email = request.Email,
            // supabase handles the password hashing
            // ^ ps: I seriously hope it does
        };

        Console.WriteLine("Supabase User ID: " + session.User.Id);
        _context.Users.Add(newUser);
        await _context.SaveChangesAsync();

        return Ok(new {
            message = "Signup request received!",
            email = request.Email
        });
    }
}