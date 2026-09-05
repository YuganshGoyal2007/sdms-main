import api from './api';

export interface NoDuesStageItem {
  id: number;
  applicationId: number;
  stageCode: string;
  stageName: string;
  verifierRole: string;
  status: 'pending' | 'approved' | 'rejected';
  duesAmount: number;
  comments?: string;
  sequenceOrder: number;
  verifiedBy?: number;
  verifiedByName?: string;
  verifiedAt?: string;
}

export interface NoDuesApplicationItem {
  id: number;
  displayId: string;
  studentId: number;
  rollNo: string;
  school: string;
  department: string;
  program: string;
  batch: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  currentStageOrder: number;
  isCompleted: boolean;
  remarks?: string;
  studentRemarks?: string;
  proofDocumentUrl?: string;
  certificateNumber?: string;
  certificateIssuedAt?: string;
  stages?: NoDuesStageItem[];
}

export interface MyNoDuesResponse {
  success: boolean;
  hasApplication: boolean;
  student: any;
  hasOutstandingFees: boolean;
  application: NoDuesApplicationItem | null;
  stages: NoDuesStageItem[];
  progressPercentage: number;
  canResubmit?: boolean;
}

export const getMyNoDues = async (): Promise<MyNoDuesResponse> => {
  const response = await api.get('/no-dues/my');
  return response.data;
};

export const applyNoDues = async (payload: {
  reason?: string;
  studentRemarks?: string;
  proofDocumentUrl?: string;
  isHosteller?: boolean;
}) => {
  const response = await api.post('/no-dues/apply', payload);
  return response.data;
};

export const resubmitNoDues = async (payload: {
  studentRemarks?: string;
  proofDocumentUrl?: string;
}) => {
  const response = await api.post('/no-dues/resubmit', payload);
  return response.data;
};

export const getPendingClearances = async () => {
  const response = await api.get('/no-dues/pending');
  return response.data;
};

export const actionClearanceStage = async (
  stageId: number,
  payload: {
    action: 'approve' | 'reject';
    comments?: string;
    duesAmount?: number;
  }
) => {
  const response = await api.post(`/no-dues/stages/${stageId}/action`, payload);
  return response.data;
};

export const getClearanceCertificate = async (applicationId: number) => {
  const response = await api.get(`/no-dues/certificate/${applicationId}`);
  return response.data;
};
