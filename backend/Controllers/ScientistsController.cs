using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "admin")]
public class ScientistsController : ControllerBase
{
    private readonly AppDbContext _context;
    
    public ScientistsController(AppDbContext context)
    {
        _context = context;
    }
    
    [HttpGet]
    public async Task<ActionResult<List<Scientist>>> GetAll()
    {
        var scientists = await _context.Scientists.OrderBy(s => s.Name).ToListAsync();
        return Ok(scientists);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Scientist>> GetById(int id)
    {
        var scientist = await _context.Scientists.FindAsync(id);
        if (scientist == null) return NotFound(new { message = "Scientist not found" });
        return Ok(scientist);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var scientist = await _context.Scientists.FindAsync(id);
        if (scientist == null) return NotFound(new { message = "Scientist not found" });
        _context.Scientists.Remove(scientist);
        await _context.SaveChangesAsync();
        return NoContent();
    }
    
    [HttpPost("upload")]
    [RequestSizeLimit(2 * 1024 * 1024)] // 2 MB max
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "No file uploaded or file is empty" });
        
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension != ".csv")
            return BadRequest(new { message = "Invalid file type. Only CSV files are supported." });
        
        try
        {
            var scientists = new List<Scientist>();
            using var reader = new StreamReader(file.OpenReadStream());

            // Skip header row
            await reader.ReadLineAsync();
            
            string? line;
            // Fix CA2024: use ReadLineAsync return value instead of EndOfStream
            while ((line = await reader.ReadLineAsync()) != null)
            {
                if (string.IsNullOrWhiteSpace(line)) continue;
                
                var parts = line.Split(',');
                if (parts.Length < 2) continue; // Requires at least Name and Email
                
                var name  = parts[0].Trim().Trim('"');
                var email = parts[1].Trim().Trim('"').ToLowerInvariant();
                var dept  = parts.Length > 2 ? parts[2].Trim().Trim('"') : "General Research";
                
                if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(email)) continue;
                
                scientists.Add(new Scientist
                {
                    Name       = name,
                    Email      = email,
                    Department = dept
                });
            }
            
            if (scientists.Count == 0)
                return BadRequest(new { message = "No valid scientist records found in the CSV file." });
            
            // Clear existing non-seeded scientists and their mentor user logins before adding new ones
            var existingScientists = _context.Scientists.Where(s => s.Id > 4); // preserve seeded scientists
            _context.Scientists.RemoveRange(existingScientists);
            var existingMentors = _context.Users.Where(u => u.Role == "mentor" && u.Id > 5); // preserve seeded mentors
            _context.Users.RemoveRange(existingMentors);
            await _context.SaveChangesAsync();
            
            // Insert new scientists
            _context.Scientists.AddRange(scientists);
            
            // Generate corresponding user login credentials for each new scientist
            foreach (var scientist in scientists)
            {
                // Hash default password
                var passwordHash = BCrypt.Net.BCrypt.HashPassword("Mentor@123");
                _context.Users.Add(new User
                {
                    Name         = scientist.Name,
                    Email        = scientist.Email,
                    PasswordHash = passwordHash,
                    Role         = "mentor"
                });
            }
            
            await _context.SaveChangesAsync();
            
            return Ok(new { message = $"Successfully imported {scientists.Count} scientist(s) and synced login credentials." });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "Error parsing file. Check CSV format." });
        }
    }
}
