import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import api from '../api/axiosInstance';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify({
        name: response.data.name,
        email: response.data.email,
        role: response.data.role,
      }));

      toast.success('Signed in successfully');

      if (response.data.role === 'admin') {
        navigate('/hr/dashboard');
      } else {
        navigate('/mentor/dashboard');
      }
    } catch (error: any) {
      const serverMsg = error.response?.data?.message;
      if (serverMsg) {
        toast.error(serverMsg);
      } else if (error.message === 'Network Error') {
        toast.error('Network Error: Server is waking up or VITE_API_URL is incorrect. Please try again in 30 seconds.');
      } else {
        toast.error(error.message || 'Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-between p-6 md:p-12 selection:bg-zinc-100 select-none animate-fade-in">
      {/* Top spacer */}
      <div />

      {/* Main card container */}
      <div className="w-full max-w-[360px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <img
            src="/drdo_logo.png"
            alt="DRDO Seal"
            className="w-12 h-12 object-contain select-none opacity-90"
          />
          <div>
            <h1 className="text-[14px] font-semibold text-[#18181b] tracking-tight uppercase">
              DRDO SSPL
            </h1>
            <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-[0.12em] mt-0.5">
              HR Training & Internship Portal
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white border border-zinc-200/60 rounded-lg p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_12px_24px_-8px_rgba(0,0,0,0.04)] space-y-5">
          <div className="space-y-1">
            <h2 className="text-[14px] font-semibold text-[#18181b] tracking-tight">Sign in</h2>
            <p className="text-[12px] text-zinc-400">Access your administrative or mentor workspace.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-zinc-300" strokeWidth={1.5} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-9 rounded-md border border-zinc-200 bg-white pl-9 pr-3 text-[13px] text-[#18181b] outline-none transition-all duration-100 placeholder:text-zinc-300 focus-visible:border-[#18181b] focus-visible:ring-1 focus-visible:ring-[#18181b]"
                  placeholder="name@sspl.drdo.in"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-zinc-300" strokeWidth={1.5} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-9 rounded-md border border-zinc-200 bg-white pl-9 pr-3 text-[13px] text-[#18181b] outline-none transition-all duration-100 placeholder:text-zinc-300 focus-visible:border-[#18181b] focus-visible:ring-1 focus-visible:ring-[#18181b]"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-9 flex items-center justify-center gap-1.5 bg-[#18181b] text-white text-[13px] font-medium rounded-md transition-colors duration-100 hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Signing in…</span>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                </>
              )}
            </button>
          </form>

          {/* Contact footer */}
          <div className="pt-4 border-t border-zinc-100">
            <p className="text-[11px] text-zinc-400 text-center">
              Contact HR Division for access credentials.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-[11px] text-zinc-400 font-medium tracking-wide">
        Solid State Physics Laboratory (SSPL) &bull; Delhi
      </p>
    </div>
  );
}
