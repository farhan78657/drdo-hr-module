import { useState, useEffect, useCallback } from 'react';
import { X, Save, BookOpen, Clock, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axiosInstance';
import type { Intern, Scientist, InternStatus } from '../types';

interface EditInternModalProps {
  isOpen: boolean;
  intern: Intern | null;
  onClose: () => void;
  onSave: () => void;
}

export default function EditInternModal({ isOpen, intern, onClose, onSave }: EditInternModalProps) {
  const [scientists, setScientists] = useState<Scientist[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Fields state
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [aadharNo, setAadharNo] = useState('');
  const [institute, setInstitute] = useState('');
  const [branch, setBranch] = useState('');
  const [qualification, setQualification] = useState('');
  const [grades, setGrades] = useState('');
  const [presentAddress, setPresentAddress] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  
  // Status and workflow state
  const [status, setStatus] = useState<InternStatus>('New');
  const [mentorName, setMentorName] = useState<string>('');
  const [projectName, setProjectName] = useState('');
  const [attendance, setAttendance] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [mentorRemarks, setMentorRemarks] = useState('');
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [passStatus, setPassStatus] = useState<string>('None');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchScientists = useCallback(async () => {
    try {
      const response = await api.get('/scientists');
      setScientists(response.data);
    } catch {
      // silently ignore — user sees empty select
    }
  }, []);

  useEffect(() => {
    if (isOpen && intern) {
      fetchScientists();
      setErrors({});
      
      // Initialize states from intern prop
      setName(intern.name || '');
      setDateOfBirth(intern.dateOfBirth || '');
      setMobile(intern.mobile || '');
      setEmail(intern.email || '');
      setAadharNo(intern.aadharNo || '');
      setInstitute(intern.institute || '');
      setBranch(intern.branch || '');
      setQualification(intern.qualification || 'B.Tech');
      setGrades(intern.grades || '');
      setPresentAddress(intern.presentAddress || '');
      setPermanentAddress(intern.permanentAddress || '');
      setStatus(intern.status || 'New');
      setMentorName(intern.mentorName || '');
      setProjectName(intern.projectName || '');
      setAttendance(intern.attendance || '');
      setReportSubmitted(!!intern.reportSubmitted);
      setMentorRemarks(intern.mentorRemarks || '');
      setRejectRemarks(intern.rejectRemarks || '');
      setPassStatus(intern.passStatus || 'None');
    }
  }, [isOpen, intern, fetchScientists]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intern) return;

    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!aadharNo.trim()) {
      newErrors.aadharNo = 'Aadhar number is required';
    } else if (!/^\d{12}$/.test(aadharNo)) {
      newErrors.aadharNo = 'Aadhar must be exactly 12 digits';
    }
    if (!mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^[+]?[0-9]{10,13}$/.test(mobile)) {
      newErrors.mobile = 'Enter a valid 10-13 digit mobile number';
    }
    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please correct the validation errors first');
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      const updated: Intern = {
        ...intern,
        name,
        dateOfBirth,
        mobile,
        email,
        aadharNo,
        institute,
        branch,
        qualification,
        grades,
        presentAddress,
        permanentAddress,
        status,
        mentorName: mentorName || null,
        projectName: projectName || null,
        attendance: attendance || null,
        reportSubmitted,
        mentorRemarks: mentorRemarks || null,
        rejectRemarks: rejectRemarks || null,
        passStatus: passStatus || 'None',
      };
      
      await api.put(`/interns/${intern.id}`, updated);
      toast.success(`Intern profile and status successfully updated!`, {
        style: {
          borderRadius: '6px',
          background: '#18181b',
          color: '#fff',
        },
      });
      onSave();
      onClose();
    } catch {
      toast.error('Failed to update intern profile');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !intern) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-zinc-900/40" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-white border border-zinc-200/60 rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.05)] flex flex-col max-h-[90vh] z-10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200/60 px-5 py-4">
          <div className="flex items-center gap-3">
            {intern.photoPath ? (
              <img 
                src={intern.photoPath.startsWith('http') ? intern.photoPath : `http://localhost:5000${intern.photoPath}`} 
                alt={name} 
                className="h-10 w-10 rounded-md object-cover border border-zinc-200/60" 
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-zinc-100 border border-zinc-200/60 text-zinc-500 text-[14px] font-bold">
                {name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="text-[14px] font-semibold text-zinc-900 tracking-tight">Candidate Profile & Training Record</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5 font-medium tabular-nums">System Reference ID: #{intern.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-500 transition-colors duration-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10">
            <X className="h-4 w-4" strokeWidth={1.7} />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left Column: Personal and Academic Info */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 border-b border-zinc-200/60 pb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.7} />
              Format A - Personal & Academics
            </h4>
            
            <div className="grid grid-cols-2 gap-3.5">
              <div className="col-span-2">
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-9 rounded-md border border-zinc-200/60 bg-white px-3 text-[13px] text-zinc-900 outline-none transition-colors duration-100 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 focus-visible:border-zinc-400 focus-visible:ring-zinc-900/5 font-medium"
                />
                {errors.name && <span className="text-red-500 text-[10px] mt-1 block">{errors.name}</span>}
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full h-9 rounded-md border border-zinc-200/60 bg-white px-3 text-[13px] text-zinc-900 outline-none transition-colors duration-100 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 focus-visible:border-zinc-400 focus-visible:ring-zinc-900/5 font-medium tabular-nums"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Aadhar Number</label>
                <input
                  value={aadharNo}
                  onChange={(e) => setAadharNo(e.target.value)}
                  className="w-full h-9 rounded-md border border-zinc-200/60 bg-white px-3 text-[13px] text-zinc-900 outline-none transition-colors duration-100 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 focus-visible:border-zinc-400 focus-visible:ring-zinc-900/5 font-medium tabular-nums"
                />
                {errors.aadharNo && <span className="text-red-500 text-[10px] mt-1 block">{errors.aadharNo}</span>}
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Mobile Contact</label>
                <input
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full h-9 rounded-md border border-zinc-200/60 bg-white px-3 text-[13px] text-zinc-900 outline-none transition-colors duration-100 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 focus-visible:border-zinc-400 focus-visible:ring-zinc-900/5 font-medium tabular-nums"
                />
                {errors.mobile && <span className="text-red-500 text-[10px] mt-1 block">{errors.mobile}</span>}
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-9 rounded-md border border-zinc-200/60 bg-white px-3 text-[13px] text-zinc-900 outline-none transition-colors duration-100 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 focus-visible:border-zinc-400 focus-visible:ring-zinc-900/5 font-medium"
                />
                {errors.email && <span className="text-red-500 text-[10px] mt-1 block">{errors.email}</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="col-span-2">
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">University/Institute</label>
                <input
                  value={institute}
                  onChange={(e) => setInstitute(e.target.value)}
                  className="w-full h-9 rounded-md border border-zinc-200/60 bg-white px-3 text-[13px] text-zinc-900 outline-none transition-colors duration-100 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 focus-visible:border-zinc-400 focus-visible:ring-zinc-900/5 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Discipline & Branch</label>
                <input
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full h-9 rounded-md border border-zinc-200/60 bg-white px-3 text-[13px] text-zinc-900 outline-none transition-colors duration-100 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 focus-visible:border-zinc-400 focus-visible:ring-zinc-900/5 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">CGPA / Grades</label>
                <input
                  value={grades}
                  onChange={(e) => setGrades(e.target.value)}
                  className="w-full h-9 rounded-md border border-zinc-200/60 bg-white px-3 text-[13px] text-zinc-900 outline-none transition-colors duration-100 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 focus-visible:border-zinc-400 focus-visible:ring-zinc-900/5 font-medium tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Present Address</label>
                <textarea
                  value={presentAddress}
                  onChange={(e) => setPresentAddress(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-md border border-zinc-200/60 bg-white text-[13px] text-zinc-900 outline-none transition-colors duration-100 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 focus-visible:border-zinc-400 focus-visible:ring-zinc-900/5 resize-none placeholder:text-zinc-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Permanent Address</label>
                <textarea
                  value={permanentAddress}
                  onChange={(e) => setPermanentAddress(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-md border border-zinc-200/60 bg-white text-[13px] text-zinc-900 outline-none transition-colors duration-100 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 focus-visible:border-zinc-400 focus-visible:ring-zinc-900/5 resize-none placeholder:text-zinc-400"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Training Workflow Status & Details */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 border-b border-zinc-200/60 pb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.7} />
              Office & Mentorship Workflow
            </h4>

            <div className="grid grid-cols-2 gap-3.5 bg-white p-4 rounded-md border border-zinc-200/60">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Internship Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as InternStatus)}
                  className="w-full h-9 rounded-md border border-zinc-200/60 bg-white px-2 text-[13px] text-zinc-900 outline-none transition-colors duration-100 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 focus-visible:border-zinc-400 focus-visible:ring-zinc-900/5 cursor-pointer font-medium"
                >
                  <option value="New">New</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Issued">Issued</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Assigned Mentor</label>
                <select
                  value={mentorName}
                  onChange={(e) => setMentorName(e.target.value)}
                  className="w-full h-9 rounded-md border border-zinc-200/60 bg-white px-2 text-[13px] text-zinc-900 outline-none transition-colors duration-100 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 focus-visible:border-zinc-400 focus-visible:ring-zinc-900/5 cursor-pointer font-medium"
                >
                  <option value="">-- No Mentor Assigned --</option>
                  {scientists.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Assigned Project</label>
                <input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Awaiting mentor assignment..."
                  className="w-full h-9 rounded-md border border-zinc-200/60 bg-white px-3 text-[13px] text-zinc-900 outline-none transition-colors duration-100 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 focus-visible:border-zinc-400 focus-visible:ring-zinc-900/5 placeholder:text-zinc-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Attendance Record</label>
                <input
                  value={attendance}
                  onChange={(e) => setAttendance(e.target.value)}
                  placeholder="e.g. 96%"
                  className="w-full h-9 rounded-md border border-zinc-200/60 bg-white px-3 text-[13px] text-zinc-900 outline-none transition-colors duration-100 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 focus-visible:border-zinc-400 focus-visible:ring-zinc-900/5 placeholder:text-zinc-400 tabular-nums"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Gate Pass</label>
                <select
                  value={passStatus}
                  onChange={(e) => setPassStatus(e.target.value)}
                  className="w-full h-9 rounded-md border border-zinc-200/60 bg-white px-2 text-[13px] text-zinc-900 outline-none transition-colors duration-100 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 focus-visible:border-zinc-400 focus-visible:ring-zinc-900/5 cursor-pointer font-medium"
                >
                  <option value="None">None</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                </select>
              </div>

              <div className="col-span-2 flex items-center gap-2 pt-1.5">
                <input
                  type="checkbox"
                  id="reportSub"
                  checked={reportSubmitted}
                  onChange={(e) => setReportSubmitted(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-200/60 text-zinc-900 focus:ring-zinc-900/10 accent-zinc-900 cursor-pointer"
                />
                <label htmlFor="reportSub" className="text-[13px] text-zinc-900 font-medium cursor-pointer">
                  Technical Project Report Submitted
                </label>
              </div>
            </div>

            {status === 'Rejected' ? (
              <div>
                <label className="block text-[11px] font-medium text-red-650 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Mentor Rejection Remarks
                </label>
                <textarea
                  value={rejectRemarks}
                  onChange={(e) => setRejectRemarks(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-md border border-red-200 bg-white text-[13px] text-red-900 outline-none transition-colors duration-100 focus:border-red-450 focus:ring-2 focus:ring-red-900/5 resize-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Final Performance Remarks</label>
                <textarea
                  value={mentorRemarks}
                  onChange={(e) => setMentorRemarks(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-md border border-zinc-200/60 bg-white text-[13px] text-zinc-900 outline-none transition-colors duration-100 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 focus-visible:border-zinc-400 focus-visible:ring-zinc-900/5 resize-none placeholder:text-zinc-400"
                />
              </div>
            )}
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-zinc-200/60 p-4 bg-zinc-50/50">
          <button type="button" onClick={onClose} className="bg-white border border-zinc-200/60 text-zinc-900 hover:bg-zinc-50 h-8 px-3 text-[13px] font-medium rounded-md transition-colors duration-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center bg-zinc-900 text-white hover:bg-zinc-800 h-8 px-4 text-[13px] font-medium rounded-md transition-colors duration-100 disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.7} />
            {loading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
