import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ordersApi, methodsApi, protocolsApi, attachmentsApi, type Order, type Protocol, type Method } from '../lib/api'
import { ArrowLeft, Plus, Download, Trash2, FileText, Save, RefreshCw, Paperclip, ChevronDown, ChevronUp } from 'lucide-react'

export function OrderDetailPage() {
  const { user } = useAuth()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [methods, setMethods] = useState<Method[]>([])
  const [loading, setLoading] = useState(true)
  const [showProtocolForm, setShowProtocolForm] = useState(false)
  const [showAttachments, setShowAttachments] = useState(false)
  const [attachments, setAttachments] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [protocolForm, setProtocolForm] = useState({ method_ids: [] as number[], result: '' })

  useEffect(() => {
    if (id) {
      loadOrder()
      loadMethods()
    }
  }, [id])

  const loadOrder = async () => {
    try {
      const { data } = await ordersApi.get(parseInt(id!))
      setOrder(data)
      loadProtocols()
      loadAttachments()
    } catch (error) {
      console.error('Ошибка загрузки заявки:', error)
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const loadMethods = async () => {
    try {
      const { data } = await methodsApi.list()
      setMethods(data)
    } catch (error) {
      console.error('Ошибка загрузки методик:', error)
    }
  }

  const loadProtocols = async () => {
    try {
      const { data } = await protocolsApi.list()
      setProtocols(data.filter(p => p.order_id === parseInt(id!)))
    } catch (error) {
      console.error('Ошибка загрузки протоколов:', error)
    }
  }

  const loadAttachments = async () => {
    try {
      const { data } = await attachmentsApi.list('order', parseInt(id!))
      setAttachments(data)
    } catch (error) {
      console.error('Ошибка загрузки вложений:', error)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await attachmentsApi.upload('order', parseInt(id!), file)
      loadAttachments()
    } catch (error) {
      console.error('Ошибка загрузки:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (attachmentId: number) => {
    try {
      const response = await attachmentsApi.download('order', parseInt(id!), attachmentId)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      const attachment = attachments.find(a => a.id === attachmentId)
      link.setAttribute('download', attachment?.file_name || 'file')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Ошибка скачивания:', error)
    }
  }

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!confirm('Удалить вложение?')) return
    try {
      await attachmentsApi.delete('order', parseInt(id!), attachmentId)
      loadAttachments()
    } catch (error) {
      console.error('Ошибка удаления:', error)
    }
  }

  const handleCreateProtocol = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data } = await protocolsApi.createFromOrder(parseInt(id!), protocolForm)
      setProtocols([data, ...protocols])
      setShowProtocolForm(false)
      setProtocolForm({ method_ids: [], result: '' })
    } catch (error) {
      console.error('Ошибка создания протокола:', error)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getProtocolStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!order) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/')} className="inline-flex items-center text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5 mr-1" />
          Назад к списку
        </button>
        <div className="flex items-center space-x-3">
          <button onClick={() => setShowAttachments(!showAttachments)} className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50">
            <Paperclip className="h-4 w-4 mr-2" />
            Вложения ({attachments.length})
          </button>
          <button onClick={() => setShowProtocolForm(!showProtocolForm)} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Создать протокол
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{order.number}</h1>
              <p className="text-sm text-gray-500">{order.customer?.name || '—'}</p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
              {order.status === 'new' ? 'Новая' : order.status === 'in_progress' ? 'В работе' : order.status === 'completed' ? 'Завершена' : 'Отменена'}
            </span>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500">Объект испытаний</label>
            <p className="mt-1 text-sm text-gray-900">{order.object_name}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Количество образцов</label>
            <p className="mt-1 text-sm text-gray-900">{order.sample_count}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Контактное лицо</label>
            <p className="mt-1 text-sm text-gray-900">{order.contact_person || order.customer?.contact_person || '—'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Внешний номер / Дата</label>
            <p className="mt-1 text-sm text-gray-900">{order.external_number ? `${order.external_number} от ${formatDate(order.external_date!)}` : '—'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Адрес проведения</label>
            <p className="mt-1 text-sm text-gray-900">{order.address || '—'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Плательщик</label>
            <p className="mt-1 text-sm text-gray-900">{order.payer || order.customer?.name || '—'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Планируемый срок</label>
            <p className="mt-1 text-sm text-gray-900">{order.planned_date ? formatDate(order.planned_date) : '—'}</p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-500">Примечания</label>
            <p className="mt-1 text-sm text-gray-900">{order.notes || '—'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Автор</label>
            <p className="mt-1 text-sm text-gray-900">{user?.full_name}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Создана</label>
            <p className="mt-1 text-sm text-gray-900">{formatDate(order.created_at)}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Обновлена</label>
            <p className="mt-1 text-sm text-gray-900">{formatDate(order.updated_at)}</p>
          </div>
        </div>
      </div>

      {showAttachments && (
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Вложения заявки</h2>
            <button onClick={() => setShowAttachments(false)} className="text-gray-500 hover:text-gray-700">
              <ChevronUp className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6">
            <label className="block mb-4">
              <input
                type="file"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
                id="attachment-upload"
              />
              <label htmlFor="attachment-upload" className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
                <Paperclip className="h-4 w-4 mr-2" />
                {uploading ? 'Загрузка...' : 'Загрузить файл'}
              </label>
            </label>
            {attachments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Вложений нет</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {attachments.map((att) => (
                  <li key={att.id} className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="h-8 w-8 text-gray-400 mr-4" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{att.file_name}</p>
                        <p className="text-xs text-gray-500">
                          {(att.file_size / 1024).toFixed(1)} KB • {att.mime_type || 'неизвестный тип'}
                        </p>
                        <p className="text-xs text-gray-400">
                          Загружен: {formatDate(att.uploaded_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleDownload(att.id)}
                        className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                        title="Скачать"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAttachment(att.id)}
                        className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700"
                        title="Удалить"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {showProtocolForm && (
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Создать протокол</h2>
            <button onClick={() => setShowProtocolForm(false)} className="text-gray-500 hover:text-gray-700">
              <ChevronUp className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleCreateProtocol} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Методики</label>
              <div className="mt-1 flex flex-wrap gap-2">
                {methods.map((m) => (
                  <label key={m.id} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      value={m.id}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      checked={protocolForm.method_ids.includes(m.id)}
                      onChange={(e) => setProtocolForm({
                        ...protocolForm,
                        method_ids: e.target.checked
                          ? [...protocolForm.method_ids, m.id]
                          : protocolForm.method_ids.filter(id => id !== m.id)
                      })}
                    />
                    <span className="ml-2 text-sm text-gray-700">{m.code} — {m.name} (v{m.version})</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Результат (заглушка)</label>
              <textarea
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={protocolForm.result}
                onChange={(e) => setProtocolForm({ ...protocolForm, result: e.target.value })}
                placeholder="Результаты испытаний..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowProtocolForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Создать протокол
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-medium text-gray-900">Протоколы</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {protocols.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">Протоколов нет</p>
            </div>
          ) : (
            protocols.map((protocol) => (
              <div key={protocol.id} className="px-6 py-4 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/protocols/${protocol.id}`)}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">{protocol.number}</p>
                    <p className="text-sm text-gray-500">
                      Методик: {protocol.methods.length} • {formatDate(protocol.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProtocolStatusColor(protocol.status)}`}>
                      {protocol.status === 'draft' ? 'Черновик' : protocol.status === 'approved' ? 'Утвержден' : 'Отклонен'}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/protocols/${protocol.id}`) }}
                      className="text-blue-600 hover:text-blue-900 text-sm"
                    >
                      Открыть
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}