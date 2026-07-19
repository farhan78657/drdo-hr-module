import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, GraduationCap, Calendar, CheckCircle2, FileCheck, ArrowRight } from 'lucide-react';
import api from '../../api/axiosInstance';
import type { Intern } from '../../types';

export default function CompletedList() {
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const fetchCompletedInterns = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/interns');
      const completed = response.data.filter((i: Intern) => i.status === 'Completed');
      setInterns(completed);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompletedInterns();
  }, [fetchCompletedInterns]);

  const filtered = interns.filter((i) => {
    const q = search.toLowerCase();
    return (
      !q ||
      i.name.toLowerCase().includes(q) ||
      i.institute.toLowerCase().includes(q) ||
      i.branch.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-md border border-zinc-200/60">
        <div>
          <h1 className="text-[16px] font-semibold text-[#18181b] tracking-tight">Completed Internships</h1>
          <p className="text-[12px] text-[#71717a] mt-0.5">Verify credentials and approve completion certificates</p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a1a1aa]" strokeWidth={1.7} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            placeholder="Search completed interns..."
            className="h-9 w-56 rounded-md border border-zinc-200/80 bg-white pl-9 pr-3 text-[13px] text-[#18181b] outline-none transition-colors duration-100 focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-md border border-zinc-200/60 h-40 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-md border border-zinc-200/60 p-16 text-center">
          <GraduationCap className="h-4 w-4 text-[#a1a1aa] mx-auto mb-3" strokeWidth={1.7} />
          <p className="text-[13px] font-medium text-[#18181b]">No completed interns found</p>
          <p className="text-[12px] text-[#a1a1aa] mt-1">Once interns complete their training, they will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((intern) => (
            <div
              key={intern.id}
              className="bg-white rounded-md border border-zinc-200/60 p-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md overflow-hidden bg-zinc-100 border border-zinc-200/50 flex-shrink-0">
                      {intern.photoPath ? (
                        <img 
                          src={intern.photoPath.startsWith('http') ? intern.photoPath : `http://localhost:5000${intern.photoPath}`} 
                          alt={intern.name} 
                          className="h-full w-full object-cover" 
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[#18181b] text-white text-[11px] font-medium">
                          {intern.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold text-[#18181b] tracking-tight">
                        {intern.name}
                      </h3>
                      <p className="text-[11px] text-[#a1a1aa] mt-0.5">{intern.branch} &bull; {intern.institute}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded text-teal-700 bg-teal-50/50 border border-teal-100/50">
                    <CheckCircle2 className="h-4 w-4" strokeWidth={1.7} />
                    Completed
                  </span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-3 bg-zinc-50 border border-zinc-200/60 p-3 rounded-md">
                  <div className="space-y-1">
                    <span className="text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider block">Mentor</span>
                    <span className="text-[13px] text-[#18181b]">{intern.mentorName || 'Unassigned'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider block">Grades</span>
                    <span className="text-[13px] text-[#18181b] tabular-nums">{intern.grades || 'Awaited'}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-zinc-200/60 flex items-center justify-between">
                <div className="flex items-center text-[11px] text-[#a1a1aa] tabular-nums">
                  <Calendar className="h-4 w-4 mr-1.5 text-[#a1a1aa]" strokeWidth={1.7} />
                  Registered {new Date(intern.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </div>
                <button
                  onClick={() => navigate('/hr/certificates', { state: { internId: intern.id } })}
                  className="bg-[#18181b] text-white hover:bg-[#27272a] h-8 px-3 text-[13px] font-medium rounded-md transition-colors duration-100 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <FileCheck className="h-4 w-4" strokeWidth={1.7} />
                  Generate Certificate
                  <ArrowRight className="h-4 w-4" strokeWidth={1.7} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
