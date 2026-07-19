// Define InternStatus first since Intern references it
export type InternStatus =
  | "New"
  | "Assigned"
  | "Ongoing"
  | "Completed"
  | "Rejected"
  | "Issued";

export interface Intern {
  id: number;
  name: string;
  dateOfBirth: string;
  presentAddress: string;
  permanentAddress: string;
  mobile: string;
  email: string;
  branch: string;
  aadharNo: string;
  qualification: string;
  institute: string;
  grades: string;
  photoPath?: string;
  status: InternStatus;
  mentorName?: string | null;
  projectName?: string | null;
  rejectRemarks?: string | null;
  mentorRemarks?: string | null;
  attendance?: string | null;
  reportSubmitted: boolean;
  passStatus?: string | null;
  createdAt: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface DashboardStats {
  total: number;
  new: number;
  assigned: number;
  ongoing: number;
  completed: number;
  rejected: number;
  issued: number;
}

export interface Scientist {
  id: number;
  name: string;
  email: string;
  department: string;
}
