using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AttendanceController : ControllerBase
{
    private readonly AppDbContext _context;

    private string? UserRole => User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
    private string? UserName => User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;

    public AttendanceController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("{internId:int}")]
    public async Task<ActionResult<List<AttendanceLog>>> GetByIntern(int internId)
    {
        // IDOR Prevention: Mentors can only retrieve attendance logs for their assigned interns
        if (UserRole == "mentor")
        {
            var intern = await _context.Interns.FindAsync(internId);
            if (intern == null || intern.MentorName != UserName)
                return Forbid();
        }

        var logs = await _context.AttendanceLogs
            .Where(l => l.InternId == internId)
            .OrderByDescending(l => l.Date)
            .ToListAsync();
        return Ok(logs);
    }

    [HttpGet("date/{date}")]
    public async Task<ActionResult<List<AttendanceLog>>> GetByDate(string date)
    {
        IQueryable<AttendanceLog> logsQuery = _context.AttendanceLogs;

        // IDOR Prevention: Mentors can only view logs for their own interns on a specific date
        if (UserRole == "mentor")
        {
            var mentorName = UserName;
            if (string.IsNullOrEmpty(mentorName))
                return Forbid();
            
            logsQuery = logsQuery.Where(l => _context.Interns.Any(i => i.Id == l.InternId && i.MentorName == mentorName));
        }

        var logs = await logsQuery
            .Where(l => l.Date == date)
            .ToListAsync();
        return Ok(logs);
    }

    [HttpPost]
    public async Task<IActionResult> Record([FromBody] AttendanceLog log)
    {
        if (log.InternId <= 0 || string.IsNullOrEmpty(log.Date))
            return BadRequest(new { message = "Invalid intern ID or date parameter" });

        var intern = await _context.Interns.FindAsync(log.InternId);
        if (intern == null)
            return NotFound(new { message = "Intern not found" });

        // IDOR & Authorization Hardening: Mentors can only record attendance for their own interns
        if (UserRole == "mentor" && intern.MentorName != UserName)
            return Forbid();

        // Check if log already exists for this intern and date
        var existing = await _context.AttendanceLogs
            .FirstOrDefaultAsync(l => l.InternId == log.InternId && l.Date == log.Date);

        if (existing != null)
        {
            existing.Status = log.Status;
            existing.Remarks = log.Remarks;
            _context.AttendanceLogs.Update(existing);
        }
        else
        {
            log.Id = 0;
            _context.AttendanceLogs.Add(log);
        }

        await _context.SaveChangesAsync();
        
        // Recalculate and update the overall attendance percentage in Intern table
        await RecalculateInternAttendance(log.InternId);

        return Ok(new { message = "Attendance record successfully logged" });
    }

    [HttpGet("summary/{internId:int}")]
    public async Task<IActionResult> GetSummary(int internId)
    {
        // IDOR Prevention: Mentors can only view summary for their own interns
        if (UserRole == "mentor")
        {
            var intern = await _context.Interns.FindAsync(internId);
            if (intern == null || intern.MentorName != UserName)
                return Forbid();
        }

        var logs = await _context.AttendanceLogs.Where(l => l.InternId == internId).ToListAsync();
        if (logs.Count == 0)
        {
            return Ok(new { presentCount = 0, totalCount = 0, percentage = "0%" });
        }

        var presentCount = logs.Count(l => l.Status == "Present");
        var totalCount = logs.Count;
        var percentage = (int)Math.Round((double)presentCount * 100 / totalCount);

        return Ok(new
        {
            presentCount,
            totalCount,
            percentage = $"{percentage}%"
        });
    }

    private async Task RecalculateInternAttendance(int internId)
    {
        var intern = await _context.Interns.FindAsync(internId);
        if (intern == null) return;

        var logs = await _context.AttendanceLogs.Where(l => l.InternId == internId).ToListAsync();
        if (logs.Count == 0) return;

        var presentCount = logs.Count(l => l.Status == "Present");
        var totalCount = logs.Count;
        var percentage = (int)Math.Round((double)presentCount * 100 / totalCount);

        intern.Attendance = $"{percentage}%";
        _context.Interns.Update(intern);
        await _context.SaveChangesAsync();
    }
}
