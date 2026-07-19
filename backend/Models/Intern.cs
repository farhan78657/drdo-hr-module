namespace backend.Models;

public class Intern
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string DateOfBirth { get; set; } = string.Empty;
    public string PresentAddress { get; set; } = string.Empty;
    public string PermanentAddress { get; set; } = string.Empty;
    public string Mobile { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Branch { get; set; } = string.Empty;
    public string AadharNo { get; set; } = string.Empty;
    public string Qualification { get; set; } = string.Empty;
    public string Institute { get; set; } = string.Empty;
    public string Grades { get; set; } = string.Empty;
    public string? PhotoPath { get; set; }
    public string Status { get; set; } = "New";
    public string? MentorName { get; set; }
    public string? ProjectName { get; set; }
    public string? RejectRemarks { get; set; }
    public string? MentorRemarks { get; set; }
    public string? Attendance { get; set; }
    public bool ReportSubmitted { get; set; }
    public string? PassStatus { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
