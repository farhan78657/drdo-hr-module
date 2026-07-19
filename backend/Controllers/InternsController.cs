using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InternsController : ControllerBase
{
    private readonly AppDbContext _context;

    private string? UserRole => User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
    private string? UserName => User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;
    
    public InternsController(AppDbContext context)
    {
        _context = context;
    }
    
    [HttpGet]
    public async Task<ActionResult<List<Intern>>> GetAll()
    {
        IQueryable<Intern> query = _context.Interns;

        // IDOR Prevention: Mentors can only retrieve their assigned interns
        if (UserRole == "mentor")
        {
            var mentorName = UserName;
            if (string.IsNullOrEmpty(mentorName))
                return Forbid();
            query = query.Where(i => i.MentorName == mentorName);
        }

        var interns = await query.OrderByDescending(i => i.CreatedAt).ToListAsync();
        return Ok(interns);
    }
    
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Intern>> GetById(int id)
    {
        var intern = await _context.Interns.FindAsync(id);
        if (intern == null) return NotFound(new { message = "Intern not found" });

        // IDOR Prevention: Mentors can only retrieve their assigned interns
        if (UserRole == "mentor")
        {
            var mentorName = UserName;
            if (string.IsNullOrEmpty(mentorName) || intern.MentorName != mentorName)
                return Forbid();
        }

        return Ok(intern);
    }
    
    [HttpPost]
    public async Task<ActionResult<Intern>> Create([FromBody] Intern intern)
    {
        // Privilege Escalation Prevention: Only admin can register new interns
        if (UserRole != "admin")
            return Forbid();

        if (string.IsNullOrWhiteSpace(intern.Name))
            return BadRequest(new { message = "Name is required" });
        if (string.IsNullOrWhiteSpace(intern.Email))
            return BadRequest(new { message = "Email is required" });
        if (string.IsNullOrWhiteSpace(intern.AadharNo) || intern.AadharNo.Length != 12)
            return BadRequest(new { message = "Aadhar number must be 12 digits" });
        if (string.IsNullOrWhiteSpace(intern.Mobile))
            return BadRequest(new { message = "Mobile number is required" });

        intern.Id = 0;
        intern.CreatedAt = DateTime.UtcNow;
        intern.Status = "New";
        intern.Name = intern.Name.Trim();
        intern.Email = intern.Email.Trim().ToLowerInvariant();

        _context.Interns.Add(intern);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = intern.Id }, intern);
    }
    
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Intern updated)
    {
        var intern = await _context.Interns.FindAsync(id);
        if (intern == null) return NotFound(new { message = "Intern not found" });

        // IDOR & Privilege Escalation Prevention
        if (UserRole == "mentor")
        {
            var mentorName = UserName;
            if (string.IsNullOrEmpty(mentorName) || intern.MentorName != mentorName)
                return Forbid();

            // Mentors can only modify workflow / evaluation fields
            intern.Status = updated.Status ?? intern.Status;
            intern.ProjectName = updated.ProjectName;
            intern.RejectRemarks = updated.RejectRemarks;
            intern.MentorRemarks = updated.MentorRemarks;
            intern.Attendance = updated.Attendance;
            intern.ReportSubmitted = updated.ReportSubmitted;
            intern.PassStatus = updated.PassStatus;
            
            // Mentors can clear their assignment (set to null) if rejecting, but not change to another mentor
            if (updated.MentorName == null)
            {
                intern.MentorName = null;
            }
        }
        else if (UserRole == "admin")
        {
            // Admins can edit everything
            intern.Name = (updated.Name ?? intern.Name).Trim();
            intern.DateOfBirth = updated.DateOfBirth ?? intern.DateOfBirth;
            intern.PresentAddress = updated.PresentAddress ?? intern.PresentAddress;
            intern.PermanentAddress = updated.PermanentAddress ?? intern.PermanentAddress;
            intern.Mobile = updated.Mobile ?? intern.Mobile;
            intern.Email = (updated.Email ?? intern.Email).Trim().ToLowerInvariant();
            intern.Branch = updated.Branch ?? intern.Branch;
            intern.AadharNo = updated.AadharNo ?? intern.AadharNo;
            intern.Qualification = updated.Qualification ?? intern.Qualification;
            intern.Institute = updated.Institute ?? intern.Institute;
            intern.Grades = updated.Grades ?? intern.Grades;
            intern.Status = updated.Status ?? intern.Status;
            intern.MentorName = updated.MentorName;
            intern.ProjectName = updated.ProjectName;
            intern.RejectRemarks = updated.RejectRemarks;
            intern.MentorRemarks = updated.MentorRemarks;
            intern.Attendance = updated.Attendance;
            intern.ReportSubmitted = updated.ReportSubmitted;
            intern.PassStatus = updated.PassStatus;
            intern.PhotoPath = updated.PhotoPath;
        }
        else
        {
            return Forbid();
        }
        
        await _context.SaveChangesAsync();
        return Ok(intern);
    }
    
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        // Privilege Escalation Prevention: Only admin can delete interns
        if (UserRole != "admin")
            return Forbid();

        var intern = await _context.Interns.FindAsync(id);
        if (intern == null) return NotFound(new { message = "Intern not found" });
        
        // Remove attendance logs
        var logs = _context.AttendanceLogs.Where(l => l.InternId == id);
        _context.AttendanceLogs.RemoveRange(logs);
        
        _context.Interns.Remove(intern);
        await _context.SaveChangesAsync();
        return NoContent();
    }
    
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        IQueryable<Intern> query = _context.Interns;

        // Filter stats by mentor if logged in as mentor
        if (UserRole == "mentor")
        {
            var mentorName = UserName;
            if (string.IsNullOrEmpty(mentorName))
                return Forbid();
            query = query.Where(i => i.MentorName == mentorName);
        }

        var interns = await query.ToListAsync();
        return Ok(new
        {
            total     = interns.Count,
            newCount  = interns.Count(i => i.Status == "New"),
            assigned  = interns.Count(i => i.Status == "Assigned"),
            active    = interns.Count(i => i.Status == "Active" || i.Status == "Ongoing"),
            completed = interns.Count(i => i.Status == "Completed"),
            rejected  = interns.Count(i => i.Status == "Rejected")
        });
    }
    
    [HttpPost("upload")]
    [RequestSizeLimit(5 * 1024 * 1024)] // 5 MB max
    public async Task<IActionResult> Upload(IFormFile file)
    {
        // Privilege Escalation Prevention: Only admin can upload bulk CSV
        if (UserRole != "admin")
            return Forbid();

        if (file == null || file.Length == 0)
            return BadRequest(new { message = "No file uploaded or file is empty" });
        
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension != ".csv")
            return BadRequest(new { message = "Invalid file type. Only CSV files are supported." });
        
        try
        {
            var interns = new List<Intern>();
            using var reader = new StreamReader(file.OpenReadStream());

            await reader.ReadLineAsync();

            string? line;
            while ((line = await reader.ReadLineAsync()) != null)
            {
                if (string.IsNullOrWhiteSpace(line)) continue;
                
                var parts = line.Split(',');
                if (parts.Length < 7) continue;
                
                interns.Add(new Intern
                {
                    Name          = parts[0].Trim().Trim('"'),
                    DateOfBirth   = parts[1].Trim().Trim('"'),
                    Mobile        = parts[2].Trim().Trim('"'),
                    Email         = parts[3].Trim().Trim('"').ToLowerInvariant(),
                    AadharNo      = parts[4].Trim().Trim('"'),
                    Qualification = parts[5].Trim().Trim('"'),
                    Institute     = parts[6].Trim().Trim('"'),
                    Branch        = parts.Length > 7 ? parts[7].Trim().Trim('"') : "Research",
                    Grades        = parts.Length > 8 ? parts[8].Trim().Trim('"') : "Awaited",
                    Status        = "New",
                    CreatedAt     = DateTime.UtcNow
                });
            }

            if (interns.Count == 0)
                return BadRequest(new { message = "No valid records found in the CSV file" });

            _context.Interns.AddRange(interns);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Successfully imported {interns.Count} intern(s) from CSV" });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "Failed to parse file. Check CSV format." });
        }
    }

    [HttpPost("upload-photo")]
    [Authorize(Roles = "admin")]
    [RequestSizeLimit(2 * 1024 * 1024)] // 2 MB max
    public async Task<IActionResult> UploadPhoto(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "No file uploaded or file is empty" });

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(extension))
            return BadRequest(new { message = "Invalid image type. Only JPG, JPEG, and PNG are supported." });

        var allowedMimeTypes = new[] { "image/jpeg", "image/png" };
        if (!allowedMimeTypes.Contains(file.ContentType.ToLowerInvariant()))
            return BadRequest(new { message = "Invalid content type. Only JPG and PNG are supported." });

        try
        {
            var wwwroot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var uploads = Path.Combine(wwwroot, "uploads");
            if (!Directory.Exists(uploads))
            {
                Directory.CreateDirectory(uploads);
            }

            var filename = $"{Guid.NewGuid()}{extension}";
            var filepath = Path.Combine(uploads, filename);

            using (var stream = new FileStream(filepath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Return relative path that frontend can use
            var relativePath = $"/uploads/{filename}";
            return Ok(new { photoPath = relativePath });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "Failed to save the image." });
        }
    }
}
