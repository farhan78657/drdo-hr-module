import { useState, useEffect, useCallback } from 'react';
import { Search, Eye, ShieldCheck } from 'lucide-react';
import api from '../../api/axiosInstance';
import type { Intern } from '../../types';
import EditInternModal from '../../components/EditInternModal';

const AVATAR_COLORS = ['bg-[#18181b]', 'bg-[#3f3f46]', 'bg-[#52525b]', 'bg-[#71717a]'];

export default function OngoingList() {
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEditIntern, setSelectedEditIntern] = useState<Intern | null>(null);

  const fetchInterns = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/interns');
      // Show Assigned or Ongoing active trainees
      const ongoing = response.data.filter((i: Intern) => i.status === 'Assigned' || i.status === 'Ongoing');
      setInterns(ongoing);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInterns();
  }, [fetchInterns]);

  const filtered = interns.filter((i) => {
    const q = search.toLowerCase();
    return !q || i.name.toLowerCase().includes(q) || i.institute.toLowerCase().includes(q) || i.branch.toLowerCase().includes(q) || i.mentorName?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-md border border-zinc-200/60">
        <div>
          <h1 className="text-[16px] font-semibold text-[#18181b] tracking-tight">Active Trainees</h1>
          <p className="text-[12px] text-[#71717a] mt-0.5">Interns currently undergoing laboratory project training</p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a1a1aa]" strokeWidth={1.7} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search active trainees..."
            className="h-9 w-56 rounded-md border border-zinc-200/80 bg-white pl-9 pr-3 text-[13px] text-[#18181b] outline-none transition-colors duration-100 focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-md bg-white border border-zinc-200/60">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-200/60">
                <th className="px-4 py-3 text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider">Trainee Details</th>
                <th className="px-4 py-3 text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider">Assigned Project & Mentor</th>
                <th className="px-4 py-3 text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider">Attendance & Pass</th>
                <th className="px-4 py-3 text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-[13px] text-[#a1a1aa]">Loading ongoing registry...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-[13px] text-[#a1a1aa]">No active trainees found.</td>
                </tr>
              ) : (
                filtered.map((intern) => (
                  <tr key={intern.id} className="hover:bg-zinc-50 transition-colors duration-100 group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md overflow-hidden bg-zinc-100 border border-zinc-200/50 flex-shrink-0">
                          {intern.photoPath ? (
                            <img 
                              src={intern.photoPath.startsWith('http') ? intern.photoPath : `http://localhost:5000${intern.photoPath}`} 
                              alt={intern.name} 
                              className="h-full w-full object-cover" 
                            />
                          ) : (
                            <div className={`flex h-full w-full items-center justify-center ${AVATAR_COLORS[intern.id % AVATAR_COLORS.length]} text-white text-[11px] font-medium`}>
                              {intern.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-[13px] font-semibold text-[#18181b]">{intern.name}</div>
                          <div className="text-[11px] text-[#a1a1aa] mt-0.5">{intern.institute} &bull; {intern.branch}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[13px] text-[#18181b]">{intern.projectName || 'Project Awaiting Mentor Allocation'}</div>
                      <div className="text-[11px] text-[#71717a] mt-0.5 flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-[#a1a1aa]" />
                        Mentor: {intern.mentorName || 'Unassigned'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[13px] text-[#71717a]">Attendance: <span className="text-[#18181b] font-medium tabular-nums">{intern.attendance || 'Awaited'}</span></div>
                      <div className="text-[11px] text-[#71717a] mt-0.5 flex items-center gap-1.5">
                        Pass Status:
                        {intern.passStatus === 'Approved' ? (
                          <span className="text-emerald-700 font-medium flex items-center gap-0.5"><ShieldCheck className="w-4 h-4" strokeWidth={1.7} /> Recommended</span>
                        ) : (
                          <span className="text-[#a1a1aa]">{intern.passStatus || 'None'}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                        intern.status === 'Ongoing' ? 'text-emerald-700 bg-emerald-50/50 border-emerald-100/50' : 'text-amber-700 bg-amber-50/50 border-amber-100/50'
                      }`}>
                        {intern.status === 'Ongoing' ? 'Ongoing' : 'Assigned'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                        <button
                          onClick={() => { setSelectedEditIntern(intern); setEditModalOpen(true); }}
                          className="bg-white border border-zinc-200/60 text-[#18181b] hover:bg-zinc-50 h-8 px-3 text-[13px] font-medium rounded-md transition-colors duration-100 cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Eye className="h-4 w-4 text-[#a1a1aa]" strokeWidth={1.7} />
                          View Profile & Record
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EditInternModal
        isOpen={editModalOpen}
        intern={selectedEditIntern}
        onClose={() => { setEditModalOpen(false); setSelectedEditIntern(null); }}
        onSave={fetchInterns}
      />
    </div>
  );
}
