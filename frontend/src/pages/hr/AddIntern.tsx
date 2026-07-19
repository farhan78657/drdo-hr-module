import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Save, Upload, Camera } from 'lucide-react';
import type { Intern } from '../../types';
import api from '../../api/axiosInstance';

export default function AddIntern() {
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<Partial<Intern> & { customBranch?: string }>();
  const [loading, setLoading] = useState(false);
  const branchValue = watch('branch');

  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const clearForm = () => {
    reset();
    setPhotoPreview('');
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error('Only JPG and PNG images are supported');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/interns/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setValue('photoPath', response.data.photoPath);
      setPhotoPreview(`http://localhost:5000${response.data.photoPath}`);
      toast.success('Photograph uploaded successfully');
    } catch {
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const onSubmit = async (data: Partial<Intern> & { customBranch?: string }) => {
    setLoading(true);
    const submitData = {
      ...data,
      branch: data.branch === 'Other' ? (data.customBranch || 'Other') : data.branch
    };
    delete submitData.customBranch;

    try {
      await api.post('/interns', submitData);
      toast.success('Intern successfully registered in the system');
      clearForm();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || 'Failed to add intern';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const [uploading, setUploading] = useState(false);

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const response = await api.post('/interns/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(response.data.message || 'Interns imported successfully!');
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message || 'Failed to upload file';
      toast.error(msg);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const downloadInternTemplate = () => {
    const csvContent = 
      "Name,DateOfBirth,Mobile,Email,AadharNo,Qualification,Institute,Branch,Grades\n" +
      "Rahul Sharma,2003-05-15,9876543210,rahul@iitdelhi.ac.in,123456789012,B.Tech,IIT Delhi,Computer Science,8.7 CGPA\n" +
      "Priya Singh,2003-08-22,9876543211,priya@nitkkr.ac.in,234567890123,B.Tech,NIT Kurukshetra,Electronics,8.5 CGPA\n";
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "drdo_interns_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-md border border-zinc-200/60">
        <div>
          <h1 className="text-[16px] font-semibold text-[#18181b] tracking-tight">Register New Candidate</h1>
          <p className="text-[#71717a] mt-1 text-[13px]">Format 'A' - Training / Internship Registration Form</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={downloadInternTemplate}
            className="bg-white border border-zinc-200/60 text-[#18181b] hover:bg-zinc-50 h-8 px-3 text-[13px] font-medium rounded-md transition-colors duration-100 cursor-pointer"
          >
            Download CSV Template
          </button>
          <label className="flex items-center bg-[#18181b] text-white hover:bg-[#27272a] h-8 px-3 text-[13px] font-medium rounded-md transition-colors duration-100 cursor-pointer select-none">
            <Upload className="w-4 h-4 mr-2" strokeWidth={1.7} />
            {uploading ? 'Uploading…' : 'Bulk CSV Import'}
            <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" disabled={uploading} />
          </label>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Section 1: Personal */}
        <div className="bg-white border border-zinc-200/60 rounded-md overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-200/60">
            <h2 className="text-[11px] font-medium text-[#71717a] uppercase tracking-wider">Personal Information</h2>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider mb-1.5">Full Name <span className="text-red-500">*</span></label>
              <input
                {...register('name', { required: 'Name is required' })}
                className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-[13px] text-[#18181b] outline-none transition-colors duration-100 focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 placeholder:text-[#a1a1aa]"
                placeholder="As per matriculation certificate"
              />
              {errors.name && <span className="text-red-500 text-[10px] mt-1 block">{errors.name.message}</span>}
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider mb-1.5">Date of Birth <span className="text-red-500">*</span></label>
              <input
                type="date"
                {...register('dateOfBirth', { required: 'DOB is required' })}
                className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-[13px] text-[#18181b] outline-none transition-colors duration-100 focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 placeholder:text-[#a1a1aa] tabular-nums"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider mb-1.5">Aadhar Number <span className="text-red-500">*</span></label>
              <input
                {...register('aadharNo', { 
                  required: 'Aadhar is required',
                  pattern: {
                    value: /^\d{12}$/,
                    message: 'Aadhar must be exactly 12 digits'
                  }
                })}
                className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-[13px] text-[#18181b] outline-none transition-colors duration-100 focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 placeholder:text-[#a1a1aa] tabular-nums"
                placeholder="12-digit number"
              />
              {errors.aadharNo && <span className="text-red-500 text-[10px] mt-1 block">{errors.aadharNo.message}</span>}
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider mb-1.5">Mobile Number <span className="text-red-500">*</span></label>
              <input
                {...register('mobile', { 
                  required: 'Mobile is required',
                  pattern: {
                    value: /^[+]?[0-9]{10,13}$/,
                    message: 'Enter a valid 10-13 digit mobile number'
                  }
                })}
                className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-[13px] text-[#18181b] outline-none transition-colors duration-100 focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 placeholder:text-[#a1a1aa] tabular-nums"
                placeholder="+91"
              />
              {errors.mobile && <span className="text-red-500 text-[10px] mt-1 block">{errors.mobile.message}</span>}
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider mb-1.5">Email Address <span className="text-red-500">*</span></label>
              <input
                type="email"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: 'Enter a valid email address'
                  }
                })}
                className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-[13px] text-[#18181b] outline-none transition-colors duration-100 focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 placeholder:text-[#a1a1aa]"
                placeholder="official@institution.edu"
              />
              {errors.email && <span className="text-red-500 text-[10px] mt-1 block">{errors.email.message}</span>}
            </div>
          </div>
        </div>

        {/* Section 2: Address */}
        <div className="bg-white border border-zinc-200/60 rounded-md overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-200/60">
            <h2 className="text-[11px] font-medium text-[#71717a] uppercase tracking-wider">Address Details</h2>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider mb-1.5">Present Address</label>
              <textarea
                {...register('presentAddress')}
                rows={3}
                className="w-full rounded-md border border-zinc-200/80 bg-white px-3 py-2 text-[13px] text-[#18181b] outline-none transition-colors duration-100 focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 placeholder:text-[#a1a1aa] resize-none"
                placeholder="Enter complete current hostel or residential address"
              ></textarea>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider mb-1.5">Permanent Address</label>
              <textarea
                {...register('permanentAddress')}
                rows={3}
                className="w-full rounded-md border border-zinc-200/80 bg-white px-3 py-2 text-[13px] text-[#18181b] outline-none transition-colors duration-100 focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 placeholder:text-[#a1a1aa] resize-none"
                placeholder="Enter permanent address as in domicile certificate"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Section 3: Academics & Photo */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-zinc-200/60 rounded-md overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-200/60">
              <h2 className="text-[11px] font-medium text-[#71717a] uppercase tracking-wider">Academic Background</h2>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider mb-1.5">Institute / University <span className="text-red-500">*</span></label>
                <input
                  {...register('institute', { required: 'Required' })}
                  className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-[13px] text-[#18181b] outline-none transition-colors duration-100 focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 placeholder:text-[#a1a1aa]"
                  placeholder="Full name of institute"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider mb-1.5">Qualification <span className="text-red-500">*</span></label>
                <select
                  {...register('qualification', { required: 'Required' })}
                  className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-[13px] text-[#18181b] outline-none transition-colors duration-100 focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 cursor-pointer"
                >
                  <option value="">Select Qualification</option>
                  <option value="B.Tech">B.Tech / B.E.</option>
                  <option value="M.Tech">M.Tech / M.E.</option>
                  <option value="B.Sc">B.Sc</option>
                  <option value="M.Sc">M.Sc</option>
                  <option value="MCA">MCA</option>
                  <option value="BCA">BCA</option>
                  <option value="Ph.D">Ph.D</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider mb-1.5">Branch / Discipline <span className="text-red-500">*</span></label>
                <select
                  {...register('branch', { required: 'Required' })}
                  className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-[13px] text-[#18181b] outline-none transition-colors duration-100 focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 cursor-pointer"
                >
                  <option value="">Select Branch</option>
                  <option value="Computer Science">Computer Science & Eng. (CSE)</option>
                  <option value="Electronics & Communication">Electronics & Comm. (ECE)</option>
                  <option value="Electrical & Electronics">Electrical & Electronics (EEE)</option>
                  <option value="Information Technology">Information Technology (IT)</option>
                  <option value="Mechanical Engineering">Mechanical Engineering (ME)</option>
                  <option value="Instrumentation">Instrumentation & Control</option>
                  <option value="Applied Physics">Applied Physics / Material Science</option>
                  <option value="Chemistry">Chemistry / Chemical Engineering</option>
                  <option value="Nanotechnology">Nanotechnology & Nanoscience</option>
                  <option value="Metallurgy">Metallurgical & Materials</option>
                  <option value="Mathematics & Computing">Mathematics & Computing</option>
                  <option value="Biotechnology">Biotechnology & Bio-Eng.</option>
                  <option value="Other">Other (Specify...)</option>
                </select>
                {branchValue === 'Other' && (
                  <div className="mt-3">
                    <label className="block text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider mb-1.5">Specify Branch <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder="e.g. Aerospace Engineering"
                      {...register('customBranch', { required: branchValue === 'Other' ? 'Please specify branch' : false })}
                      className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-[13px] text-[#18181b] outline-none transition-colors duration-100 focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 placeholder:text-[#a1a1aa]"
                    />
                    {errors.customBranch && <span className="text-red-500 text-[10px] mt-1 block">{errors.customBranch.message}</span>}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider mb-1.5">CGPA / Percentage <span className="text-red-500">*</span></label>
                <input
                  {...register('grades')}
                  className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-[13px] text-[#18181b] outline-none transition-colors duration-100 focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 placeholder:text-[#a1a1aa] tabular-nums"
                  placeholder="e.g. 8.5 CGPA"
                />
              </div>
            </div>
          </div>

          {/* Photo Upload */}
          <div className="bg-white border border-zinc-200/60 rounded-md overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-zinc-200/60">
              <h2 className="text-[11px] font-medium text-[#71717a] uppercase tracking-wider">Photograph Attachment</h2>
            </div>
            <div className="p-4 flex-1 flex flex-col items-center justify-center">
              <div className="w-28 h-28 rounded-md border border-zinc-200/60 bg-white flex flex-col items-center justify-center text-[#a1a1aa] hover:text-[#18181b] hover:border-zinc-300 transition-colors duration-100 cursor-pointer group mb-3 relative overflow-hidden">
                {uploadingPhoto ? (
                  <span className="text-[10px] text-zinc-400">Uploading...</span>
                ) : photoPreview ? (
                  <>
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-medium">
                      <Camera className="w-4 h-4 mb-1" strokeWidth={1.7} />
                      Change Photo
                    </div>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mb-1.5" strokeWidth={1.7} />
                    <span className="text-[10px] font-medium">Select File</span>
                  </>
                )}
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  accept="image/*" 
                  onChange={handlePhotoChange}
                  disabled={uploadingPhoto}
                />
              </div>
              <p className="text-[10px] text-[#a1a1aa] text-center font-medium">JPG or PNG (Passport size &bull; max 2MB)</p>
              <input type="hidden" {...register('photoPath')} />
            </div>
          </div>
        </div>
 
        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-5 border-t border-zinc-200/60">
          <button
            type="button"
            onClick={clearForm}
            className="bg-white border border-zinc-200/60 text-[#18181b] hover:bg-zinc-50 h-8 px-3 text-[13px] font-medium rounded-md transition-colors duration-100 cursor-pointer"
          >
            Clear Form
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center bg-[#18181b] text-white hover:bg-[#27272a] h-8 px-3 text-[13px] font-medium rounded-md transition-colors duration-100 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Processing...' : (
              <>
                <Save className="w-4 h-4 mr-2" strokeWidth={1.7} />
                Register Candidate
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
