import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Printer, Award, ChevronDown, Check, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axiosInstance';
import type { Intern } from '../../types';

const toLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function CertificatesPage() {
  const location = useLocation();
  const [interns, setInterns] = useState<Intern[]>([]);
  const [selectedIntern, setSelectedIntern] = useState<Intern | null>(null);
  const [certNumber, setCertNumber] = useState('');
  const [issueDate, setIssueDate] = useState(toLocalDateString());
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [issuedSuccessfully, setIssuedSuccessfully] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Dynamic scale states to shrink/fit certificate preview inside any screen width (mobile/desktop)
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const certificateRef = useRef<HTMLDivElement>(null);

  const handleSelectIntern = useCallback((intern: Intern) => {
    setSelectedIntern(intern);
    setCertNumber(`SSPL/HR/2026/0${100 + intern.id}`);
    setIssuedSuccessfully(intern.status === 'Issued');
    setShowDropdown(false);
  }, []);

  const fetchCompletedInterns = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/interns');
      const completed = response.data.filter((i: Intern) => i.status === 'Completed' || i.status === 'Issued');
      setInterns(completed);
      
      const routeInternId = location.state?.internId;
      if (routeInternId) {
        const found = completed.find((i: Intern) => i.id === routeInternId);
        if (found) {
          handleSelectIntern(found);
        }
      } else if (completed.length > 0) {
        handleSelectIntern(completed[0]);
      }
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, [location.state, handleSelectIntern]);

  useEffect(() => {
    fetchCompletedInterns();
  }, [fetchCompletedInterns]);

  // Adjust preview scaling to fit the responsive parent column width dynamically
  useEffect(() => {
    if (!selectedIntern) return;
    const handleResize = () => {
      if (containerRef.current) {
        const parentWidth = containerRef.current.clientWidth;
        // The certificate core is designed around a 760px canvas width
        const newScale = Math.min(1, (parentWidth - 40) / 760); // 40px padding allowance
        setScale(newScale > 0.1 ? newScale : 0.1);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    // Extra timeout callback to ensure layout recalculations run after standard paint passes
    const timer = setTimeout(handleResize, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [selectedIntern, interns]);

  const handleIssueCertificate = async () => {
    if (!selectedIntern) return;
    setIssuing(true);
    try {
      const updated = {
        ...selectedIntern,
        status: 'Issued' as const
      };
      await api.put(`/interns/${selectedIntern.id}`, updated);
      
      setInterns(prev => prev.map(i => i.id === selectedIntern.id ? { ...i, status: 'Issued' } : i));
      setSelectedIntern(prev => prev ? { ...prev, status: 'Issued' } : null);
      setIssuedSuccessfully(true);
      
      toast.success(`Certificate ${certNumber} successfully approved and registered!`);
    } catch {
      toast.error('Failed to register certificate');
    } finally {
      setIssuing(false);
    }
  };

  const handlePrint = () => {
    const printContent = certificateRef.current?.innerHTML;
    if (!printContent) return;

    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        @page {
          size: landscape;
          margin: 0;
        }
        body {
          margin: 0;
          padding: 0;
          background: white;
        }
        body * {
          visibility: hidden;
        }
        #print-section, #print-section * {
          visibility: visible;
        }
        #print-section {
          position: absolute;
          left: 0;
          top: 0;
          width: 100vw;
          height: 100vh;
          border: none;
          box-shadow: none;
          padding: 0;
          margin: 0;
          background: white !important;
          color: black !important;
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
        }
        #print-section #certificate-print {
          width: 92vw !important;
          min-width: 92vw !important;
          max-width: 92vw !important;
          height: 92vh !important;
          min-height: 92vh !important;
          max-height: 92vh !important;
          margin: 0 !important;
          padding: 32px !important;
          box-sizing: border-box !important;
          border: 16px double black !important;
          transform: none !important;
        }
      }
    `;
    
    document.head.appendChild(style);
    
    const printDiv = document.createElement('div');
    printDiv.id = 'print-section';
    printDiv.innerHTML = printContent;
    document.body.appendChild(printDiv);
    
    window.print();
    
    document.body.removeChild(printDiv);
    document.head.removeChild(style);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-md border border-zinc-200/60">
        <div>
          <h1 className="text-[16px] font-semibold text-[#18181b] tracking-tight">Certificate Generator</h1>
          <p className="text-[#71717a] mt-1 text-[13px]">Verify, approve, and print training completion certificates</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-4 rounded-md border border-zinc-200/60 space-y-4">
            <div className="space-y-1.5 relative">
              <label className="block text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider">
                Select Intern
              </label>
              
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full h-9 flex items-center justify-between rounded-md border border-zinc-200/80 bg-white px-3 text-[13px] text-[#18181b] outline-none hover:bg-zinc-50 transition-colors duration-100 cursor-pointer"
              >
                <span>{selectedIntern ? selectedIntern.name : 'Choose completed intern…'}</span>
                <ChevronDown className="h-4 w-4 text-[#a1a1aa]" strokeWidth={1.7} />
              </button>

              {showDropdown && (
                <div className="absolute top-[60px] left-0 right-0 z-20 max-h-60 overflow-y-auto rounded-md border border-zinc-200 bg-white p-1 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                  {loading ? (
                    <div className="p-4 text-center text-[13px] text-[#a1a1aa]">Loading list…</div>
                  ) : interns.length === 0 ? (
                    <div className="p-4 text-center text-[13px] text-[#a1a1aa]">No completed interns found</div>
                  ) : (
                    interns.map((i) => (
                      <button
                        key={i.id}
                        type="button"
                        onClick={() => handleSelectIntern(i)}
                        className="w-full flex items-center justify-between rounded-md px-3 py-2 text-left text-[13px] text-[#18181b] hover:bg-zinc-50 transition-colors duration-100 cursor-pointer"
                      >
                        <div>
                          <p className="font-medium text-[13px]">{i.name}</p>
                          <p className="text-[10px] text-[#a1a1aa] mt-0.5">{i.institute}</p>
                        </div>
                        {selectedIntern?.id === i.id && <Check className="h-4 w-4 text-[#18181b]" strokeWidth={1.7} />}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {selectedIntern && (
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider block">Certificate Number</span>
                  <input
                    value={certNumber}
                    onChange={(e) => setCertNumber(e.target.value)}
                    className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-[13px] text-[#18181b] outline-none transition-colors duration-100 focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 placeholder:text-[#a1a1aa] tabular-nums"
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider block">Date of Issue</span>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-[13px] text-[#18181b] outline-none transition-colors duration-100 focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 placeholder:text-[#a1a1aa] tabular-nums"
                  />
                </div>

                <div className="pt-2">
                  {issuedSuccessfully ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 rounded-md bg-emerald-50/50 border border-emerald-100/50 p-3 text-[13px] font-medium text-emerald-800">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" strokeWidth={1.7} />
                        Certificate issued!
                      </div>
                      <button
                        onClick={handlePrint}
                        className="w-full flex items-center justify-center bg-[#18181b] text-white hover:bg-[#27272a] h-8 px-3 text-[13px] font-medium rounded-md transition-colors duration-100 cursor-pointer"
                      >
                        <Printer className="w-4 h-4 mr-2" strokeWidth={1.7} />
                        Print Certificate
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleIssueCertificate}
                      disabled={issuing}
                      className="w-full flex items-center justify-center bg-[#18181b] text-white hover:bg-[#27272a] h-8 px-3 text-[13px] font-medium rounded-md transition-colors duration-100 disabled:opacity-50 cursor-pointer"
                    >
                      {issuing ? 'Approving…' : 'Approve & Issue Certificate'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Certificate Preview Card */}
        <div className="lg:col-span-2 space-y-4">
          <span className="block text-[11px] font-medium text-[#71717a] uppercase tracking-wider px-1">
            Certificate Preview
          </span>
          
          {selectedIntern ? (
            <div 
              ref={containerRef}
              className="bg-zinc-50 rounded-md p-5 border border-zinc-200/60 flex items-center justify-center overflow-hidden w-full"
              style={{ height: `${538 * scale + 40}px` }}
            >
              {/* Outer frame matching real print sizing scaled dynamically */}
              <div 
                ref={certificateRef}
                className="bg-white border-[16px] border-double border-slate-900 p-8 flex flex-col justify-between relative select-none origin-center"
                id="certificate-print"
                style={{
                  width: '760px',
                  minWidth: '760px',
                  height: '538px',
                  minHeight: '538px',
                  transform: `scale(${scale})`,
                  flexShrink: 0
                }}
              >
                {/* Border accent lines */}
                <div className="absolute inset-2 border border-slate-900/10 pointer-events-none" />

                {/* Top Badge/Header */}
                <div className="flex flex-col items-center text-center">
                  <img src="/drdo_logo.png" alt="DRDO Seal" className="w-12 h-12 object-contain mb-2 select-none" />
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 font-serif uppercase">
                    SOLID STATE PHYSICS LABORATORY (SSPL)
                  </h2>
                  <p className="text-[9px] font-bold tracking-widest text-slate-500 uppercase mt-0.5">
                    Defence Research & Development Organisation (DRDO) &bull; Ministry of Defence &bull; Govt of India
                  </p>
                  <p className="text-[8px] text-slate-400 mt-0.5">Lucknow Road, Timarpur, Delhi - 110054</p>
                </div>

                {/* Title */}
                <div className="text-center my-4">
                  <h1 className="text-2xl font-extrabold text-slate-950 tracking-wider font-serif uppercase">
                    Certificate of Training
                  </h1>
                  <p className="text-[10px] font-bold text-slate-400 tracking-[0.25em] uppercase mt-1">
                    Internship Completion
                  </p>
                </div>

                {/* Certificate description text */}
                <div className="text-center text-xs text-slate-700 px-6 leading-relaxed max-w-[620px] mx-auto space-y-3 font-serif">
                  <p>
                    This is to certify that <span className="font-bold text-slate-900 border-b border-dotted border-slate-400 px-1">{selectedIntern.name}</span>, 
                    a student of <span className="font-bold text-slate-800">{selectedIntern.institute}</span> pursuing <span className="font-bold text-slate-800">{selectedIntern.qualification} ({selectedIntern.branch})</span> 
                    has successfully completed an internship training at this laboratory.
                  </p>
                  <p>
                    The training was conducted under the supervision and guidance of Scientist / Advisor{' '}
                    <span className="font-bold text-slate-900">{selectedIntern.mentorName || 'Dr. A. K. Gupta'}</span> from{' '}
                    <span className="font-medium text-slate-600">{new Date(selectedIntern.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span> to{' '}
                    <span className="font-medium text-slate-600">{new Date(issueDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>.
                  </p>
                  <p>
                    During the training period his/her conduct at SSPL was good.
                  </p>
                </div>

                {/* Footer and Signatures */}
                <div className="flex justify-between items-end px-6 pt-6 border-t border-slate-100/50 mt-4">
                  <div className="flex flex-col text-left text-[9px] text-slate-500 font-semibold space-y-1">
                    <p>Certificate No: <span className="text-slate-800 font-bold tabular-nums">{certNumber}</span></p>
                    <p>Date of Issue: <span className="text-slate-800 font-bold">{new Date(issueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></p>
                  </div>

                  <div className="text-center relative">
                    {/* Mock Seal deleted — Signature field left blank */}
                    <div className="h-10" />
                    <div className="w-32 h-px bg-slate-300 my-1 mx-auto" />
                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">
                      Head, HRD Division
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-md border border-zinc-200/60 p-20 text-center">
              <Award className="h-4 w-4 text-[#a1a1aa] mx-auto mb-3" strokeWidth={1.7} />
              <p className="font-medium text-[#18181b] text-[13px]">No intern selected</p>
              <p className="text-[13px] text-[#a1a1aa] mt-1">Select a completed intern from the dropdown to preview and issue their certificate.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
