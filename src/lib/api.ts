// API client for the Stock Advisory CRM backend (Express + MongoDB).
// Replaces the former Supabase browser client. All data access goes through
// the backend at VITE_API_URL (defaults to "/api", proxied to the server in dev).

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'crm_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

type QueryValue = string | number | boolean | undefined | null;

function buildQuery(params?: Record<string, QueryValue>): string {
  if (!params) return '';
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      usp.append(key, String(value));
    }
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
}

async function request<T>(
  method: string,
  path: string,
  options: { body?: unknown; query?: Record<string, QueryValue> } = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}${buildQuery(options.query)}`, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  let payload: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!res.ok) {
    const message =
      (payload && typeof payload === 'object' && 'error' in payload
        ? (payload as { error: string }).error
        : null) || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return payload as T;
}

// ---------------------------------------------------------------------------
// Shared types (previously exported from lib/supabase.ts)
// ---------------------------------------------------------------------------

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'boss' | 'employee';
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Client = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  current_handler_id?: string;
  current_handler?: Profile;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
};

export type ClientHandlerHistory = {
  id: string;
  client_id: string;
  previous_handler_id?: string;
  previous_handler?: Profile;
  new_handler_id?: string;
  new_handler?: Profile;
  change_date: string;
  commission_percentage_previous: number;
  commission_percentage_new: number;
  notes: string;
};

export type Payment = {
  id: string;
  client_id: string;
  client?: Client;
  amount: number;
  received_amount: number;
  payment_date: string;
  payment_method: string;
  handler_id?: string;
  handler?: Profile;
  commission_calculated: boolean;
  notes: string;
  created_at: string;
};

export type MonthlyTarget = {
  id: string;
  role: 'employee' | 'boss';
  target_amount: number;
  month: number;
  year: number;
  created_at: string;
};

export type CommissionEarning = {
  id: string;
  user_id: string;
  user?: Profile;
  payment_id: string;
  payment?: Payment;
  commission_amount: number;
  commission_type: 'primary' | 'secondary';
  month: number;
  year: number;
  created_at: string;
};

export type MonthlyDataArchive = {
  id: string;
  user_id?: string;
  user?: Profile;
  month: number;
  year: number;
  total_earnings: number;
  total_payments: number;
  total_clients: number;
  target_achieved: boolean;
  data: Record<string, unknown>;
  created_at: string;
};

export type CommissionSetting = {
  id: string;
  setting_name: string;
  setting_value: number;
  description: string;
  updated_at: string;
};

export type AuthResponse = { token: string; profile: Profile };

// ---------------------------------------------------------------------------
// API surface
// ---------------------------------------------------------------------------

export const api = {
  auth: {
    signup: (data: { email: string; password: string; full_name: string }) =>
      request<AuthResponse>('POST', '/auth/signup', { body: data }),
    login: (data: { email: string; password: string }) =>
      request<AuthResponse>('POST', '/auth/login', { body: data }),
    me: () => request<{ profile: Profile }>('GET', '/auth/me').then((r) => r.profile),
  },

  profiles: {
    list: (activeOnly = false) =>
      request<Profile[]>('GET', '/profiles', { query: { active: activeOnly ? 1 : undefined } }),
    update: (id: string, updates: Partial<Pick<Profile, 'role' | 'is_active' | 'full_name'>>) =>
      request<Profile>('PATCH', `/profiles/${id}`, { body: updates }),
  },

  clients: {
    list: () => request<Client[]>('GET', '/clients'),
    create: (data: Partial<Client>) => request<Client>('POST', '/clients', { body: data }),
    update: (id: string, data: Partial<Client>) =>
      request<Client>('PATCH', `/clients/${id}`, { body: data }),
    remove: (id: string) => request<{ success: boolean }>('DELETE', `/clients/${id}`),
    history: (id: string) => request<ClientHandlerHistory[]>('GET', `/clients/${id}/history`),
    payments: (id: string) => request<Payment[]>('GET', `/clients/${id}/payments`),
    transfer: (id: string, newHandlerId: string | null) =>
      request<Client>('POST', `/clients/${id}/transfer`, { body: { new_handler_id: newHandlerId } }),
  },

  payments: {
    list: () => request<Payment[]>('GET', '/payments'),
    create: (data: {
      client_id: string;
      amount: number;
      payment_date: string;
      payment_method: string;
      notes?: string;
    }) => request<Payment>('POST', '/payments', { body: data }),
  },

  targets: {
    list: (month: number, year: number) =>
      request<MonthlyTarget[]>('GET', '/targets', { query: { month, year } }),
    upsert: (data: { role: 'employee' | 'boss'; target_amount: number; month: number; year: number }) =>
      request<MonthlyTarget>('PUT', '/targets', { body: data }),
  },

  settings: {
    list: () => request<CommissionSetting[]>('GET', '/settings'),
    update: (name: string, value: number) =>
      request<CommissionSetting>('PATCH', `/settings/${name}`, { body: { setting_value: value } }),
  },

  earnings: {
    list: (params: { userId?: string; month?: number; year?: number }) =>
      request<CommissionEarning[]>('GET', '/earnings', { query: params }),
  },

  archives: {
    list: () => request<MonthlyDataArchive[]>('GET', '/archives'),
  },

  admin: {
    monthlyReset: () =>
      request<{ success: boolean; archived_users: number }>('POST', '/admin/monthly-reset'),
  },
};
