import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Briefcase,
  CheckCircle,
  XCircle,
  Award,
  ArrowRight,
  UserCheck,
  TrendingUp,
} from 'lucide-react';
import api from '../../api/axiosInstance';
import type { Intern } from '../../types';

interface StatsData {
  total: number;
  newCount: number;
  assigned: number;
  active: number;
  completed: number;
  rejected: number;
}

const quickActions = [
  {
    label: 'Register intern',
    description: 'Add a new candidate to the system',
    icon: UserPlus,
    link: '/hr/add-intern',
  },
  {
    label: 'Assign mentor',
    description: 'Pair unassigned interns with scientists',
    icon: UserCheck,
    link: '/hr/unassigned',
  },
  {
    label: 'Issue certificate',
    description: 'Generate completion certificates',
    icon: Award,
    link: '/hr/certificates',
  },
];

export default function DashboardHome() {
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [recentInterns, setRecentInterns] = useState<Intern[]>([]);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, internsRes] = await Promise.all([
          api.get('/interns/stats'),
          api.get('/interns'),
        ]);
        setStatsData(statsRes.data);
        const sorted = [...internsRes.data].sort(
          (a: Intern, b: Intern) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setRecentInterns(sorted.slice(0, 5));
      } catch {
        // silently ignore
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = statsData
    ? [
        { name: 'Total', value: statsData.total, icon: Users },
        { name: 'New', value: statsData.newCount, icon: UserPlus },
        { name: 'Assigned', value: statsData.assigned, icon: Briefcase },
        { name: 'Ongoing', value: statsData.active, icon: TrendingUp },
        { name: 'Completed', value: statsData.completed, icon: CheckCircle },
        { name: 'Rejected', value: statsData.rejected, icon: XCircle },
      ]
    : [];

  const STATUS_COLOR: Record<string, string> = {
    New: 'text-blue-700 bg-blue-50/50 border border-blue-100/50',
    Assigned: 'text-amber-700 bg-amber-50/50 border border-amber-100/50',
    Ongoing: 'text-emerald-700 bg-emerald-50/50 border border-emerald-100/50',
    Completed: 'text-teal-700 bg-teal-50/50 border border-teal-100/50',
    Rejected: 'text-red-700 bg-red-50/50 border border-red-100/50',
    Issued: 'text-indigo-700 bg-indigo-50/50 border border-indigo-100/50',
  };

  const STATUS_DOT: Record<string, string> = {
    New: 'bg-blue-500',
    Assigned: 'bg-amber-500',
    Ongoing: 'bg-emerald-500',
    Completed: 'bg-teal-500',
    Rejected: 'bg-red-500',
    Issued: 'bg-indigo-500',
  };

  function timeAgo(dateStr: string) {
    const diff = now - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[16px] font-semibold text-[#18181b] tracking-tight">
            Overview
          </h1>
          <p className="text-[12px] text-[#71717a] mt-0.5 tabular-nums">
            {today}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-zinc-200/60 rounded-md p-4">
                <div className="h-3 w-16 rounded bg-zinc-100 animate-pulse mb-2" />
                <div className="h-6 w-10 rounded bg-zinc-100 animate-pulse" />
              </div>
            ))
          : stats.map((stat) => (
              <div
                key={stat.name}
                className="bg-white border border-zinc-200/60 rounded-md p-4"
              >
                <p className="text-[11px] font-medium text-[#71717a] uppercase tracking-wider">
                  {stat.name}
                </p>
                <p className="text-[22px] font-semibold text-[#18181b] mt-1 tabular-nums">
                  {stat.value}
                </p>
              </div>
            ))}
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent activity */}
        <div className="xl:col-span-2 bg-white border border-zinc-200/60 rounded-md overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200/60">
            <h3 className="text-[11px] font-medium text-[#71717a] uppercase tracking-wider">
              Recent registrations
            </h3>
            <Link
              to="/hr/ongoing"
              className="text-[11px] font-medium text-[#18181b] hover:text-[#71717a] flex items-center gap-1 transition-colors duration-100"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-zinc-200/50">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-4 py-3 flex items-center gap-3 animate-pulse">
                  <div className="h-1.5 w-1.5 rounded-full bg-zinc-200" />
                  <div className="h-3 w-48 rounded bg-zinc-100" />
                  <div className="h-3 w-12 ml-auto rounded bg-zinc-100" />
                </div>
              ))
            ) : recentInterns.length === 0 ? (
              <div className="px-4 py-8 text-center text-[12px] text-[#a1a1aa]">
                No recent registrations.
              </div>
            ) : (
              recentInterns.map((intern) => (
                <div
                  key={intern.id}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-zinc-50 transition-colors duration-100"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[intern.status] ?? 'bg-[#a1a1aa]'}`} />
                    <span className="text-[13px] font-medium text-[#18181b]">{intern.name}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${STATUS_COLOR[intern.status] ?? 'text-[#71717a] bg-zinc-100 border border-zinc-200/60'}`}>
                      {intern.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#a1a1aa] tabular-nums">
                    {timeAgo(intern.createdAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="text-[11px] font-medium text-[#71717a] uppercase tracking-wider">
            Quick actions
          </h3>
          {quickActions.map((action) => (
            <Link
              key={action.label}
              to={action.link}
              className="group flex items-center justify-between gap-3 bg-white border border-zinc-200/60 rounded-md p-3.5 hover:border-zinc-300 transition-colors duration-100"
            >
              <div className="flex items-center gap-3">
                <action.icon className="w-4 h-4 text-[#a1a1aa] flex-shrink-0" strokeWidth={1.7} />
                <div>
                  <p className="text-[13px] font-medium text-[#18181b]">{action.label}</p>
                  <p className="text-[11px] text-[#a1a1aa] mt-0.5">{action.description}</p>
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-zinc-300 group-hover:text-[#a1a1aa] transition-colors duration-100" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
