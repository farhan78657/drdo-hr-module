namespace backend.Models;

public class AttendanceLog
{
    public int Id { get; set; }
    public int InternId { get; set; }
    public string Date { get; set; } = string.Empty; // yyyy-MM-dd
    public string Status { get; set; } = "Present"; // Present, Absent, Leave
    public string? Remarks { get; set; }
}
