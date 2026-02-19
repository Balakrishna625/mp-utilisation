'use client'

import { useState, useRef } from 'react'
import { Upload, X, FileText, AlertCircle, CheckCircle } from 'lucide-react'

interface CSVUploadProps {
  onClose: () => void
  onUploadSuccess: () => void
}

export default function CSVUpload({ onClose, onUploadSuccess }: CSVUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedCount, setUploadedCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isValidFile = (file: File) => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
    const validExtensions = ['.csv', '.xls', '.xlsx']
    
    return validTypes.includes(file.type) || 
           validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (isValidFile(selectedFile)) {
        setFile(selectedFile)
        setError(null)
      } else {
        setError('Please select a valid CSV or Excel file')
      }
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }
      
      if (result.data && result.data.length > 0) {
        // Store data in localStorage
        localStorage.setItem('mp-utilization-data', JSON.stringify(result.data))
        console.log('Stored', result.data.length, 'records in localStorage')
        setUploadedCount(result.data.length)
      }
      
      setSuccess(true)
      
      // Close modal after 1.5 seconds and refresh data
      setTimeout(() => {
        onUploadSuccess()
        onClose()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to upload file. Please try again.')
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && isValidFile(droppedFile)) {
      setFile(droppedFile)
      setError(null)
    } else {
      setError('Please drop a valid CSV or Excel file')
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-surface-light rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-light">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Upload Utilization Data</h2>
            <p className="text-text-secondary text-sm mt-1">Upload CSV or Excel file with employee hours</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-light rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-surface-light hover:border-primary/50 rounded-xl p-12 text-center cursor-pointer transition-colors group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {file ? (
              <div className="space-y-3">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
                <p className="text-text-primary font-medium">{file.name}</p>
                <p className="text-text-muted text-sm">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-text-primary font-medium">Drop your CSV or Excel file here</p>
                  <p className="text-text-secondary text-sm mt-1">or click to browse</p>
                  <p className="text-text-muted text-xs mt-2">Supports .csv, .xls, .xlsx</p>
                </div>
              </div>
            )}
          </div>

          {/* Expected Format Info */}
          <div className="bg-surface-light rounded-lg p-4">
            <p className="text-text-primary font-medium text-sm mb-2">Expected Format (CSV/Excel):</p>
            <div className="text-text-muted text-xs space-y-1 font-mono">
              <p>Name, Title, Target Hours, Project, PMN, Utilization, ...</p>
              <p>Fringe Impact, Fringe, W/Presales</p>
            </div>
            <p className="text-text-muted text-xs mt-2">💡 Excel files: Data should be in the first sheet</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-success/10 border border-success/30 rounded-lg p-4 flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-success text-sm font-medium">File uploaded successfully!</p>
                <p className="text-success/80 text-xs mt-1">
                  {uploadedCount} employee records processed and stored
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-surface-light">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-text-secondary hover:text-text-primary hover:bg-surface-light rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading || success}
            className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/30"
          >
            {uploading ? 'Uploading...' : success ? 'Uploaded!' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  )
}
