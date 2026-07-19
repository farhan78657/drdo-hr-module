import { useState, useEffect, useCallback } from 'react';
import { Download, Mail, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axiosInstance';
import type { Scientist } from '../../types';

export default function ScientistsList() {
  const [scientists, setScientists] = useState<Scientist[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchScientists = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/scientists');
      setScientists(response.data);
    } catch {
      toast.error('Failed to retrieve scientists list');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScientists();
  }, [fetchScientists]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Invalid file type. Please upload a .csv file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/scientists/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(response.data.message || 'File uploaded successfully!');
      fetchScientists();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message || 'Failed to upload file';
      toast.error(msg);
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const downloadCSVTemplate = () => {
    const csvContent = 
      "Name,Email,Department\n" +
      "Dr. A. K. Gupta,akgupta@sspl.drdo.in,Solid State Devices\n" +
      "Dr. R. K. Verma,rkverma@sspl.drdo.in,Optoelectronics\n" +
      "Dr. S. K. Rao,skrao@sspl.drdo.in,Silicon Devices\n" +
      "Dr. P. Sharma,psharma@sspl.drdo.in,Quantum Materials\n";
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "drdo_scientists_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-md border border-zinc-200/60">
        <div>
          <h1 className="text-[16px] font-semibold text-[#18181b] tracking-tight">Scientists Registry</h1>
          <p className="text-[#71717a] mt-1 text-[13px]">Manage and import DRDO Scientists / Mentors</p>
        </div>
        <button 
          onClick={downloadCSVTemplate}
          className="flex items-center bg-white border border-zinc-200/60 text-[#18181b] hover:bg-zinc-50 h-8 px-3 text-[13px] font-medium rounded-md transition-colors duration-100 cursor-pointer"
        >
          <Download className="w-4 h-4 mr-2 text-[#a1a1aa]" strokeWidth={1.7} />
          Download Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Card */}
        <div className="md:col-span-1 bg-white p-4 rounded-md border border-zinc-200/60 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-[11px] font-medium text-[#71717a] uppercase tracking-wider">Import Scientists</h3>
            <p className="text-[13px] text-[#71717a] leading-relaxed">
              Upload a CSV spreadsheet containing names, emails, and departments. 
              This will automatically populate the mentor assignment selector.
            </p>
          </div>

          <div className="mt-6">
            <label className={`w-full flex flex-col items-center justify-center border border-dashed rounded-md p-5 text-center cursor-pointer transition-colors duration-100 ${
              uploading 
                ? 'border-zinc-200 bg-zinc-50 cursor-not-allowed'
                : 'border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50/50'
            }`}>
              <FileText className="w-4 h-4 text-[#a1a1aa] mb-1.5" strokeWidth={1.7} />
              <span className="text-[13px] font-medium text-[#18181b]">
                {uploading ? 'Processing file…' : 'Choose CSV file'}
              </span>
              <span className="text-[10px] text-[#a1a1aa] mt-1 font-medium tabular-nums">CSV files up to 2MB</span>
              <input 
                type="file" 
                accept=".csv"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden" 
              />
            </label>
          </div>
        </div>

        {/* List Table Card */}
        <div className="md:col-span-2 overflow-hidden rounded-md bg-white border border-zinc-200/60 flex flex-col justify-between">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-zinc-200/60">
                  <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-[#a1a1aa]">Scientist</th>
                  <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-[#a1a1aa]">Department</th>
                  <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-[#a1a1aa]">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/50">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={3} className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-md bg-zinc-100 animate-pulse" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 w-32 rounded bg-zinc-100 animate-pulse" />
                            <div className="h-2 w-20 rounded bg-zinc-100 animate-pulse" />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : scientists.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-12 text-center text-[#a1a1aa] text-[13px]">
                      No scientists registered yet. Upload a CSV file to populate the list.
                    </td>
                  </tr>
                ) : (
                  scientists.map((scientist) => (
                    <tr key={scientist.id} className="hover:bg-zinc-50 transition-colors duration-100">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-50 border border-zinc-200/60 text-[#71717a] font-medium text-[10px]">
                            SC
                          </div>
                          <div className="font-medium text-[#18181b] text-[13px]">{scientist.name}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#71717a] text-[13px]">{scientist.department}</td>
                      <td className="px-4 py-3 text-[#71717a] flex items-center gap-1.5 text-[13px]">
                        <Mail className="w-4 h-4 text-[#a1a1aa]" strokeWidth={1.7} />
                        {scientist.email}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
