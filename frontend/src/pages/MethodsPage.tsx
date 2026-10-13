import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { methodsApi, type Method, type MethodCreate } from '../lib/api'
import { Plus, Search, Edit, Trash2 } from 'lucide-react'

export function MethodsPage() {
  const { user } = useAuth()
  const [methods, setMethods] = useState<Method[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<MethodCreate>({
    code: '',
    name: '',
    version: '',
    description: '',
  })
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadMethods()
  }, [search])

  const loadMethods = async () => {
    try {
      const { data } = await methodsApi.list(search)
      setMethods(data)
    } catch (error) {
      console.error('Ошибка загрузки методик:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        await methodsApi.update(editingId, formData)
      } else {
        await methodsApi.create(formData)
      }
      loadMethods()
      setShowForm(false)
      setEditingId(null)
      setFormData({ code: '', name: '', version: '', description: '' })
    } catch (error) {
      console.error('Ошибка сохранения:', error)
    }
  }

  const handleEdit = (method: Method) => {
    setEditingId(method.id)
    setFormData({
      code: method.code,
      name: method.name,
      version: method.version,
      description: method.description || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить методику?')) return
    try {
      await methodsApi.delete(id)
      loadMethods()
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
        <h1 className="text-2xl font-bold text-gray-900">Методики</h1>
        <button
          onClick={() => { setEditingId(null); setFormData({ code: '', name: '', version: '', description: '' }); setShowForm(true) }}
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
            placeholder="Поиск по коду или названию..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {showForm && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">{editingId ? 'Редактировать' : 'Новая'} методика</h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-gray-700">Код *</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
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
              <label className="block text-sm font-medium text-gray-700">Версия *</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Описание</label>
              <textarea
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
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
          {methods.map((method) => (
            <li key={method.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">{method.code}</p>
                  <p className="text-sm text-gray-900">{method.name}</p>
                  <p className="text-sm text-gray-500">Версия: {method.version}</p>
                  {method.description && <p className="text-xs text-gray-400 mt-1">{method.description}</p>}
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${method.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {method.is_active ? 'Активна' : 'Неактивна'}
                  </span>
                  <button
                    onClick={() => handleEdit(method)}
                    className="inline-flex items-center p-2 text-gray-500 hover:text-gray-700"
                    title="Редактировать"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(method.id)}
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
        {methods.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-gray-500">Методики не найдены</p>
            <button
              onClick={() => { setEditingId(null); setShowForm(true) }}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Добавить методику
            </button>
          </div>
        )}
      </div>
    </div>
  )
}