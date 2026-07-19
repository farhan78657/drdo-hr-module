import { useState, useEffect, useCallback } from 'react';
import { Check, Calendar, Search, Users, ClipboardCheck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axiosInstance';
import type { Intern } from '../../types';

interface AttendanceLog {
  id: number;
  internId: number;
  date: string;
  status: string;
  remarks?: string;
}

const toLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function AttendancePage() {
  const [interns, setInterns] = useState<Intern[]>([]);
  const [selectedIntern, setSelectedIntern] = useState<Intern | null>(null);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<string>('admin');
  const [mentorName, setMentorName] = useState<string>('');

  // Active view toggle: 'sheet' = Daily Roll Call, 'history' = Trainee History Logs
  const [activeView, setActiveView] = useState<'sheet' | 'history'>('sheet');

  // Daily sheet states
  const [rollCallDate, setRollCallDate] = useState(toLocalDateString());
  const [rollCallLogs, setRollCallLogs] = useState<Record<number, { status: string; remarks?: string }>>({});
  const [savingStatus, setSavingStatus] = useState<Record<number, 'saving' | 'saved' | 'idle'>>({});

  // Individual log form states (for history panel)
  const [date, setDate] = useState(toLocalDateString());
  const [status, setStatus] = useState('Present');
  const [remarks, setRemarks] = useState('');

  const generateGridData = () => {
    const data: Date[][] = [];
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startDate = new Date();
    startDate.setDate(today.getDate() - (15 * 7 + dayOfWeek));
    
    const currentDate = new Date(startDate);
    for (let w = 0; w < 16; w++) {
      const week: Date[] = [];
      for (let d = 0; d < 7; d++) {
        week.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      data.push(week);
    }
    return data;
  };

  const fetchActiveTrainees = useCallback(async (currentRole: string = role, currentName: string = mentorName) => {
    try {
      const response = await api.get('/interns');
      let active = response.data.filter((i: Intern) => i.status === 'Ongoing' || i.status === 'Assigned');
      
      if (currentRole === 'mentor' && currentName) {
        active = active.filter((i: Intern) => i.mentorName === currentName);
      }
      
      setInterns(active);
      if (active.length > 0) {
        setSelectedIntern(prev => prev || active[0]);
      }
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, [role, mentorName]);

  const fetchRollCallLogs = useCallback(async (targetDate: string) => {
    try {
      const response = await api.get(`/attendance/date/${targetDate}`);
      const logsMap: Record<number, { status: string; remarks?: string }> = {};
      response.data.forEach((log: AttendanceLog) => {
        logsMap[log.internId] = { status: log.status, remarks: log.remarks };
      });
      setRollCallLogs(logsMap);
    } catch {
      // silently ignore
    }
  }, []);

  const fetchInternLogs = useCallback(async (id: number) => {
    try {
      const response = await api.get(`/attendance/${id}`);
      setLogs(response.data);
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    let currentRole = 'admin';
    let currentName = '';
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        currentRole = parsed.role || 'admin';
        currentName = parsed.name || '';
        setRole(currentRole);
        setMentorName(currentName);
      } catch {
        // silently ignore
      }
    }
    fetchActiveTrainees(currentRole, currentName);
  }, [fetchActiveTrainees]);

  useEffect(() => {
    if (selectedIntern) {
      fetchInternLogs(selectedIntern.id);
    }
  }, [selectedIntern, fetchInternLogs]);

  useEffect(() => {
    if (rollCallDate) {
      fetchRollCallLogs(rollCallDate);
    }
  }, [rollCallDate, interns, fetchRollCallLogs]);

  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIntern) return;

    setSubmitting(true);
    try {
      await api.post('/attendance', {
        internId: selectedIntern.id,
        date,
        status,
        remarks: remarks || null
      });

      toast.success(`Attendance logged successfully for ${selectedIntern.name}`);
      setRemarks('');
      fetchInternLogs(selectedIntern.id);
      
      // Update local interns array to reflect recalculated attendance percentage
      fetchActiveTrainees();
    } catch {
      toast.error('Failed to log attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogStatus = async (internId: number, selectedStatus: string, customRemarks?: string) => {
    setSavingStatus(prev => ({ ...prev, [internId]: 'saving' }));
    try {
      await api.post('/attendance', {
        internId,
        date: rollCallDate,
        status: selectedStatus,
        remarks: customRemarks || null
      });
      setRollCallLogs(prev => ({
        ...prev,
        [internId]: { status: selectedStatus, remarks: customRemarks }
      }));
      setSavingStatus(prev => ({ ...prev, [internId]: 'saved' }));
      
      setTimeout(() => {
        setSavingStatus(prev => ({ ...prev, [internId]: 'idle' }));
      }, 1500);

      // Refresh trainee percentages
      fetchActiveTrainees();
    } catch {
      toast.error('Failed to save attendance log');
      setSavingStatus(prev => ({ ...prev, [internId]: 'idle' }));
    }
  };

  const handleMarkAllPresent = async () => {
    setLoading(true);
    try {
      const promises = interns
        .filter((intern) => rollCallLogs[intern.id]?.status !== 'Present')
        .map((intern) =>
          api.post('/attendance', {
            internId: intern.id,
            date: rollCallDate,
            status: 'Present',
            remarks: null
          })
        );
      if (promises.length > 0) {
        await Promise.all(promises);
      }
      toast.success('All active trainees marked Present');
      fetchRollCallLogs(rollCallDate);
      fetchActiveTrainees();
    } catch {
      toast.error('Failed to log bulk attendance');
    } finally {
      setLoading(false);
    }
  };

  const filtered = interns.filter((i) => {
    const q = search.toLowerCase();
    return !q || i.name.toLowerCase().includes(q) || i.institute.toLowerCase().includes(q) || i.branch.toLowerCase().includes(q);
  });

  const gridData = generateGridData();
  const logsMap = new Map<string, AttendanceLog>();
  logs.forEach(l => {
    if (l.date) {
      const dStr = l.date.split('T')[0];
      logsMap.set(dStr, l);
    }
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-md border border-zinc-200/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[16px] font-semibold text-[#18181b] tracking-tight">Attendance Workspace</h1>
          <p className="text-[#71717a] mt-1 text-[13px]">Track and record daily laboratory attendance for active interns</p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveView('sheet')}
            className={`flex items-center gap-1.5 pb-1 text-[12px] font-medium transition-colors duration-100 cursor-pointer ${
              activeView === 'sheet'
                ? 'border-b-2 border-zinc-900 text-zinc-900'
                : 'text-[#a1a1aa] hover:text-[#71717a]'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" strokeWidth={1.7} />
            Daily Roll Call Sheet
          </button>
          <button
            onClick={() => setActiveView('history')}
            className={`flex items-center gap-1.5 pb-1 text-[12px] font-medium transition-colors duration-100 cursor-pointer ${
              activeView === 'history'
                ? 'border-b-2 border-zinc-900 text-zinc-900'
                : 'text-[#a1a1aa] hover:text-[#71717a]'
            }`}
          >
            <Users className="w-4 h-4" strokeWidth={1.7} />
            Trainee Histories
          </button>
        </div>
      </div>

      {/* ───────────────── Tab 1: Daily Roll Call Sheet ───────────────── */}
      {activeView === 'sheet' && (
        <div className="bg-white rounded-md border border-zinc-200/60 overflow-hidden p-6 space-y-5">
          {/* Controls bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200/60 pb-4">
            <div className="flex items-center gap-3">
              <div>
                <label className="text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider block mb-1">Roll Call Date</label>
                <input
                  type="date"
                  value={rollCallDate}
                  onChange={(e) => setRollCallDate(e.target.value)}
                  className="h-9 px-3 rounded-md border border-zinc-200/80 bg-white text-[13px] text-[#18181b] outline-none transition-colors duration-100 focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 cursor-pointer tabular-nums"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkAllPresent}
                className="bg-[#18181b] text-white hover:bg-[#27272a] h-8 px-3 text-[13px] font-medium rounded-md transition-colors duration-100 cursor-pointer"
              >
                Mark All Present
              </button>
            </div>
          </div>

          {/* Roll Call Table */}
          <div className="overflow-x-auto border border-zinc-200/60 rounded-md">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-zinc-200/60">
                  <th className="px-6 py-3 text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider">Trainee Profile</th>
                  <th className="px-6 py-3 text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider text-center">Attendance Logs</th>
                  <th className="px-6 py-3 text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider">Inline Remarks</th>
                  <th className="px-6 py-3 text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider text-center w-24">Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/50">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-[#a1a1aa] text-[13px] animate-pulse">Loading roll call registry…</td>
                  </tr>
                ) : interns.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-[#a1a1aa] text-[13px]">No active trainees found to log.</td>
                  </tr>
                ) : (
                  interns.map((intern) => {
                    const record = rollCallLogs[intern.id];
                    const statusVal = record?.status;
                    const saving = savingStatus[intern.id] || 'idle';

                    return (
                      <tr key={intern.id} className="hover:bg-zinc-50 transition-colors duration-100">
                        {/* Trainee Details */}
                        <td className="px-6 py-4">
                          <div className="text-[13px] font-medium text-[#18181b]">{intern.name}</div>
                          <div className="text-[11px] text-[#a1a1aa] mt-0.5">
                            {intern.institute} &bull; {intern.branch}
                          </div>
                        </td>

                        {/* Quick Attendance Selector */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleLogStatus(intern.id, 'Present', record?.remarks)}
                              className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors duration-100 cursor-pointer ${
                                statusVal === 'Present'
                                  ? 'bg-emerald-50/50 text-emerald-700 border border-emerald-100'
                                  : 'bg-white hover:bg-zinc-50 text-[#71717a] border border-zinc-200/60'
                              }`}
                            >
                              Present
                            </button>
                            <button
                              onClick={() => handleLogStatus(intern.id, 'Absent', record?.remarks)}
                              className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors duration-100 cursor-pointer ${
                                statusVal === 'Absent'
                                  ? 'bg-red-50/50 text-red-700 border border-red-100'
                                  : 'bg-white hover:bg-zinc-50 text-[#71717a] border border-zinc-200/60'
                              }`}
                            >
                              Absent
                            </button>
                            <button
                              onClick={() => handleLogStatus(intern.id, 'Leave', record?.remarks)}
                              className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors duration-100 cursor-pointer ${
                                statusVal === 'Leave'
                                  ? 'bg-amber-50/50 text-amber-700 border border-amber-100'
                                  : 'bg-white hover:bg-zinc-50 text-[#71717a] border border-zinc-200/60'
                              }`}
                            >
                              Leave
                            </button>
                          </div>
                        </td>

                        {/* Remarks */}
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            placeholder="Add remarks..."
                            defaultValue={record?.remarks || ''}
                            onBlur={(e) => {
                              if (e.target.value !== (record?.remarks || '')) {
                                handleLogStatus(intern.id, statusVal || 'Present', e.target.value);
                              }
                            }}
                            className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-[13px] text-[#18181b] outline-none transition-colors duration-100 focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950"
                          />
                        </td>

                        {/* Synced Status Check */}
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center">
                            {saving === 'saving' ? (
                              <Loader2 className="w-4 h-4 text-[#a1a1aa] animate-spin" strokeWidth={1.7} />
                            ) : saving === 'saved' ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/50">
                                <Check className="w-3.5 h-3.5" strokeWidth={1.7} /> Synced
                              </span>
                            ) : statusVal ? (
                              <span className="text-[10px] font-medium text-[#71717a] bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200/60">
                                Saved
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-[#a1a1aa] bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-200/30">
                                Unmarked
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ───────────────── Tab 2: Individual History logs ───────────────── */}
      {activeView === 'history' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left list pane */}
          <div className="lg:col-span-1 bg-white p-5 rounded-md border border-zinc-200/60 space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-[#a1a1aa]" strokeWidth={1.7} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search trainees…"
                className="h-9 w-full rounded-md border border-zinc-200/80 bg-white pl-9 pr-3 text-[13px] text-[#18181b] outline-none transition-colors duration-100 focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950"
              />
            </div>

            <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
              {loading ? (
                <div className="p-4 text-center text-[13px] text-[#a1a1aa] animate-pulse">Loading list…</div>
              ) : filtered.length === 0 ? (
                <div className="p-4 text-center text-[13px] text-[#a1a1aa]">No active trainees found.</div>
              ) : (
                filtered.map((intern) => (
                  <button
                    key={intern.id}
                    onClick={() => setSelectedIntern(intern)}
                    className={`w-full flex items-center justify-between rounded-md p-3 text-left border text-[13px] transition-colors duration-100 cursor-pointer ${
                      selectedIntern?.id === intern.id
                        ? 'border-zinc-300 bg-zinc-50 text-[#18181b]'
                        : 'border-zinc-200/60 hover:bg-zinc-50 text-[#18181b]'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-[13px]">{intern.name}</p>
                      <p className="text-[11px] text-[#a1a1aa] mt-0.5">{intern.institute}</p>
                    </div>
                    <span className="text-[10px] font-medium text-[#71717a] bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200/60 tabular-nums">
                      {intern.attendance || '0%'}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right history pane */}
          <div className="lg:col-span-2 space-y-6">
            {selectedIntern ? (
              <>
                {/* Form */}
                <div className="bg-white rounded-md border border-zinc-200/60 p-5 space-y-4">
                  <h3 className="text-[15px] font-semibold text-[#18181b] tracking-tight">Record Attendance &bull; {selectedIntern.name}</h3>
                  <form onSubmit={handleMarkAttendance} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <label className="text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider block mb-1.5">Date</label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-[13px] text-[#18181b] outline-none transition-colors duration-100 focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider block mb-1.5">Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-[13px] text-[#18181b] outline-none transition-colors duration-100 focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 cursor-pointer"
                      >
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                        <option value="Leave">Excused Leave</option>
                      </select>
                    </div>
                    <div>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-[#18181b] text-white hover:bg-[#27272a] h-8 px-3 text-[13px] font-medium rounded-md transition-colors duration-100 disabled:opacity-50 cursor-pointer"
                      >
                        {submitting ? 'Saving…' : 'Log Attendance'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* GitHub style Contribution Heatmap */}
                <div className="bg-white rounded-md border border-zinc-200/60 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[15px] font-semibold text-[#18181b] tracking-tight flex items-center gap-1.5">
                      <ClipboardCheck className="w-4 h-4 text-[#a1a1aa]" strokeWidth={1.7} />
                      Attendance Heatmap
                    </h3>
                    <span className="text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider">
                      Last 16 Weeks
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5 p-4 bg-zinc-50 rounded-md border border-zinc-200/60 overflow-x-auto">
                    {/* Day labels (Sun, Tue, Thu, Sat) */}
                    <div className="grid grid-rows-7 gap-1 text-[8px] font-medium text-[#a1a1aa] select-none pr-1 mt-[11px]">
                      <span>Sun</span>
                      <span className="opacity-0">Mon</span>
                      <span>Tue</span>
                      <span className="opacity-0">Wed</span>
                      <span>Thu</span>
                      <span className="opacity-0">Fri</span>
                      <span>Sat</span>
                    </div>

                    {/* The grid columns */}
                    <div className="flex gap-[3.5px]">
                      {gridData.map((week, wIdx) => (
                        <div key={wIdx} className="grid grid-rows-7 gap-[3.5px]">
                          {week.map((day, dIdx) => {
                            const dStr = toLocalDateString(day);
                            const log = logsMap.get(dStr);
                            let cellColor = 'bg-zinc-200';
                            
                            if (log) {
                              if (log.status === 'Present') cellColor = 'bg-emerald-400';
                              else if (log.status === 'Absent') cellColor = 'bg-red-400';
                              else if (log.status === 'Leave') cellColor = 'bg-amber-400';
                            }

                            const formattedDate = day.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                            const tooltip = `${formattedDate}: ${log ? log.status : 'No Log'}${log?.remarks ? ` (${log.remarks})` : ''}`;

                            return (
                              <div
                                key={dIdx}
                                title={tooltip}
                                className={`w-[10px] h-[10px] rounded-sm transition-colors duration-100 ${cellColor} cursor-help`}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center justify-end gap-3 text-[11px] font-medium text-[#71717a] pt-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-[10px] h-[10px] rounded-sm bg-zinc-200" />
                      <span>Unlogged</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-[10px] h-[10px] rounded-sm bg-emerald-400" />
                      <span>Present</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-[10px] h-[10px] rounded-sm bg-red-400" />
                      <span>Absent</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-[10px] h-[10px] rounded-sm bg-amber-400" />
                      <span>Leave</span>
                    </div>
                  </div>
                </div>

                {/* History Table */}
                <div className="bg-white rounded-md border border-zinc-200/60 overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-zinc-200/60 flex items-center justify-between">
                    <h3 className="text-[15px] font-semibold text-[#18181b] tracking-tight flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#a1a1aa]" strokeWidth={1.7} />
                      Attendance History Logs
                    </h3>
                    <span className="text-[10px] font-medium text-[#71717a] bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200/60 tabular-nums">
                      Overall Record: {selectedIntern.attendance || '0%'}
                    </span>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto">
                    <table className="w-full text-left text-[13px]">
                      <thead>
                        <tr className="border-b border-zinc-200/60">
                          <th className="px-6 py-3 text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider">Date Logged</th>
                          <th className="px-6 py-3 text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200/50">
                        {logs.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-6 py-8 text-center text-[#a1a1aa] text-[13px]">No records logged.</td>
                          </tr>
                        ) : (
                          logs.map((log) => (
                            <tr key={log.id} className="hover:bg-zinc-50 transition-colors duration-100">
                              <td className="px-6 py-3 text-[13px] text-[#18181b] tabular-nums">
                                {new Date(log.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="px-6 py-3">
                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                                  log.status === 'Present'
                                    ? 'text-emerald-700 bg-emerald-50/50 border-emerald-100/50'
                                    : log.status === 'Absent'
                                    ? 'text-red-700 bg-red-50/50 border-red-100/50'
                                    : 'text-amber-700 bg-amber-50/50 border-amber-100/50'
                                }`}>
                                  {log.status}
                                </span>
                              </td>
                              <td className="px-6 py-3 text-[13px] text-[#71717a]">{log.remarks || '—'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-md border border-zinc-200/60 p-20 text-center">
                <Calendar className="w-4 h-4 text-[#a1a1aa] mx-auto mb-4" strokeWidth={1.7} />
                <p className="text-[15px] font-semibold text-[#18181b] tracking-tight">No candidate selected</p>
                <p className="text-[13px] text-[#71717a] mt-1">Select an active trainee from the left list to manage logs.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
