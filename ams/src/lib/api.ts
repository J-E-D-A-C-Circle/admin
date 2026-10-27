export interface User {
  userId: number;
  username: string;
  name: string;
  email: string;
  role: string;
  regionId: number | null;
  stationId: number | null;
}

const BASE_URL = '/api';

function getHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('dams_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('dams_token');
      localStorage.removeItem('dams_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      }
    }
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.message || `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  async login(payload: any): Promise<{ token: string; userId: number; username: string; name: string; email: string; role: string; regionId: number | null; stationId: number | null }> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async getUsers(): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/auth/users`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async register(payload: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  // Lookups
  async getLookups(): Promise<any> {
    const res = await fetch(`${BASE_URL}/lookup`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async getLookup(type: string, params?: Record<string, string>): Promise<any[]> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(`${BASE_URL}/lookup${query}${query ? '&' : '?'}type=${type}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  // Assets
  async getAssets(params?: any): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const cleanParams: Record<string, string> = {};
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          cleanParams[key] = String(params[key]);
        }
      });
    }
    const query = new URLSearchParams(cleanParams).toString();
    const res = await fetch(`${BASE_URL}/assets${query ? '?' + query : ''}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async getAsset(id: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/assets/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async getAssetHistory(id: string): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/assets/${id}/history`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async createAsset(payload: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/assets`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async updateAsset(id: string, payload: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/assets/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async batchEditAssets(payload: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/assets/bulk`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async deleteAsset(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${BASE_URL}/assets/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },


  async getDashboard(): Promise<any> {
    const res = await fetch(`${BASE_URL}/assets/dashboard`, { headers: getHeaders() });
    return handleResponse(res);
  },

  // Transfers
  async getTransfers(params?: { page?: number; limit?: number; search?: string }): Promise<{ data: any[]; total: number }> {
    const cleanParams: Record<string, string> = {};
    if (params) {
      Object.keys(params).forEach(key => {
        if ((params as any)[key] !== undefined && (params as any)[key] !== null && (params as any)[key] !== '') {
          cleanParams[key] = String((params as any)[key]);
        }
      });
    }
    const query = new URLSearchParams(cleanParams).toString();
    const res = await fetch(`${BASE_URL}/transfers${query ? '?' + query : ''}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async transferAsset(data: any) {
    const res = await fetch(`${BASE_URL}/transfers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async bulkTransferAssets(data: any) {
    const res = await fetch(`${BASE_URL}/transfers/bulk`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async approveTransfer(id: number, signatureDataUrl: string) {
    const res = await fetch(`${BASE_URL}/transfers/${id}/approve`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ signatureDataUrl }),
    });
    return handleResponse(res);
  },

  // Upload
  async uploadFile(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    // Custom fetch because we don't want Content-Type: application/json for FormData
    const token = typeof window !== 'undefined' ? localStorage.getItem('dams_token') : null;
    const res = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    return handleResponse(res);
  },

  // Verifications
  async getVerifications(params?: { page?: number; limit?: number; search?: string }): Promise<{ data: any[]; total: number }> {
    const cleanParams: Record<string, string> = {};
    if (params) {
      Object.keys(params).forEach(key => {
        if ((params as any)[key] !== undefined && (params as any)[key] !== null && (params as any)[key] !== '') {
          cleanParams[key] = String((params as any)[key]);
        }
      });
    }
    const query = new URLSearchParams(cleanParams).toString();
    const res = await fetch(`${BASE_URL}/verifications${query ? '?' + query : ''}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async getVerificationStats(): Promise<{ total: number; verified: number; missing: number; damaged: number }> {
    const res = await fetch(`${BASE_URL}/verifications/stats`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async bulkCreateVerifications(payload: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/verifications/bulk`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async createVerification(payload: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/verifications`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async createEmployee(payload: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/employees`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  // Reports
  async getInventoryReport(): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/reports/inventory`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async getMovementReport(): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/reports/movement`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async getMissingReport(): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/reports/missing`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async getDamagedReport(): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/reports/damaged`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async getVerificationReport(): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/reports/verification`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async getExecutiveSummary(): Promise<any> {
    const res = await fetch(`${BASE_URL}/reports/executive`, { headers: getHeaders() });
    return handleResponse(res);
  },

  // Unified report fetcher used by the Reports page
  async getReport(type: string, params?: Record<string, string>): Promise<any> {
    const query = params ? new URLSearchParams(params).toString() : '';
    const res = await fetch(`${BASE_URL}/reports/${type}${query ? '?' + query : ''}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  // Register user (admin only)
  async registerUser(payload: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  // Bulk import
  async importAssets(payload: { items: any[] }): Promise<{ message: string; count: number }> {
    const res = await fetch(`${BASE_URL}/assets/import`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  // Audit Logs
  async getAuditLogs(params?: { search?: string; page?: number; limit?: number }): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const cleanParams: Record<string, string> = {};
    if (params) {
      Object.keys(params).forEach(key => {
        if ((params as any)[key] !== undefined && (params as any)[key] !== null && (params as any)[key] !== '') {
          cleanParams[key] = String((params as any)[key]);
        }
      });
    }
    const query = new URLSearchParams(cleanParams).toString();
    const res = await fetch(`${BASE_URL}/reports/audit-logs${query ? '?' + query : ''}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  // Notifications
  async getNotifications(): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/reports/notifications`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async markNotificationRead(id: number): Promise<{ success: boolean }> {
    const res = await fetch(`${BASE_URL}/reports/notifications/${id}/read`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Lookup Management
  async createLookup(type: string, payload: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/lookup/manage`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ type, payload }),
    });
    return handleResponse(res);
  },

  async updateLookup(type: string, id: number, payload: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/lookup/manage`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ type, id, payload }),
    });
    return handleResponse(res);
  },

  async deleteLookup(type: string, id: number): Promise<any> {
    const res = await fetch(`${BASE_URL}/lookup/manage?type=${type}&id=${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Disposal
  async disposeAsset(id: string, payload: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/assets/${id}/dispose`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  // Maintenance
  async getAssetMaintenance(id: string): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/assets/${id}/maintenance`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async createAssetMaintenance(id: string, payload: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/assets/${id}/maintenance`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  // Verifications Due
  async getDueVerifications(): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/verifications/due`, { headers: getHeaders() });
    return handleResponse(res);
  },

  // Activity Leaderboard
  async getActivityLeaderboard(): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/reports/activity`, { headers: getHeaders() });
    return handleResponse(res);
  },
};
