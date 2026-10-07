import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'

interface Sample {
  id: number
  number: string
  name: string
  description?: string
  batch?: string
  application_id: number
  created_at: string
  updated_at: string
}

export function SamplesPage() {
  const { user } = useAuth()
  const [samples, setSamples] = useState<Sample[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSamples()
  }, [])

  const loadSamples = async () => {
    try {
      const { data } = await api.get('/samples/')
      setSamples(data)
    } catch (error) {
      console.error('Ошибка загрузки образцов:', error)
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Образцы</h1>
      <div className="bg-white shadow rounded-lg">
        <ul className="divide-y divide-gray-200">
          {samples.map((sample) => (
            <li key={sample.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">{sample.number}</p>
                  <p className="text-sm text-gray-900">{sample.name}</p>
                  {sample.batch && (
                    <p className="text-sm text-gray-500">Партия: {sample.batch}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    Заявка: {sample.application_id}
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
