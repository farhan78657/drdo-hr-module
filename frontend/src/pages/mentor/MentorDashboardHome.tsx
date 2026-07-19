import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axiosInstance';
import type { Intern } from '../../types';

type TabKey = 'Pending' | 'Ongoing' | 'History';

function getMentorName(): string {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const parsed = JSON.parse(userStr);
      return parsed.name || 'Dr. Gupta';
    }
  } catch { /* ignore */ }
  return 'Dr. Gupta';
}

export default function MentorDashboardHome() {
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('Pending');
  const [mentorName] = useState(getMentorName);

  // Accept Modal States
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [selectedIntern, setSelectedIntern] = useState<Intern | null>(null);
  const [projectName, setProjectName] = useState('');

  // Reject Modal States
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState('');

  // Evaluation/Completion Modal States
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [attendance, setAttendance] = useState('');
  const [mentorRemarks, setMentorRemarks] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [grades, setGrades] = useState('Outstanding (A+ Grade)');

  const fetchInterns = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/interns');
      setInterns(response.data);
    } catch {
      toast.error('Failed to retrieve interns');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInterns();
  }, [fetchInterns]);

  // Filter interns belonging to this mentor
  const myInterns = interns.filter((i) => i.mentorName === mentorName);

  const pendingInterns = myInterns.filter((i) => i.status === 'Assigned');
  const ongoingInterns = myInterns.filter((i) => i.status === 'Ongoing');
  const historyInterns = myInterns.filter((i) => i.status === 'Completed' || i.status === 'Issued' || i.status === 'Rejected');

  const handleAcceptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIntern || !projectName.trim()) return;

    try {
      const updated = {
        ...selectedIntern,
        projectName,
        status: 'Ongoing' as const,
      };
      await api.put(`/interns/${selectedIntern.id}`, updated);
      toast.success(`Accepted ${selectedIntern.name}. Project assigned`);
      setAcceptModalOpen(false);
      setProjectName('');
      fetchInterns();
    } catch {
      toast.error('Failed to accept intern');
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIntern || !rejectRemarks.trim()) return;

    try {
      const updated = {
        ...selectedIntern,
        rejectRemarks,
        mentorName: null,
        status: 'Rejected' as const,
      };
      await api.put(`/interns/${selectedIntern.id}`, updated);
      toast.success(`Rejected ${selectedIntern.name}. Remarks logged.`);
      setRejectModalOpen(false);
      setRejectRemarks('');
      fetchInterns();
    } catch {
      toast.error('Failed to reject intern');
    }
  };

  const handleEvalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIntern) return;

    try {
      const updated = {
        ...selectedIntern,
        attendance,
        mentorRemarks,
        reportSubmitted,
        grades,
        status: 'Completed' as const,
      };
      await api.put(`/interns/${selectedIntern.id}`, updated);
      toast.success(`Evaluation submitted for ${selectedIntern.name}`);
      setEvalModalOpen(false);
      setAttendance('');
      setMentorRemarks('');
      setReportSubmitted(false);
      setGrades('Outstanding (A+ Grade)');
      fetchInterns();
    } catch {
      toast.error('Failed to complete evaluation');
    }
  };

  const STATUS_COLOR: Record<string, string> = {
    New: 'text-blue-600 bg-blue-50/50 border border-blue-200/50',
    Assigned: 'text-amber-600 bg-amber-50/50 border border-amber-200/50',
    Ongoing: 'text-emerald-600 bg-emerald-50/50 border border-emerald-200/50',
    Completed: 'text-teal-600 bg-teal-50/50 border border-teal-200/50',
    Rejected: 'text-red-600 bg-red-50/50 border border-red-200/50',
    Issued: 'text-indigo-600 bg-indigo-50/50 border border-indigo-200/50',
  };

  const labelClass = "block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5";
  const inputClass = "w-full h-9 rounded-md border border-zinc-200/60 bg-white px-3 text-[13px] text-zinc-900 outline-none transition-colors duration-100 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 focus-visible:border-zinc-400 focus-visible:ring-zinc-900/5 placeholder:text-zinc-400";

  return (
    <div className="space-y-5">
      {/* Welcome Banner */}
      <div>
        <h1 className="text-[15px] font-semibold text-zinc-900 tracking-tight">Mentor Console</h1>
        <p className="text-[12px] text-zinc-400 mt-0.5">Welcome back, {mentorName} · Solid State Physics Laboratory</p>
      </div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="bg-white border border-zinc-200/60 rounded-md p-4">
          <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">My Ongoing Interns</p>
          <p className="text-[22px] font-semibold text-zinc-900 mt-1 tabular-nums">{ongoingInterns.length}</p>
        </div>

        <div className="bg-white border border-zinc-200/60 rounded-md p-4">
          <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Pending Approvals</p>
          <p className="text-[22px] font-semibold text-zinc-900 mt-1 tabular-nums">{pendingInterns.length}</p>
        </div>

        <div className="bg-white border border-zinc-200/60 rounded-md p-4">
          <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Completed Mentorships</p>
          <p className="text-[22px] font-semibold text-zinc-900 mt-1 tabular-nums">
            {myInterns.filter(i => i.status === 'Completed' || i.status === 'Issued').length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200/60">
        {(['Pending', 'Ongoing', 'History'] as TabKey[]).map((tab) => {
          const active = activeTab === tab;
          const count = tab === 'Pending' ? pendingInterns.length : tab === 'Ongoing' ? ongoingInterns.length : historyInterns.length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-[12px] font-medium transition-colors border-b-2 -mb-[1px] cursor-pointer focus-visible:outline-none focus-visible:border-zinc-900 ${
                active ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-400 hover:text-zinc-500'
              }`}
            >
              {tab === 'Pending' ? 'New Assignments' : tab === 'Ongoing' ? 'Ongoing Projects' : 'Mentorship History'}
              <span className={`ml-1.5 inline-flex h-4 px-1.5 rounded-md text-[9px] font-bold items-center justify-center tabular-nums ${active ? 'bg-zinc-900/10 text-zinc-900' : 'bg-zinc-100 text-zinc-400'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-md border border-zinc-200/50 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[13px] text-zinc-400">Loading interns data…</div>
        ) : activeTab === 'Pending' && pendingInterns.length === 0 ? (
          <div className="p-12 text-center text-[13px] text-zinc-400">No new internship requests assigned to you.</div>
        ) : activeTab === 'Ongoing' && ongoingInterns.length === 0 ? (
          <div className="p-12 text-center text-[13px] text-zinc-400">No active ongoing projects.</div>
        ) : activeTab === 'History' && historyInterns.length === 0 ? (
          <div className="p-12 text-center text-[13px] text-zinc-400">No historical mentorship logs.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-200/60">
                  <th className="px-4 py-3 text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Intern</th>
                  <th className="px-4 py-3 text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Institution & Branch</th>
                  <th className="px-4 py-3 text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                    {activeTab === 'Ongoing' ? 'Assigned Project' : activeTab === 'History' ? 'Final Evaluation' : 'Details'}
                  </th>
                  <th className="px-4 py-3 text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/50">
                {(activeTab === 'Pending' ? pendingInterns : activeTab === 'Ongoing' ? ongoingInterns : historyInterns).map((intern) => (
                  <tr key={intern.id} className="hover:bg-zinc-50/50 transition-colors duration-100 group">
                    <td className="px-4 py-3">
                      <div className="text-[13px] font-semibold text-zinc-900">{intern.name}</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">{intern.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[13px] text-zinc-900">{intern.institute}</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">{intern.branch}</div>
                    </td>
                    <td className="px-4 py-3">
                      {activeTab === 'Ongoing' ? (
                        <div className="space-y-0.5 text-left">
                          <span className="text-[13px] font-medium text-zinc-900 block">{intern.projectName || 'Unassigned'}</span>
                          <span className="text-[11px] text-zinc-400 font-medium block">
                            Attendance: <span className="text-zinc-650 font-semibold tabular-nums">{intern.attendance || '0%'}</span>
                          </span>
                        </div>
                      ) : activeTab === 'History' ? (
                        <div className="space-y-0.5 text-left">
                          <p className="text-[12px] text-zinc-500">Grade: <span className="font-semibold text-zinc-900 tabular-nums">{intern.grades || 'N/A'}</span> &bull; Attendance: <span className="font-semibold text-zinc-900 tabular-nums">{intern.attendance || 'N/A'}</span></p>
                          <p className="text-[11px] text-zinc-400">Remarks: {intern.mentorRemarks || intern.rejectRemarks || 'None'}</p>
                        </div>
                      ) : (
                        <span className="text-[12px] text-zinc-400">Awaiting acceptance pass</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {activeTab === 'Pending' && (
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                          <button
                            onClick={() => { setSelectedIntern(intern); setAcceptModalOpen(true); }}
                            className="bg-zinc-900 text-white hover:bg-zinc-800 h-8 px-3 text-[12px] font-medium rounded-md transition-colors duration-100 cursor-pointer inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Accept
                          </button>
                          <button
                            onClick={() => { setSelectedIntern(intern); setRejectModalOpen(true); }}
                            className="bg-white border border-zinc-200/60 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 h-8 px-3 text-[12px] font-medium rounded-md transition-colors duration-100 cursor-pointer inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10"
                          >
                            <X className="h-3.5 w-3.5" />
                            Reject
                          </button>
                        </div>
                      )}
                      {activeTab === 'Ongoing' && (
                        <button
                          onClick={() => { setSelectedIntern(intern); setEvalModalOpen(true); }}
                          className="bg-zinc-900 text-white hover:bg-zinc-800 h-8 px-3 text-[12px] font-medium rounded-md transition-colors duration-100 cursor-pointer inline-flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.7} />
                          Evaluate
                        </button>
                      )}
                      {activeTab === 'History' && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_COLOR[intern.status] ?? 'text-zinc-500 bg-zinc-100 border border-zinc-200/60'}`}>
                          {intern.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Accept Modal */}
      {acceptModalOpen && selectedIntern && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/40 animate-fade-in" onClick={() => setAcceptModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white border border-zinc-200/60 rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.05)] z-10">
            <div className="flex items-center justify-between border-b border-zinc-200/60 px-5 py-4">
              <div>
                <h3 className="text-[14px] font-semibold text-zinc-900 tracking-tight">Accept Assignment</h3>
                <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">Intern: {selectedIntern.name}</p>
              </div>
              <button onClick={() => setAcceptModalOpen(false)} className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-500 transition-colors duration-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10">
                <X className="h-4 w-4" strokeWidth={1.7} />
              </button>
            </div>
            
            <form onSubmit={handleAcceptSubmit} className="px-5 py-4 space-y-4">
              <div>
                <label className={labelClass}>Project Title</label>
                <input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Nanotechnology Silicon Fabrication Study"
                  required
                  className={inputClass}
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200/60">
                <button type="button" onClick={() => setAcceptModalOpen(false)} className="bg-white border border-zinc-200/60 text-zinc-900 hover:bg-zinc-50 h-8 px-3 text-[13px] font-medium rounded-md transition-colors duration-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10">Cancel</button>
                <button type="submit" className="bg-zinc-900 text-white hover:bg-zinc-800 h-8 px-3 text-[13px] font-medium rounded-md transition-colors duration-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10">Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && selectedIntern && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/40 animate-fade-in" onClick={() => setRejectModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white border border-zinc-200/60 rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.05)] z-10">
            <div className="flex items-center justify-between border-b border-zinc-200/60 px-5 py-4">
              <div>
                <h3 className="text-[14px] font-semibold text-zinc-900 tracking-tight">Reject Assignment</h3>
                <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">Intern: {selectedIntern.name}</p>
              </div>
              <button onClick={() => setRejectModalOpen(false)} className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-500 transition-colors duration-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10">
                <X className="h-4 w-4" strokeWidth={1.7} />
              </button>
            </div>
            
            <form onSubmit={handleRejectSubmit} className="px-5 py-4 space-y-4">
              <div>
                <label className={labelClass}>Reason / Remarks</label>
                <textarea
                  value={rejectRemarks}
                  onChange={(e) => setRejectRemarks(e.target.value)}
                  placeholder="e.g. Insufficient laboratory slot vacancy..."
                  required
                  rows={3}
                  className="w-full p-2.5 rounded-md border border-zinc-200/60 bg-white text-[13px] text-zinc-900 outline-none transition-colors duration-100 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 focus-visible:border-zinc-400 focus-visible:ring-zinc-900/5 resize-none placeholder:text-zinc-400"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200/60">
                <button type="button" onClick={() => setRejectModalOpen(false)} className="bg-white border border-zinc-200/60 text-zinc-900 hover:bg-zinc-50 h-8 px-3 text-[13px] font-medium rounded-md transition-colors duration-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10">Cancel</button>
                <button type="submit" className="bg-zinc-900 text-white hover:bg-zinc-800 h-8 px-3 text-[13px] font-medium rounded-md transition-colors duration-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10">Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Evaluation / Completion Modal */}
      {evalModalOpen && selectedIntern && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/40 animate-fade-in" onClick={() => setEvalModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white border border-zinc-200/60 rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.05)] z-10">
            <div className="flex items-center justify-between border-b border-zinc-200/60 px-5 py-4">
              <div>
                <h3 className="text-[14px] font-semibold text-zinc-900 tracking-tight">Internship Evaluation</h3>
                <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">Intern: {selectedIntern.name}</p>
              </div>
              <button onClick={() => setEvalModalOpen(false)} className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-500 transition-colors duration-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10">
                <X className="h-4 w-4" strokeWidth={1.7} />
              </button>
            </div>
            
            <form onSubmit={handleEvalSubmit} className="px-5 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className={labelClass}>Attendance (%)</label>
                  <input
                    value={attendance}
                    onChange={(e) => setAttendance(e.target.value)}
                    placeholder="e.g. 98%"
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Performance Grade</label>
                  <select
                    value={grades}
                    onChange={(e) => setGrades(e.target.value)}
                    className="w-full h-9 rounded-md border border-zinc-200/60 bg-white px-2 text-[13px] text-zinc-900 outline-none transition-colors duration-100 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 focus-visible:border-zinc-400 focus-visible:ring-zinc-900/5 cursor-pointer font-medium"
                  >
                    <option value="Outstanding (A+ Grade)">Outstanding (A+ Grade)</option>
                    <option value="Excellent (A Grade)">Excellent (A Grade)</option>
                    <option value="Very Good (B Grade)">Very Good (B Grade)</option>
                    <option value="Satisfactory (C Grade)">Satisfactory (C Grade)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="report"
                  checked={reportSubmitted}
                  onChange={(e) => setReportSubmitted(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-200/60 text-zinc-900 focus:ring-zinc-900/10 accent-zinc-900 cursor-pointer"
                />
                <label htmlFor="report" className="text-[13px] text-zinc-900 font-medium cursor-pointer">
                  Technical Project Report Submitted
                </label>
              </div>

              <div>
                <label className={labelClass}>Evaluation Remarks</label>
                <textarea
                  value={mentorRemarks}
                  onChange={(e) => setMentorRemarks(e.target.value)}
                  placeholder="Summarize the intern's contribution and conduct..."
                  required
                  rows={3}
                  className="w-full p-2.5 rounded-md border border-zinc-200/60 bg-white text-[13px] text-zinc-900 outline-none transition-colors duration-100 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 focus-visible:border-zinc-400 focus-visible:ring-zinc-900/5 resize-none placeholder:text-zinc-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200/60">
                <button type="button" onClick={() => setEvalModalOpen(false)} className="bg-white border border-zinc-200/60 text-zinc-900 hover:bg-zinc-50 h-8 px-3 text-[13px] font-medium rounded-md transition-colors duration-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10">Cancel</button>
                <button type="submit" className="bg-zinc-900 text-white hover:bg-zinc-800 h-8 px-3 text-[13px] font-medium rounded-md transition-colors duration-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
