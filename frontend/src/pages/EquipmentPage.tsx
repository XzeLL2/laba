import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'

interface Equipment {
  id: number
  name: string
  type?: string
  serial_number?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export function EquipmentPage() {
  const { user } = useAuth()
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEquipment()
  }, [])

  const loadEquipment = async () => {
    try {
      const { data } = await api.get('/equipment/')
      setEquipment(data)
    } catch (error) {
      console.error('Ошибка загрузки оборудования:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Оборудование</h1>
      <div className="bg-white shadow rounded-lg">
        <ul className="divide-y divide-gray-200">
          {equipment.map((item) => (
            <li key={item.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.type}</p>
                  {item.serial_number && (
                    <p className="text-sm text-gray-500">SN: {item.serial_number}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    item.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {item.is_active ? 'Активно' : 'Неактивно'}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
