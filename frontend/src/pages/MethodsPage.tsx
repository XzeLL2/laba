import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'

interface Method {
  id: number
  code: string
  name: string
  version: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export function MethodsPage() {
  const { user } = useAuth()
  const [methods, setMethods] = useState<Method[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMethods()
  }, [])

  const loadMethods = async () => {
    try {
      const { data } = await api.get('/methods/')
      setMethods(data)
    } catch (error) {
      console.error('Ошибка загрузки методик:', error)
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Методики</h1>
      <div className="bg-white shadow rounded-lg">
        <ul className="divide-y divide-gray-200">
          {methods.map((method) => (
            <li key={method.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">{method.code}</p>
                  <p className="text-sm text-gray-900">{method.name}</p>
                  <p className="text-sm text-gray-500">Версия: {method.version}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    method.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {method.is_active ? 'Активна' : 'Неактивна'}
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
