using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    
    public DbSet<Intern> Interns => Set<Intern>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Scientist> Scientists => Set<Scientist>();
    public DbSet<AttendanceLog> AttendanceLogs => Set<AttendanceLog>();
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // BCrypt-hashed passwords (work factor 12):
        // Admin@123  -> $2a$12$LgA9Q6YqKGAlakAdLVjm3.O8CQXCY7Dv9o1Bvqiz5xVUMnJoUJLK2
        // Mentor@123 -> $2a$12$8RGDrgBFY6v5cX1w1q8oze7N5WNJQiGQfp0mYp1TgCsOGEPXwfTzy
        const string adminHash  = "$2a$12$LgA9Q6YqKGAlakAdLVjm3.O8CQXCY7Dv9o1Bvqiz5xVUMnJoUJLK2";
        const string mentorHash = "$2a$12$8RGDrgBFY6v5cX1w1q8oze7N5WNJQiGQfp0mYp1TgCsOGEPXwfTzy";

        // Seed default admin and mentor users
        modelBuilder.Entity<User>().HasData(
            new User { Id = 1, Name = "HR Admin",    Email = "admin@sspl.drdo.in",     PasswordHash = adminHash,  Role = "admin" },
            new User { Id = 2, Name = "Dr. Gupta",   Email = "dr.gupta@sspl.drdo.in",  PasswordHash = mentorHash, Role = "mentor" },
            new User { Id = 3, Name = "Dr. Verma",   Email = "dr.verma@sspl.drdo.in",  PasswordHash = mentorHash, Role = "mentor" },
            new User { Id = 4, Name = "Dr. Rao",     Email = "dr.rao@sspl.drdo.in",    PasswordHash = mentorHash, Role = "mentor" },
            new User { Id = 5, Name = "Dr. Sharma",  Email = "dr.sharma@sspl.drdo.in", PasswordHash = mentorHash, Role = "mentor" }
        );

        // Seed default scientists (mentors)
        modelBuilder.Entity<Scientist>().HasData(
            new Scientist { Id = 1, Name = "Dr. Gupta",  Email = "dr.gupta@sspl.drdo.in",  Department = "Solid State Devices" },
            new Scientist { Id = 2, Name = "Dr. Verma",  Email = "dr.verma@sspl.drdo.in",  Department = "Optoelectronics" },
            new Scientist { Id = 3, Name = "Dr. Rao",    Email = "dr.rao@sspl.drdo.in",    Department = "Silicon Devices" },
            new Scientist { Id = 4, Name = "Dr. Sharma", Email = "dr.sharma@sspl.drdo.in", Department = "Quantum Materials" }
        );
        
        // Seed some sample interns
        modelBuilder.Entity<Intern>().HasData(
            new Intern { Id = 1, Name = "Rahul Sharma",  DateOfBirth = "2003-05-15", PresentAddress = "Room 302, Jwalamukhi Hostel, IIT Delhi",  PermanentAddress = "45, MG Road, Jaipur",           Mobile = "9876543210", Email = "rahul@iitdelhi.ac.in",  Branch = "Computer Science", AadharNo = "123456789012", Qualification = "B.Tech", Institute = "IIT Delhi",         Grades = "8.7 CGPA", Status = "Active",    MentorName = "Dr. Gupta", CreatedAt = new DateTime(2026, 6, 1,  0, 0, 0, DateTimeKind.Utc) },
            new Intern { Id = 2, Name = "Priya Singh",   DateOfBirth = "2003-08-22", PresentAddress = "Hostel B, NIT Kurukshetra",                PermanentAddress = "12, Civil Lines, Lucknow",       Mobile = "9876543211", Email = "priya@nitkkr.ac.in",    Branch = "Electronics",      AadharNo = "234567890123", Qualification = "B.Tech", Institute = "NIT Kurukshetra", Grades = "8.5 CGPA", Status = "Completed", MentorName = "Dr. Verma", CreatedAt = new DateTime(2026, 5, 15, 0, 0, 0, DateTimeKind.Utc) },
            new Intern { Id = 3, Name = "Amit Patel",    DateOfBirth = "2004-01-10", PresentAddress = "Room 105, DTU Boys Hostel",                PermanentAddress = "78, Satellite Road, Ahmedabad",  Mobile = "9876543212", Email = "amit@dtu.ac.in",        Branch = "Mechanical",       AadharNo = "345678901234", Qualification = "B.Tech", Institute = "DTU",             Grades = "7.8 CGPA", Status = "Active",    MentorName = null,        CreatedAt = new DateTime(2026, 6, 10, 0, 0, 0, DateTimeKind.Utc) },
            new Intern { Id = 4, Name = "Sneha Reddy",   DateOfBirth = "2003-11-30", PresentAddress = "Krishna Hostel, BITS Pilani",              PermanentAddress = "23, Banjara Hills, Hyderabad",   Mobile = "9876543213", Email = "sneha@bits.ac.in",      Branch = "Physics",          AadharNo = "456789012345", Qualification = "M.Sc",   Institute = "BITS Pilani",    Grades = "9.1 CGPA", Status = "Completed", MentorName = "Dr. Rao",   CreatedAt = new DateTime(2026, 5, 20, 0, 0, 0, DateTimeKind.Utc) },
            new Intern { Id = 5, Name = "Vikram Joshi",  DateOfBirth = "2003-03-25", PresentAddress = "H12, IIT Bombay",                          PermanentAddress = "56, Koregaon Park, Pune",        Mobile = "9876543214", Email = "vikram@iitb.ac.in",     Branch = "Computer Science", AadharNo = "567890123456", Qualification = "B.Tech", Institute = "IIT Bombay",      Grades = "9.3 CGPA", Status = "New",       MentorName = null,        CreatedAt = new DateTime(2026, 7, 1,  0, 0, 0, DateTimeKind.Utc) }
        );
    }
}
