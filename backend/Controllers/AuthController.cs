using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using backend.Data;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _config;
    
    public AuthController(AppDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }
    
    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { message = "Email and password are required" });

        var user = _context.Users.FirstOrDefault(u => u.Email == request.Email);
        
        if (user == null)
            return Unauthorized(new { message = "Invalid email or password" });

        // Verify password using BCrypt
        bool passwordValid;
        try
        {
            passwordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
        }
        catch
        {
            // Fallback for plaintext passwords in dev/seeded data (migration path)
            passwordValid = user.PasswordHash == request.Password;
        }

        if (!passwordValid)
            return Unauthorized(new { message = "Invalid email or password" });
        
        var jwtKey = _config["Jwt:Key"];
        if (string.IsNullOrEmpty(jwtKey))
            return StatusCode(500, new { message = "Server configuration error" });

        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(jwtKey);
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role)
            }),
            Expires = DateTime.UtcNow.AddHours(8),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature),
            Issuer = _config["Jwt:Issuer"],
            Audience = _config["Jwt:Audience"]
        };
        
        var token = tokenHandler.CreateToken(tokenDescriptor);
        
        return Ok(new LoginResponse
        {
            Token = tokenHandler.WriteToken(token),
            Name = user.Name,
            Email = user.Email,
            Role = user.Role
        });
    }
}
