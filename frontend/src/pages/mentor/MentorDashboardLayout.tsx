import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Users,
  LogOut,
  Bell,
  ChevronRight,
  ChevronDown,
  FileCheck,
  Menu,
  X,
  Calendar,
} from 'lucide-react';

function getLocalUser(): { name: string; email: string } {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const parsed = JSON.parse(userStr);
      return { name: parsed.name || 'Mentor', email: parsed.email || '' };
    }
  } catch { /* ignore */ }
  return { name: 'Mentor', email: '' };
}

const navItems = [
  { name: 'My Interns', path: '/mentor/dashboard', icon: Users },
  { name: 'Attendance', path: '/mentor/attendance', icon: Calendar },
  { name: 'Pass Requests', path: '/mentor/passes', icon: FileCheck },
];

export default function MentorDashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mentorName] = useState(() => getLocalUser().name);
  const [mentorEmail] = useState(() => getLocalUser().email);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const currentPage = navItems.find((item) => item.path === location.pathname)?.name || 'Mentor Workspace';

  return (
    <div className="min-h-screen bg-[#fafafa] flex selection:bg-zinc-100 text-zinc-900 font-sans">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-950/30 backdrop-blur-[1px] md:hidden transition-opacity duration-150"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`flex flex-col fixed inset-y-0 left-0 z-50 bg-[#121214] border-r border-white/[0.02] transition-transform duration-200 md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: 230 }}
      >
        {/* Logo area */}
        <div className="flex items-center justify-between px-5 h-[52px] border-b border-white/[0.04]">
          <div className="flex items-center gap-2.5">
            <img 
              src="/drdo_logo.png" 
              alt="DRDO Seal" 
              className="w-6 h-6 object-contain opacity-90 select-none"
            />
            <div>
              <span className="text-[12px] font-semibold text-zinc-100 tracking-tight block">
                DRDO SSPL
              </span>
              <span className="text-[9px] text-zinc-500 tracking-widest uppercase font-semibold block mt-0.5">
                MENTOR WORKSPACE
              </span>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1 rounded hover:bg-white/[0.04] text-zinc-500 hover:text-zinc-300 transition-colors duration-100 cursor-pointer"
            title="Close Menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  group flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[13px] transition-colors duration-100
                  ${
                    isActive
                      ? 'text-zinc-100 bg-white/[0.06] font-medium'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]'
                  }
                `}
              >
                <item.icon
                  className={`w-[15px] h-[15px] flex-shrink-0 transition-colors duration-100 ${
                    isActive ? 'text-zinc-100' : 'text-zinc-500 group-hover:text-zinc-400'
                  }`}
                  strokeWidth={1.5}
                />
                <span>{item.name}</span>
                {!isActive && (
                  <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-30 transition-opacity duration-100 text-zinc-500" strokeWidth={1.5} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User profile section */}
        <div className="border-t border-white/[0.04] p-3 space-y-2">
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-md">
            <div className="w-6.5 h-6.5 rounded bg-white/[0.06] flex items-center justify-center flex-shrink-0 text-zinc-300 border border-white/[0.04]">
              <span className="text-[10px] font-semibold tracking-wide">
                {mentorName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-zinc-200 truncate">{mentorName}</p>
              <p className="text-[10px] text-zinc-500 truncate font-mono">{mentorEmail}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[12px] text-zinc-500 hover:text-red-400 hover:bg-red-500/[0.04] transition-all duration-100 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-[230px]">
        {/* Top header bar */}
        <header className="sticky top-0 z-20 h-[52px] bg-white border-b border-zinc-200/50 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 rounded-md text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 transition-colors duration-100 cursor-pointer"
              title="Open Menu"
            >
              <Menu className="w-4.5 h-4.5" strokeWidth={1.5} />
            </button>
            
            {/* Sleek Breadcrumb */}
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 uppercase tracking-wider select-none">
              <span>Workspace</span>
              <ChevronRight className="w-3 h-3 text-zinc-300" strokeWidth={2} />
              <span className="text-zinc-800 font-semibold">{currentPage}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 relative">
            {/* Notification bell (Styled as a clean border button) */}
            <button 
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setProfileOpen(false);
              }}
              className="relative p-1.5 rounded-md border border-zinc-200/60 bg-white hover:bg-zinc-50 shadow-2xs text-zinc-500 hover:text-zinc-700 transition-all duration-100 cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" strokeWidth={1.5} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-zinc-800 border border-white" />
              )}
            </button>

            {/* Notification Dropdown */}
            {notificationsOpen && (
              <div className="absolute right-0 top-10 w-72 bg-white border border-zinc-200/80 rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-3.5 z-50 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Notifications</span>
                  <button
                    onClick={() => setUnreadCount(0)}
                    className="text-[10px] font-medium text-zinc-600 hover:text-zinc-900 cursor-pointer"
                  >
                    Clear all
                  </button>
                </div>
                <div className="space-y-1">
                  {[
                    { text: 'Awaiting project details submission', time: '1h ago', path: '/mentor/dashboard' },
                    { text: 'Verify attendance sheet logs', time: '1d ago', path: '/mentor/dashboard' },
                  ].map((n, i) => (
                    <Link
                      key={i}
                      to={n.path}
                      onClick={() => setNotificationsOpen(false)}
                      className="block py-1.5 px-2 rounded-md hover:bg-zinc-50 transition-colors duration-100 space-y-0.5 text-left"
                    >
                      <p className="text-[12px] text-zinc-800 leading-snug">{n.text}</p>
                      <span className="text-[9px] text-zinc-450 font-mono tracking-tight block">{n.time}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="h-4 w-px bg-zinc-200" />

            {/* Profile trigger (Styled as a clean border dropdown button) */}
            <button
              onClick={() => {
                setProfileOpen(!profileOpen);
                setNotificationsOpen(false);
              }}
              className="flex items-center gap-2 px-2 py-1 rounded-md border border-zinc-200/60 bg-white hover:bg-zinc-50 shadow-2xs transition-all duration-100 cursor-pointer text-zinc-700 hover:border-zinc-300"
            >
              <div className="w-5 h-5 rounded-sm bg-zinc-950 text-white flex items-center justify-center text-[9px] font-semibold">
                {mentorName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <span className="text-[12px] font-medium hidden lg:block text-zinc-800">
                {mentorName}
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-400" strokeWidth={1.5} />
            </button>

            {/* Profile Dropdown */}
            {profileOpen && (
              <div className="absolute right-0 top-10 w-48 bg-white border border-zinc-200/80 rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-2.5 z-50">
                <div className="pb-2 mb-2 border-b border-zinc-100 px-1">
                  <p className="text-[12px] font-medium text-zinc-850">{mentorName}</p>
                  <p className="text-[10px] text-zinc-450 font-mono">{mentorEmail}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-[11px] font-medium text-red-650 hover:bg-red-50 rounded transition-colors duration-100 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-5 lg:p-6 animate-fade-in">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
