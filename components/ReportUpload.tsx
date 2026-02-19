'use client'

import { useState } from 'react'
import { X, Upload, FileSpreadsheet, AlertCircle } from 'lucide-react'
import { reportStorageService } from '@/lib/reportStorage'

interface ReportUploadProps {
  onClose: () => void
  onUploadSuccess: () => void
}

export default function ReportUpload({ onClose, onUploadSuccess }: ReportUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/reports/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      // Save to localStorage
      reportStorageService.saveReports(result.data, result.fileName)
      
      onUploadSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl shadow-2xl max-w-md w-full border border-surface-light">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-light">
          <h2 className="text-xl font-bold text-text-primary">Upload Employee Report</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-surface-light rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* File Input */}
          <div className="border-2 border-dashed border-surface-light rounded-lg p-8 text-center">
            <FileSpreadsheet className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <label className="cursor-pointer">
              <span className="text-primary hover:text-primary/80 font-medium">
                Choose a file
              </span>
              <input
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            <p className="text-text-muted text-sm mt-2">
              or drag and drop
            </p>
            <p className="text-text-muted text-xs mt-1">
              CSV, XLS, or XLSX files
            </p>
          </div>

          {/* Selected File */}
          {file && (
            <div className="flex items-center space-x-3 p-3 bg-surface-light rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-text-primary text-sm font-medium truncate">
                  {file.name}
                </p>
                <p className="text-text-muted text-xs">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start space-x-2 p-3 bg-danger/10 border border-danger/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          {/* Info */}
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-3">
            <p className="text-accent text-xs">
              <strong>Required columns:</strong> Name, Email, Role, Current Project, Is Available
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-surface-light">
          <button
            onClick={onClose}
            className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex items-center space-x-2 px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Uploading...' : 'Upload'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
