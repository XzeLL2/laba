import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { protocolsApi, ordersApi, methodsApi, attachmentsApi, type Protocol, type Method } from '../lib/api'
import { ArrowLeft, Paperclip, Download, Trash2, FileText, RefreshCw, ChevronDown, ChevronUp, Save, Plus } from 'lucide-react'

export function ProtocolDetailPage() {
  const { user } = useAuth()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [protocol, setProtocol] = useState<Protocol | null>(null)
  const [order, setOrder] = useState<any>(null)
  const [methods, setMethods] = useState<Method[]>([])
  const [loading, setLoading] = useState(true)
  const [showAttachments, setShowAttachments] = useState(false)
  const [attachments, setAttachments] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [editingSnapshot, setEditingSnapshot] = useState(false)
  const [snapshotData, setSnapshotData] = useState<any>(null)

  useEffect(() => {
    if (id) {
      loadProtocol()
      loadMethods()
    }
  }, [id])

  const loadProtocol = async () => {
    try {
      const { data } = await protocolsApi.get(parseInt(id!))
      setProtocol(data)
      loadOrder(data.order_id)
      loadAttachments()
    } catch (error) {
      console.error('Ошибка загрузки протокола:', error)
      navigate('/protocols')
    } finally {
      setLoading(false)
    }
  }

  const loadOrder = async (orderId: number) => {
    try {
      const { data } = await ordersApi.get(orderId)
      setOrder(data)
      if (data) {
        setSnapshotData({
          customer_id: data.customer_id,
          contact_person: data.contact_person,
          external_number: data.external_number,
          external_date: data.external_date,
          object_name: data.object_name,
          sample_count: data.sample_count,
          address: data.address,
          payer: data.payer,
          planned_date: data.planned_date,
          notes: data.notes,
        })
      }
    } catch (error) {
      console.error('Ошибка загрузки заявки:', error)
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

  const loadAttachments = async () => {
    try {
      const { data } = await attachmentsApi.list('protocol', parseInt(id!))
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
      await attachmentsApi.upload('protocol', parseInt(id!), file)
      loadAttachments()
    } catch (error) {
      console.error('Ошибка загрузки:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (attachmentId: number) => {
    try {
      const response = await attachmentsApi.download('protocol', parseInt(id!), attachmentId)
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
      await attachmentsApi.delete('protocol', parseInt(id!), attachmentId)
      loadAttachments()
    } catch (error) {
      console.error('Ошибка удаления:', error)
    }
  }

  const handleUpdateProtocol = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!protocol) return
    try {
      const { data } = await protocolsApi.update(protocol.id, {
        status: protocol.status,
        method_ids: protocol.method_ids,
        result: protocol.result,
      })
      setProtocol(data)
    } catch (error) {
      console.error('Ошибка обновления:', error)
    }
  }

  const handleSync = async () => {
    try {
      const { data } = await protocolsApi.sync(protocol!.id)
      setProtocol(data)
    } catch (error) {
      console.error('Ошибка синхронизации:', error)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const getStatusColor = (status: string) => {
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

  if (!protocol) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/protocols')} className="inline-flex items-center text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5 mr-1" />
          Назад к списку
        </button>
        <div className="flex items-center space-x-3">
          <button onClick={() => setShowAttachments(!showAttachments)} className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50">
            <Paperclip className="h-4 w-4 mr-2" />
            Вложения ({attachments.length})
          </button>
          <button onClick={handleSync} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Обновить из заявки
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{protocol.number}</h1>
              <p className="text-sm text-gray-500">Заявка #{protocol.order_id}</p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(protocol.status)}`}>
              {protocol.status === 'draft' ? 'Черновик' : protocol.status === 'approved' ? 'Утвержден' : 'Отклонен'}
            </span>
          </div>
        </div>

        <form onSubmit={handleUpdateProtocol} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Методики</label>
              <div className="flex flex-wrap gap-2">
                {methods.map((m) => (
                  <label key={m.id} className="inline-flex items-center px-3 py-1 border rounded-md text-sm cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      value={m.id}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      checked={protocol.method_ids.includes(m.id)}
                      onChange={(e) => setProtocol({
                        ...protocol!,
                        method_ids: e.target.checked
                          ? [...protocol!.method_ids, m.id]
                          : protocol!.method_ids.filter(id => id !== m.id)
                      })}
                    />
                    <span className="ml-2">{m.code} — {m.name} (v{m.version})</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
              <select
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={protocol.status}
                onChange={(e) => setProtocol({ ...protocol!, status: e.target.value })}
              >
                <option value="draft">Черновик</option>
                <option value="approved">Утвержден</option>
                <option value="rejected">Отклонен</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Результаты испытаний</label>
              <textarea
                rows={6}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={protocol.result || ''}
                onChange={(e) => setProtocol({ ...protocol!, result: e.target.value })}
                placeholder="Результаты испытаний..."
              />
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end space-x-3">
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Сохранить изменения
            </button>
          </div>
        </form>
      </div>

      {showAttachments && (
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Вложения протокола</h2>
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
                id="protocol-attachment-upload"
              />
              <label htmlFor="protocol-attachment-upload" className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
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

      {order && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Снимок заявки (Snapshot)</h2>
            <button
              onClick={() => setEditingSnapshot(!editingSnapshot)}
              className={`inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 ${editingSnapshot ? 'bg-gray-50' : ''}`}
            >
              {editingSnapshot ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
              {editingSnapshot ? 'Свернуть' : 'Развернуть'}
            </button>
          </div>
          {editingSnapshot && (
            <div className="p-6 space-y-4 bg-gray-50 border-t">
              <pre className="bg-white p-4 rounded-md border text-sm overflow-x-auto max-h-96">
                {JSON.stringify(snapshotData || protocol.snapshot, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}