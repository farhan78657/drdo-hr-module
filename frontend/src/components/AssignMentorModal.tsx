import { useState, useEffect, useCallback } from 'react';
import { X, AlertCircle } from 'lucide-react';
import api from '../api/axiosInstance';
import type { Scientist, Intern } from '../types';

interface AssignMentorModalProps {
  isOpen: boolean;
  intern: Intern | null;
  onClose: () => void;
  onAssign: (mentorName: string | null) => Promise<void>;
}

export default function AssignMentorModal({ isOpen, intern, onClose, onAssign }: AssignMentorModalProps) {
  const [scientists, setScientists] = useState<Scientist[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const fetchScientists = useCallback(async () => {
    setFetching(true);
    try {
      const response = await api.get('/scientists');
      setScientists(response.data);
    } catch {
      // silently ignore — UI shows empty state
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchScientists();
      setSelectedMentor(intern?.mentorName ?? '');
    }
  }, [isOpen, intern, fetchScientists]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onAssign(selectedMentor || null);
      onClose();
    } catch {
      // error is handled in parent onAssign
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !intern) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-zinc-900/40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-white border border-zinc-200/60 rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.05)] z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200/60">
          <div>
            <h3 className="text-[14px] font-semibold text-zinc-900 tracking-tight">Assign Mentor</h3>
            <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">Assigning for {intern.name}</p>
          </div>
          <button 
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-500 transition-colors duration-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10"
          >
            <X className="h-4 w-4" strokeWidth={1.7} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
              Select Scientist / Advisor
            </label>
            {fetching ? (
              <div className="h-9 w-full rounded-md bg-zinc-50 border border-zinc-200/60 flex items-center justify-center animate-pulse">
                <span className="text-[11px] text-zinc-400 font-medium">Loading scientists...</span>
              </div>
            ) : scientists.length === 0 ? (
              <div className="rounded-md bg-zinc-50 border border-zinc-200/60 p-3 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" strokeWidth={1.7} />
                <div className="text-[12px] text-zinc-500 space-y-0.5">
                  <p className="font-semibold text-zinc-900">No scientists registered</p>
                  <p className="text-zinc-500">
                    Please populate the scientists roster first by uploading a CSV spreadsheet.
                  </p>
                </div>
              </div>
            ) : (
              <select
                value={selectedMentor}
                onChange={(e) => setSelectedMentor(e.target.value)}
                className="w-full h-9 rounded-md border border-zinc-200/60 bg-white px-3 text-[13px] text-zinc-900 outline-none transition-colors duration-100 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 focus-visible:border-zinc-400 focus-visible:ring-zinc-900/5 cursor-pointer font-medium"
              >
                <option value="">-- No Mentor Assigned --</option>
                {scientists.map((scientist) => (
                  <option key={scientist.id} value={scientist.name}>
                    {scientist.name} ({scientist.department})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-200/60">
            <button
              type="button"
              onClick={onClose}
              className="bg-white border border-zinc-200/60 text-zinc-900 hover:bg-zinc-50 h-8 px-3 text-[13px] font-medium rounded-md transition-colors duration-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || scientists.length === 0}
              className="bg-zinc-900 text-white hover:bg-zinc-800 h-8 px-3 text-[13px] font-medium rounded-md transition-colors duration-100 disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10"
            >
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
