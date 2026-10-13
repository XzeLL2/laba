import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export interface LoginRequest {
  login: string
  password: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
}

export interface User {
  id: number
  login: string
  full_name: string
  position?: string
  role: string
  is_active: boolean
  created_at: string
}

export interface Customer {
  id: number
  name: string
  contact_person?: string
  contact_phone?: string
  contact_email?: string
  address?: string
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CustomerCreate {
  name: string
  contact_person?: string
  contact_phone?: string
  contact_email?: string
  address?: string
  notes?: string
}

export interface Order {
  id: number
  number: string
  customer_id: number
  contact_person?: string
  external_number?: string
  external_date?: string
  object_name: string
  sample_count: number
  address?: string
  payer?: string
  planned_date?: string
  notes?: string
  status: string
  author_id: number
  created_at: string
  updated_at: string
  customer: Customer
}

export interface OrderCreate {
  customer_id: number
  contact_person?: string
  external_number?: string
  external_date?: string
  object_name: string
  sample_count?: number
  address?: string
  payer?: string
  planned_date?: string
  notes?: string
}

export interface OrderUpdate extends Partial<OrderCreate> {
  status?: string
}

export interface Protocol {
  id: number
  number: string
  order_id: number
  status: string
  snapshot?: string
  result?: string
  method_ids: number[]
  author_id: number
  created_at: string
  updated_at: string
  methods: Method[]
}

export interface ProtocolCreate {
  order_id?: number
  method_ids?: number[]
  result?: string
}

export interface ProtocolUpdate {
  status?: string
  method_ids?: number[]
  result?: string
}

export interface Method {
  id: number
  code: string
  name: string
  version: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MethodCreate {
  code: string
  name: string
  version: string
  description?: string
}

export interface Equipment {
  id: number
  name: string
  type?: string
  serial_number?: string
  calibration_date?: string
  next_calibration?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EquipmentCreate {
  name: string
  type?: string
  serial_number?: string
  calibration_date?: string
  next_calibration?: string
}

export interface Attachment {
  id: number
  file_name: string
  file_path: string
  file_size: number
  checksum: string
  mime_type?: string
  entity_type: string
  entity_id: number
  uploaded_at: string
  uploader_id: number
}

export interface Employee {
  id: number
  login: string
  full_name: string
  position?: string
  role: string
  is_active: boolean
  created_at: string
}

export interface EmployeeCreate {
  login: string
  full_name: string
  position?: string
  role: string
  password: string
}

export interface EmployeeUpdate {
  full_name?: string
  position?: string
  role?: string
  is_active?: boolean
  password?: string
}

export const ordersApi = {
  list: (params?: { q?: string; customer?: string; object_name?: string; status?: string; date_from?: string; date_to?: string }) =>
    api.get<Order[]>('/orders/', { params }),
  get: (id: number) => api.get<Order>(`/orders/${id}`),
  create: (data: OrderCreate) => api.post<Order>('/orders/', data),
  update: (id: number, data: OrderUpdate) => api.patch<Order>(`/orders/${id}`, data),
  delete: (id: number) => api.delete(`/orders/${id}`),
}

export const protocolsApi = {
  list: () => api.get<Protocol[]>('/protocols/'),
  get: (id: number) => api.get<Protocol>(`/protocols/${id}`),
  createFromOrder: (orderId: number, data: ProtocolCreate) => api.post<Protocol>(`/protocols/from-order/${orderId}`, data),
  update: (id: number, data: ProtocolUpdate) => api.patch<Protocol>(`/protocols/${id}`, data),
  sync: (id: number) => api.post<Protocol>(`/protocols/${id}/sync`),
  delete: (id: number) => api.delete(`/protocols/${id}`),
}

export const customersApi = {
  list: (q?: string) => api.get<Customer[]>('/customers/', { params: { q } }),
  create: (data: CustomerCreate) => api.post<Customer>('/customers/', data),
  update: (id: number, data: Partial<CustomerCreate>) => api.patch<Customer>(`/customers/${id}`, data),
  delete: (id: number) => api.delete(`/customers/${id}`),
}

export const methodsApi = {
  list: (q?: string) => api.get<Method[]>('/methods/', { params: { q } }),
  create: (data: MethodCreate) => api.post<Method>('/methods/', data),
  update: (id: number, data: Partial<MethodCreate>) => api.patch<Method>(`/methods/${id}`, data),
  delete: (id: number) => api.delete(`/methods/${id}`),
}

export const equipmentApi = {
  list: (q?: string) => api.get<Equipment[]>('/equipment/', { params: { q } }),
  create: (data: EquipmentCreate) => api.post<Equipment>('/equipment/', data),
  update: (id: number, data: Partial<EquipmentCreate>) => api.patch<Equipment>(`/equipment/${id}`, data),
  delete: (id: number) => api.delete(`/equipment/${id}`),
}

export const attachmentsApi = {
  list: (entityType: string, entityId: number) => api.get<Attachment[]>(`/attachments/${entityType}/${entityId}`),
  upload: (entityType: string, entityId: number, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<Attachment>(`/attachments/${entityType}/${entityId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  download: (entityType: string, entityId: number, attachmentId: number) =>
    api.get(`/attachments/${entityType}/${entityId}/${attachmentId}/download`, { responseType: 'blob' }),
  delete: (entityType: string, entityId: number, attachmentId: number) =>
    api.delete(`/attachments/${entityType}/${entityId}/${attachmentId}`),
}

export const employeesApi = {
  list: (q?: string) => api.get<Employee[]>('/auth/employees', { params: { q } }),
  create: (data: EmployeeCreate) => api.post<Employee>('/auth/employees', data),
  update: (id: number, data: EmployeeUpdate) => api.patch<Employee>(`/auth/employees/${id}`, data),
  delete: (id: number) => api.delete(`/auth/employees/${id}`),
}

export const authApi = {
  login: (data: LoginRequest) => api.post<AuthResponse>('/auth/login', data),
  me: () => api.get<User>('/auth/me'),
}