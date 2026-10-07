import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { Upload, Download, Trash2, FileText } from 'lucide-react'

interface ServerFile {
  id: number
  file_name: string
  file_size: number
  mime_type?: string
  uploaded_at: string
  uploader_id: number
  can_download: boolean
  can_upload: boolean
}

export function FilesPage() {
  const { user } = useAuth()
  const [files, setFiles] = useState<ServerFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    try {
      const { data } = await api.get('/files/')
      setFiles(data)
    } catch (error) {
      console.error('Ошибка загрузки файлов:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('can_download', 'true')
      formData.append('can_upload', 'false')
      const { data } = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setFiles([data, ...files])
    } catch (error) {
      console.error('Ошибка загрузки:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (fileId: number) => {
    try {
      const response = await api.get(`/files/${fileId}/download`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', files.find(f => f.id === fileId)?.file_name || 'file')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Ошибка скачивания:', error)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Файлы на сервере</h1>
        <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 cursor-pointer">
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? 'Загрузка...' : 'Загрузить'}
          <input
            type="file"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      <div className="bg-white shadow rounded-lg">
        {files.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">Файлы не найдены</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {files.map((file) => (
              <li key={file.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-gray-400 mr-4" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.file_name}</p>
                      <p className="text-sm text-gray-500">
                        {formatSize(file.file_size)} • {file.mime_type || 'неизвестный тип'}
                      </p>
                      <p className="text-xs text-gray-400">
                        Загружен: {new Date(file.uploaded_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {file.can_download && (
                      <button
                        onClick={() => handleDownload(file.id)}
                        className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                        title="Скачать"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    )}
                    {user?.role === 'admin' && (
                      <button
                        onClick={() => {}}
                        className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700"
                        title="Удалить"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
