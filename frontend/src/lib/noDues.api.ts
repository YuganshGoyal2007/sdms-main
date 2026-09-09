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
  isLocked?: boolean;
  computedStatus?: 'pending' | 'approved' | 'rejected' | 'locked';
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
  workflow?: {
    top: NoDuesStageItem[];
    parallel: NoDuesStageItem[];
    bottom: NoDuesStageItem[];
  };
  progressPercentage: number;
  stats?: {
    total: number;
    approved: number;
    pending: number;
    locked: number;
    rejected: number;
  };
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

export interface OfficeConfig {
  code: string;
  slug: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  checklists: string[];
  quickRemarks: string[];
  stats?: OfficeStats;
}

export interface OfficeStats {
  total: number;
  pending: number;
  ready: number;
  approved: number;
  rejected: number;
  totalDues: number;
}

export interface OfficeQueueItem {
  id: number;
  applicationId: number;
  stageCode: string;
  stageName: string;
  status: 'pending' | 'approved' | 'rejected';
  duesAmount: number;
  comments?: string;
  sequenceOrder: number;
  verifiedBy?: number;
  verifiedByName?: string;
  verifiedAt?: string;
  createdAt?: string;
  isReady: boolean;
  isLocked: boolean;
  application: {
    id: number;
    displayId: string;
    rollNo?: string;
    status: string;
    currentStageOrder: number;
    isCompleted: boolean;
    studentRemarks?: string;
    remarks?: string;
    proofDocumentUrl?: string;
    student?: {
      id: number;
      rollNo: string;
      enrollmentNo: string;
      fullName: string;
      school: string;
      department: string;
      program: string;
      batch: string;
      specialization: string;
      mobile?: string;
      email?: string;
      hosteller?: string | boolean;
      photo?: string;
    };
  } | null;
}

export interface OfficePortalResponse {
  success: boolean;
  office: OfficeConfig;
  stats: OfficeStats;
  queue: OfficeQueueItem[];
  history: OfficeQueueItem[];
}

export interface AllOfficesOverviewResponse {
  success: boolean;
  offices: (OfficeConfig & { stats: OfficeStats })[];
}

export const getAllOfficesOverview = async (): Promise<AllOfficesOverviewResponse> => {
  const response = await api.get('/no-dues/portals/overview');
  return response.data;
};

export const getOfficePortalData = async (officeCode: string): Promise<OfficePortalResponse> => {
  const response = await api.get(`/no-dues/portal/${officeCode}`);
  return response.data;
};

export const actionOfficeClearance = async (
  officeCode: string,
  stageId: number,
  payload: {
    action: 'approve' | 'reject';
    comments?: string;
    duesAmount?: number;
  }
) => {
  const response = await api.post(`/no-dues/portal/${officeCode}/action/${stageId}`, payload);
  return response.data;
};

export const bulkApproveOfficeClearance = async (
  officeCode: string,
  stageIds: number[]
) => {
  const response = await api.post(`/no-dues/portal/${officeCode}/bulk-approve`, { stageIds });
  return response.data;
};
