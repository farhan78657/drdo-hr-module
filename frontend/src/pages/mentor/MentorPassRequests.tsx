import { useState, useEffect, useCallback } from 'react';
import { Shield, FileCheck, Check, Clock, User, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axiosInstance';
import type { Intern } from '../../types';

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

export default function MentorPassRequests() {
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [mentorName] = useState(getMentorName);
  const [selectedIntern, setSelectedIntern] = useState<Intern | null>(null);

  const fetchInterns = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/interns');
      setInterns(response.data);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInterns();
  }, [fetchInterns]);

  const myInterns = interns.filter((i) => i.mentorName === mentorName && i.status === 'Ongoing');

  const handleRecommendPass = async (intern: Intern) => {
    try {
      const updated = {
        ...intern,
        passStatus: 'Approved' as const
      };
      await api.put(`/interns/${intern.id}`, updated);
      toast.success(`Temporary Pass recommended for ${intern.name}`);
      fetchInterns();
      setSelectedIntern(null);
    } catch {
      toast.error('Failed to recommend pass');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-4 rounded-md border border-zinc-200/60 flex justify-between items-center">
        <div>
          <h1 className="text-[15px] font-semibold text-zinc-900 tracking-tight">Temporary Pass Recommendations</h1>
          <p className="text-[12px] text-zinc-400 mt-0.5">Generate gate pass recommendations for laboratory entrance passes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Active Interns list */}
        <div className="lg:col-span-1 bg-white p-4 rounded-md border border-zinc-200/60 space-y-3.5">
          <h3 className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Active Interns</h3>
          {loading ? (
            <div className="p-4 text-center text-[13px] text-zinc-400">Loading list…</div>
          ) : myInterns.length === 0 ? (
            <div className="p-4 text-center text-[13px] text-zinc-400">No active ongoing interns.</div>
          ) : (
            <div className="space-y-1.5">
              {myInterns.map((i) => (
                <button
                  key={i.id}
                  onClick={() => setSelectedIntern(i)}
                  className={`w-full flex items-center justify-between rounded-md p-2.5 text-left border text-[13px] transition-colors duration-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10 ${
                    selectedIntern?.id === i.id 
                      ? 'border-zinc-900 bg-zinc-50/50 text-zinc-900 font-semibold'
                      : 'border-zinc-200/60 hover:bg-zinc-50/50 text-zinc-500'
                  }`}
                >
                  <div>
                    <p className="font-semibold text-zinc-900">{i.name}</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{i.institute}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* SSPL Pass Form Preview */}
        <div className="lg:col-span-2">
          {selectedIntern ? (
            <div className="bg-white rounded-md border border-zinc-200/60 p-5 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-zinc-200/60 pb-3">
                <Shield className="w-4 h-4 text-zinc-400" strokeWidth={1.7} />
                <div>
                  <h3 className="text-[13px] font-semibold text-zinc-900 tracking-tight">SSPL Pass Recommendation Form</h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Defence Research &amp; Development Organisation</p>
                </div>
              </div>

              {/* Form Content */}
              <div className="space-y-3.5 text-[13px] text-zinc-500 leading-relaxed">
                <p>
                  I recommend that a temporary laboratory entry pass be issued to the following candidate 
                  to access SSPL labs for scientific training:
                </p>
                <div className="bg-white border border-zinc-200/60 rounded-md p-4 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">Candidate Name</span>
                    <span className="text-zinc-900 font-medium">{selectedIntern.name}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">Aadhar Number</span>
                    <span className="text-zinc-900 font-medium tabular-nums">{selectedIntern.aadharNo}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">College/Institute</span>
                    <span className="text-zinc-900 font-medium">{selectedIntern.institute}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">Department &amp; Project</span>
                    <span className="text-zinc-900 font-medium">{selectedIntern.branch} ({selectedIntern.projectName || 'Ongoing'})</span>
                  </div>
                </div>

                <div className="pt-1.5">
                  <span className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-1">Pass Recommendation Status</span>
                  {selectedIntern.passStatus === 'Approved' ? (
                    <span className="inline-flex items-center gap-1.5 rounded bg-emerald-50/50 border border-emerald-200/50 px-2 py-0.5 text-[11px] font-medium text-emerald-850 uppercase tracking-wider">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Pass Recommended
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded bg-amber-50/50 border border-amber-200/50 px-2 py-0.5 text-[11px] font-medium text-amber-850 uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      Pending Signature
                    </span>
                  )}
                </div>
              </div>

              {/* Action */}
              <div className="pt-3 border-t border-zinc-200/60 flex justify-end">
                {selectedIntern.passStatus !== 'Approved' && (
                  <button
                    onClick={() => handleRecommendPass(selectedIntern)}
                    className="inline-flex items-center bg-zinc-900 text-white hover:bg-zinc-800 h-8 px-4 text-[13px] font-medium rounded-md transition-colors duration-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10"
                  >
                    <FileCheck className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.7} />
                    Sign Recommendation
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-md border border-zinc-200/60 p-16 text-center text-zinc-400">
              <User className="h-8 w-8 text-zinc-300 mx-auto mb-3" strokeWidth={1.7} />
              <p className="font-semibold text-zinc-500 uppercase tracking-wider text-[11px]">No candidate selected</p>
              <p className="text-[12px] text-zinc-400 mt-1">Select an active ongoing intern from the left pane to view pass request.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
