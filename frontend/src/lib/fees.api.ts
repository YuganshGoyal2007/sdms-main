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
