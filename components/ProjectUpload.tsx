'use client'

import { useState } from 'react'
import { Upload, X, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react'
import { projectStorageService } from '@/lib/projectStorage'

interface ProjectUploadProps {
  onClose: () => void
  onUploadSuccess: () => void
}

export default function ProjectUpload({ onClose, onUploadSuccess }: ProjectUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) return

    const validExtensions = ['.csv', '.xls', '.xlsx']
    const isValid = validExtensions.some(ext => selectedFile.name.toLowerCase().endsWith(ext))

    if (!isValid) {
      setError('Please upload a CSV or Excel file (.csv, .xls, .xlsx)')
      return
    }

    setFile(selectedFile)
    setError(null)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/projects/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      // Save to localStorage
      projectStorageService.saveProjects(result.data)

      setSuccess(`Successfully uploaded ${result.recordCount} projects!`)
      setTimeout(() => {
        onUploadSuccess()
        onClose()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-surface-light rounded-2xl max-w-2xl w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-light">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Upload Projects Data</h2>
            <p className="text-text-secondary text-sm mt-1">Upload CSV or Excel file with project information</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-light rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Drag & Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-surface-light hover:border-primary/50'
            }`}
          >
            <FileSpreadsheet className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <p className="text-text-primary font-medium mb-2">
              {file ? file.name : 'Drag and drop your file here'}
            </p>
            <p className="text-text-secondary text-sm mb-4">
              or click to browse (.csv, .xls, .xlsx)
            </p>
            <input
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg cursor-pointer transition-colors"
            >
              <Upload className="w-5 h-5" />
              <span className="font-medium">Choose File</span>
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-danger/10 border border-danger/30 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mt-4 p-4 bg-success/10 border border-success/30 rounded-lg flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              <p className="text-success text-sm">{success}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-surface-light">
          <button
            onClick={onClose}
            className="px-6 py-2 text-text-primary hover:bg-surface-light rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Upload</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
