import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { equipmentApi, type Equipment, type EquipmentCreate } from '../lib/api'
import { Plus, Search, Edit, Trash2 } from 'lucide-react'

export function EquipmentPage() {
  const { user } = useAuth()
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<EquipmentCreate>({
    name: '',
    type: '',
    serial_number: '',
    calibration_date: '',
    next_calibration: '',
  })
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadEquipment()
  }, [search])

  const loadEquipment = async () => {
    try {
      const { data } = await equipmentApi.list(search)
      setEquipments(data)
    } catch (error) {
      console.error('Ошибка загрузки оборудования:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        await equipmentApi.update(editingId, formData)
      } else {
        await equipmentApi.create(formData)
      }
      loadEquipment()
      setShowForm(false)
      setEditingId(null)
      setFormData({ name: '', type: '', serial_number: '', calibration_date: '', next_calibration: '' })
    } catch (error) {
      console.error('Ошибка сохранения:', error)
    }
  }

  const handleEdit = (eq: Equipment) => {
    setEditingId(eq.id)
    setFormData({
      name: eq.name,
      type: eq.type || '',
      serial_number: eq.serial_number || '',
      calibration_date: eq.calibration_date ? eq.calibration_date.split('T')[0] : '',
      next_calibration: eq.next_calibration ? eq.next_calibration.split('T')[0] : '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить оборудование?')) return
    try {
      await equipmentApi.delete(id)
      loadEquipment()
    } catch (error) {
      console.error('Ошибка удаления:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Оборудование</h1>
        <button
          onClick={() => { setEditingId(null); setFormData({ name: '', type: '', serial_number: '', calibration_date: '', next_calibration: '' }); setShowForm(true) }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Добавить
        </button>
      </div>

      <div className="bg-white shadow rounded-lg mb-6">
        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Поиск по названию, типу или серийному номеру..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {showForm && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">{editingId ? 'Редактировать' : 'Новое'} оборудование</h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-gray-700">Название *</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Тип</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Серийный номер</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Дата последней поверки</label>
                <input
                  type="date"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={formData.calibration_date}
                  onChange={(e) => setFormData({ ...formData, calibration_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Дата следующей поверки</label>
                <input
                  type="date"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={formData.next_calibration}
                  onChange={(e) => setFormData({ ...formData, next_calibration: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                {editingId ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <ul className="divide-y divide-gray-200">
          {equipments.map((eq) => (
            <li key={eq.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{eq.name}</p>
                  <p className="text-sm text-gray-500">
                    {eq.type && `${eq.type} • `}
                    {eq.serial_number ? `SN: ${eq.serial_number}` : '—'}
                  </p>
                  {eq.calibration_date && (
                    <p className="text-xs text-gray-400">
                      Последняя поверка: {new Date(eq.calibration_date).toLocaleDateString()}
                      {eq.next_calibration && ` • Следующая: ${new Date(eq.next_calibration).toLocaleDateString()}`}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${eq.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {eq.is_active ? 'Активно' : 'Неактивно'}
                  </span>
                  <button
                    onClick={() => handleEdit(eq)}
                    className="inline-flex items-center p-2 text-gray-500 hover:text-gray-700"
                    title="Редактировать"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(eq.id)}
                    className="inline-flex items-center p-2 text-red-500 hover:text-red-700"
                    title="Удалить"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {equipments.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-gray-500">Оборудование не найдено</p>
            <button
              onClick={() => { setEditingId(null); setShowForm(true) }}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Добавить оборудование
            </button>
          </div>
        )}
      </div>
    </div>
  )
}