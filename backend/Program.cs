using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using backend.Data;
using backend.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// SQLite Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=drdo_hr.db"));

// JWT Authentication
var jwtKey = "ThisIsASecretKeyForDRDOHRModule2026!!ThisIsASecretKeyForDRDOHRModule2026!!";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = false,
            ValidateAudience         = false,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

// CORS — Allow React frontend from any origin (localhost, Render, etc.)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Rate limiting — protect the auth endpoint from brute force
builder.Services.AddRateLimiter(rateLimiterOptions =>
{
    rateLimiterOptions.AddFixedWindowLimiter("AuthPolicy", options =>
    {
        options.PermitLimit         = 10;
        options.Window              = TimeSpan.FromMinutes(1);
        options.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        options.QueueLimit          = 0;
    });
    rateLimiterOptions.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

// Request body size limit (global — 10 MB)
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 10 * 1024 * 1024; // 10 MB
});

var app = builder.Build();

// Create database and run migrations / seed data
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();

    if (!db.Users.Any())
    {
        const string adminHash  = "$2a$12$LgA9Q6YqKGAlakAdLVjm3.O8CQXCY7Dv9o1Bvqiz5xVUMnJoUJLK2";
        const string mentorHash = "$2a$12$8RGDrgBFY6v5cX1w1q8oze7N5WNJQiGQfp0mYp1TgCsOGEPXwfTzy";

        db.Users.AddRange(
            new User { Id = 1, Name = "HR Admin",   Email = "admin@sspl.drdo.in",    PasswordHash = adminHash,  Role = "admin" },
            new User { Id = 2, Name = "Dr. Gupta",  Email = "dr.gupta@sspl.drdo.in", PasswordHash = mentorHash, Role = "mentor" },
            new User { Id = 3, Name = "Dr. Verma",  Email = "dr.verma@sspl.drdo.in", PasswordHash = mentorHash, Role = "mentor" }
        );
        db.SaveChanges();
    }
}

// Security headers middleware
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"]    = "nosniff";
    context.Response.Headers["X-Frame-Options"]           = "DENY";
    context.Response.Headers["X-XSS-Protection"]          = "1; mode=block";
    context.Response.Headers["Referrer-Policy"]           = "strict-origin-when-cross-origin";
    context.Response.Headers["Permissions-Policy"]        = "camera=(), microphone=(), geolocation=()";
    context.Response.Headers["Content-Security-Policy"]   =
        "default-src 'none'; img-src 'self'; frame-ancestors 'none'";
    await next();
});

app.UseCors("AllowReact");
app.UseStaticFiles();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.MapGet("/", () => Results.Ok(new { status = "healthy", message = "DRDO HR Module API is running" }));
app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));
app.MapGet("/api/health", () => Results.Ok(new { status = "healthy" }));

app.Run();
