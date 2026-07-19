import { useState, useEffect, useCallback } from 'react';
import { Search, Eye, UserCheck, Trash2, Mail, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axiosInstance';
import type { Intern, InternStatus } from '../../types';
import AssignMentorModal from '../../components/AssignMentorModal';
import EditInternModal from '../../components/EditInternModal';

const AVATAR_COLORS = ['bg-[#18181b]', 'bg-[#3f3f46]', 'bg-[#52525b]', 'bg-[#71717a]'];

export default function UnassignedList() {
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [activeIntern, setActiveIntern] = useState<Intern | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEditIntern, setSelectedEditIntern] = useState<Intern | null>(null);

  const fetchInterns = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/interns');
      // Show only New or Rejected candidates
      const unassigned = response.data.filter((i: Intern) => i.status === 'New' || i.status === 'Rejected');
      setInterns(unassigned);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInterns();
  }, [fetchInterns]);

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to remove intern "${name}"?`)) return;
    try {
      await api.delete(`/interns/${id}`);
      setInterns((prev) => prev.filter((i) => i.id !== id));
      toast.success(`"${name}" has been removed`);
    } catch {
      toast.error('Failed to delete intern');
    }
  };

  const handleAssignSubmit = async (mentorName: string | null) => {
    if (!activeIntern) return;
    try {
      const updated = {
        ...activeIntern,
        mentorName: mentorName,
        status: (mentorName ? 'Assigned' : 'New') as InternStatus,
      };
      await api.put(`/interns/${activeIntern.id}`, updated);
      toast.success(mentorName ? `Assigned to ${mentorName}` : 'Assignment cleared');
      fetchInterns();
    } catch {
      toast.error('Assignment failed');
    }
  };

  const filtered = interns.filter((i) => {
    const q = search.toLowerCase();
    return !q || i.name.toLowerCase().includes(q) || i.institute.toLowerCase().includes(q) || i.branch.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-md border border-zinc-200/60">
        <div>
          <h1 className="text-[16px] font-semibold text-[#18181b] tracking-tight">Awaiting Assignment</h1>
          <p className="text-[12px] text-[#71717a] mt-0.5">Registered candidates pending mentor allocation</p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a1a1aa]" strokeWidth={1.7} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidates..."
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
                <th className="px-4 py-3 text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider">Candidate Details</th>
                <th className="px-4 py-3 text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider">Branch & College</th>
                <th className="px-4 py-3 text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider">Contact</th>
                <th className="px-4 py-3 text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider">Status / Remarks</th>
                <th className="px-4 py-3 text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-[13px] text-[#a1a1aa]">Loading unassigned pool...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-[13px] text-[#a1a1aa]">No candidates pending assignment.</td>
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
                          <div className="text-[11px] text-[#a1a1aa] mt-0.5 tabular-nums">Ref ID: #{intern.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[13px] text-[#18181b]">{intern.branch}</div>
                      <div className="text-[11px] text-[#a1a1aa] mt-0.5">{intern.institute}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-[13px] text-[#18181b]"><Mail className="w-4 h-4 text-[#a1a1aa]" strokeWidth={1.7} /> {intern.email}</div>
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#71717a] tabular-nums"><Phone className="w-4 h-4 text-[#a1a1aa]" strokeWidth={1.7} /> {intern.mobile}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                        intern.status === 'Rejected' ? 'text-red-700 bg-red-50/50 border-red-100/50' : 'text-blue-700 bg-blue-50/50 border-blue-100/50'
                      }`}>
                        {intern.status}
                      </span>
                      {intern.status === 'Rejected' && intern.rejectRemarks && (
                        <p className="text-[11px] text-red-700 mt-1 max-w-[180px] truncate" title={intern.rejectRemarks}>
                          Reason: {intern.rejectRemarks}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                        <button
                          onClick={() => { setSelectedEditIntern(intern); setEditModalOpen(true); }}
                          className="bg-white border border-zinc-200/60 text-[#18181b] hover:bg-zinc-50 h-8 px-3 text-[13px] font-medium rounded-md transition-colors duration-100 cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Eye className="h-4 w-4 text-[#a1a1aa]" strokeWidth={1.7} />
                          View
                        </button>
                        <button
                          onClick={() => { setActiveIntern(intern); setModalOpen(true); }}
                          className="bg-[#18181b] text-white hover:bg-[#27272a] h-8 px-3 text-[13px] font-medium rounded-md transition-colors duration-100 cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <UserCheck className="h-4 w-4" strokeWidth={1.7} />
                          Assign
                        </button>
                        <button
                          onClick={() => handleDelete(intern.id, intern.name)}
                          className="bg-white border border-zinc-200/60 text-[#a1a1aa] hover:text-red-700 hover:border-red-200 h-8 w-8 rounded-md transition-colors duration-100 cursor-pointer inline-flex items-center justify-center"
                          title="Delete Candidate"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.7} />
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

      <AssignMentorModal
        isOpen={modalOpen}
        intern={activeIntern}
        onClose={() => { setModalOpen(false); setActiveIntern(null); }}
        onAssign={handleAssignSubmit}
      />

      <EditInternModal
        isOpen={editModalOpen}
        intern={selectedEditIntern}
        onClose={() => { setEditModalOpen(false); setSelectedEditIntern(null); }}
        onSave={fetchInterns}
      />
    </div>
  );
}
