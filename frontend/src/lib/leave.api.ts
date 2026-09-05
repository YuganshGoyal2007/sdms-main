import api from './api';

export interface LeaveTypeItem {
  id: number;
  name: string;
  code: string;
  description?: string;
  maxDays: number;
  requiresAttachment: boolean;
  isActive: boolean;
}

export interface LeaveBalanceItem {
  id: number;
  name: string;
  code: string;
  description?: string;
  maxDays: number;
  usedDays: number;
  remainingDays: number;
  requiresAttachment: boolean;
}

export interface LeaveApplicationItem {
  id: number;
  userId: number;
  applicantName: string;
  applicantRole: string;
  department?: string;
  school?: string;
  leaveTypeId: number;
  fromDate: string;
  toDate: string;
  totalDays: number;
  reason: string;
  attachmentUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  hodStatus: 'pending' | 'approved' | 'rejected';
  deanStatus: 'pending' | 'approved' | 'rejected';
  hodApprovedBy?: number;
  hodApprovedAt?: string;
  hodComments?: string;
  deanApprovedBy?: number;
  deanApprovedAt?: string;
  deanComments?: string;
  createdAt: string;
  leaveType?: LeaveTypeItem;
  applicant?: { id: number; username: string; role: string };
}

export const getLeaveTypes = async (): Promise<{ success: boolean; leaveTypes: LeaveTypeItem[] }> => {
  const response = await api.get('/leaves/types');
  return response.data;
};

export const createLeaveType = async (payload: {
  name: string;
  code: string;
  description?: string;
  maxDays: number;
  requiresAttachment?: boolean;
}) => {
  const response = await api.post('/leaves/types', payload);
  return response.data;
};

export const updateLeaveType = async (id: number, payload: any) => {
  const response = await api.put(`/leaves/types/${id}`, payload);
  return response.data;
};

export const deleteLeaveType = async (id: number) => {
  const response = await api.delete(`/leaves/types/${id}`);
  return response.data;
};

export const getMyLeaves = async (): Promise<{ success: boolean; leaves: LeaveApplicationItem[] }> => {
  const response = await api.get('/leaves/my');
  return response.data;
};

export const getMyLeaveBalances = async (): Promise<{ success: boolean; balances: LeaveBalanceItem[] }> => {
  const response = await api.get('/leaves/my/balance');
  return response.data;
};

export const applyLeave = async (payload: {
  leaveTypeId: number;
  fromDate: string;
  toDate: string;
  reason: string;
  attachmentUrl?: string;
  department?: string;
  school?: string;
}) => {
  const response = await api.post('/leaves/apply', payload);
  return response.data;
};

export const getPendingLeaves = async (): Promise<{ success: boolean; leaves: LeaveApplicationItem[] }> => {
  const response = await api.get('/leaves/pending');
  return response.data;
};

export const updateLeaveStatus = async (
  leaveId: number,
  payload: {
    status: 'approved' | 'rejected';
    comments?: string;
  }
) => {
  const response = await api.put(`/leaves/${leaveId}/status`, payload);
  return response.data;
};
