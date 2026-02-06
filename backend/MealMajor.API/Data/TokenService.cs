using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace MealMajor.API.Data;
public class TokenService(IConfiguration configuration)
{
     private string _jwtSecret = configuration["JwtSettings:Secret"] ?? throw new InvalidOperationException("JWT secret not configured");
    
    public string GenerateToken(string userId)
    {
        var key = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(_jwtSecret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, userId) };

        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}