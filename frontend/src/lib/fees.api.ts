import api from './api';

export interface FeeRecordItem {
  id: number;
  studentId: number;
  rollNo: string;
  academicYear: string;
  semester: number;
  feeType: string;
  amount: number;
  paidAmount: number;
  dueAmount: number;
  status: 'paid' | 'partial' | 'pending' | 'overdue';
  dueDate?: string;
  paidDate?: string;
  transactionRef?: string;
  receiptUrl?: string;
  remarks?: string;
}

export interface FeeSummary {
  totalAmount: number;
  totalPaid: number;
  totalDue: number;
  status: 'cleared' | 'dues_pending';
  count: number;
}

export interface StudentFeesResponse {
  success: boolean;
  student: any;
  summary: FeeSummary;
  feeRecords: FeeRecordItem[];
}

export const getMyFees = async (): Promise<StudentFeesResponse> => {
  const response = await api.get('/fees/my');
  return response.data;
};

export const getStudentFeesByRoll = async (rollNo: string): Promise<StudentFeesResponse> => {
  const response = await api.get(`/fees/student/${rollNo}`);
  return response.data;
};

export const payFee = async (recordId: number, amount?: number, paymentMethod?: string) => {
  const response = await api.post('/fees/pay', { recordId, amount, paymentMethod });
  return response.data;
};

export interface AdminFeesMetrics {
  totalAssessed: number;
  totalCollected: number;
  totalOutstanding: number;
  totalStudentsWithDues: number;
}

export interface AdminFeesResponse {
  success: boolean;
  data: (FeeRecordItem & { Student?: any })[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  metrics: AdminFeesMetrics;
}

export const getAllFeesAdmin = async (params?: {
  page?: number;
  limit?: number;
  query?: string;
  status?: string;
  semester?: string | number;
  feeType?: string;
}): Promise<AdminFeesResponse> => {
  const response = await api.get('/fees/admin/all', { params });
  return response.data;
};

export const assessStudentFee = async (payload: {
  rollNo: string;
  feeType: string;
  amount: number;
  semester?: number;
  academicYear?: string;
  dueDate?: string;
  remarks?: string;
}) => {
  const response = await api.post('/fees/admin/record', payload);
  return response.data;
};

export const updateFeeRecord = async (
  id: number,
  payload: {
    paidAmount?: number;
    dueAmount?: number;
    status?: string;
    remarks?: string;
    transactionRef?: string;
  }
) => {
  const response = await api.put(`/fees/admin/record/${id}`, payload);
  return response.data;
};
