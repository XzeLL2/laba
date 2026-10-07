import Dexie, { type EntityTable } from 'dexie'

export interface Application {
  id?: number
  number: string
  date: string
  customer: string
  object_name?: string
  author_id: number
  status: string
  notes?: string
  created_at: string
  updated_at: string
  method_ids?: number[]
}

export interface Sample {
  id?: number
  number: string
  name: string
  description?: string
  batch?: string
  application_id: number
  created_at: string
  updated_at: string
}

export interface Protocol {
  id?: number
  number: string
  date: string
  application_id: number
  method_id: number
  equipment_id: number
  author_id: number
  result?: string
  status: string
  xml_path?: string
  created_at: string
  updated_at: string
}

export interface Method {
  id?: number
  code: string
  name: string
  version: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Equipment {
  id?: number
  name: string
  type?: string
  serial_number?: string
  calibration_date?: string
  next_calibration?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Attachment {
  id?: number
  file_name: string
  file_path: string
  file_size: number
  mime_type?: string
  uploaded_at: string
  author_id: number
  application_id?: number
  protocol_id?: number
  method_id?: number
}

export class LabDatabase extends Dexie {
  applications!: EntityTable<Application, 'id'>
  samples!: EntityTable<Sample, 'id'>
  protocols!: EntityTable<Protocol, 'id'>
  methods!: EntityTable<Method, 'id'>
  equipment!: EntityTable<Equipment, 'id'>
  attachments!: EntityTable<Attachment, 'id'>

  constructor() {
    super('lab-db')
    this.version(1).stores({
      applications: '++id, number, date, customer, author_id, status',
      samples: '++id, number, name, application_id',
      protocols: '++id, number, date, application_id, method_id, equipment_id, author_id, status',
      methods: '++id, code, name, version',
      equipment: '++id, name, type, serial_number',
      attachments: '++id, file_name, application_id, protocol_id, method_id, author_id',
    })
  }
}

export const db = new LabDatabase()
