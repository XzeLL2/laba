import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'

interface Protocol {
  id: number
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
  method?: { name: string }
  equipment?: { name: string }
}

export function ProtocolsPage() {
  const { user } = useAuth()
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProtocols()
  }, [])

  const loadProtocols = async () => {
    try {
      const { data } = await api.get('/protocols/')
      setProtocols(data)
    } catch (error) {
      console.error('Ошибка загрузки протоколов:', error)
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Протоколы</h1>
      <div className="bg-white shadow rounded-lg">
        <ul className="divide-y divide-gray-200">
          {protocols.map((protocol) => (
            <li key={protocol.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">{protocol.number}</p>
                  <p className="text-sm text-gray-900">
                    {protocol.method?.name || `Методика ${protocol.method_id}`}
                  </p>
                  <p className="text-sm text-gray-500">
                    {protocol.equipment?.name || `Оборудование ${protocol.equipment_id}`}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    {protocol.status}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(protocol.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
