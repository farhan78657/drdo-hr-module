using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using backend.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// SQLite Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=drdo_hr.db"));

// JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("JWT Key is not configured. Set Jwt:Key in appsettings or environment.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = builder.Configuration["Jwt:Issuer"] ?? "DrdoHrModule",
            ValidAudience            = builder.Configuration["Jwt:Audience"] ?? "DrdoHrModule",
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

// CORS — Allow React frontend (restrict to known origins only)
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:5173", "http://localhost:3000" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
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

// Apply rate limiting to the auth endpoint specifically
app.MapControllerRoute(
    name: "auth-rate-limited",
    pattern: "api/auth/{action}",
    defaults: new { controller = "Auth" }
).RequireRateLimiting("AuthPolicy");

app.Run();
