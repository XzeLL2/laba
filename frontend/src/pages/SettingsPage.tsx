import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export function SettingsPage() {
  const { user } = useAuth()
  const [ipSubnets, setIpSubnets] = useState('192.168.0.0/16, 10.0.0.0/8, 172.16.0.0/12')

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Настройки</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Информация о сервере</h3>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Версия</dt>
              <dd className="mt-1 text-sm text-gray-900">1.0.0</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Текущий пользователь</dt>
              <dd className="mt-1 text-sm text-gray-900">{user?.full_name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Роль</dt>
              <dd className="mt-1 text-sm text-gray-900">{user?.role}</dd>
            </div>
          </dl>
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Сетевые настройки</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700">Разрешённые подсети</label>
            <textarea
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={ipSubnets}
              onChange={(e) => setIpSubnets(e.target.value)}
            />
            <p className="mt-2 text-sm text-gray-500">
              IP-адреса из этих подсетей смогут подключаться к серверу.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
