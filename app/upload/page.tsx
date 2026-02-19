'use client'

import { useState } from 'react'
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, BarChart3, Briefcase, Users } from 'lucide-react'
import { storageService } from '@/lib/storage'
import { projectStorageService } from '@/lib/projectStorage'
import { reportStorageService } from '@/lib/reportStorage'

interface UploadState {
  file: File | null
  uploading: boolean
  success: boolean
  error: string | null
  recordCount?: number
}

export default function UploadPage() {
  const [utilization, setUtilization] = useState<UploadState>({
    file: null,
    uploading: false,
    success: false,
    error: null,
  })

  const [projects, setProjects] = useState<UploadState>({
    file: null,
    uploading: false,
    success: false,
    error: null,
  })

  const [reports, setReports] = useState<UploadState>({
    file: null,
    uploading: false,
    success: false,
    error: null,
  })

  const handleFileSelect = (type: 'utilization' | 'projects' | 'reports', file: File) => {
    const setState = type === 'utilization' ? setUtilization : type === 'projects' ? setProjects : setReports
    setState({ file, uploading: false, success: false, error: null })
  }

  const handleUpload = async (type: 'utilization' | 'projects' | 'reports') => {
    const state = type === 'utilization' ? utilization : type === 'projects' ? projects : reports
    const setState = type === 'utilization' ? setUtilization : type === 'projects' ? setProjects : setReports

    if (!state.file) {
      setState({ ...state, error: 'Please select a file' })
      return
    }

    setState({ ...state, uploading: true, error: null })

    try {
      const formData = new FormData()
      formData.append('file', state.file)

      const endpoint = type === 'utilization' 
        ? '/api/upload' 
        : type === 'projects' 
        ? '/api/projects/upload' 
        : '/api/reports/upload'

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      console.log(`✅ Upload successful for ${type}:`, result)

      // Save to localStorage
      if (type === 'utilization') {
        storageService.saveData(result.data, {
          fileName: result.fileName,
          fileType: result.fileType,
        })
        console.log('💾 Saved utilization data:', result.data.length, 'records')
      } else if (type === 'projects') {
        projectStorageService.saveProjects(result.data)
        console.log('💾 Saved projects data:', result.data.length, 'records')
      } else {
        // Reports file contains both employee reports AND mentor-mentee data
        reportStorageService.saveReports(result.data, result.fileName)
        console.log('💾 Saved reports data:', result.data.length, 'records')
        
        // Also save mentor-mentee relationships if present
        if (result.mentorMenteeData && result.mentorMenteeData.length > 0) {
          console.log('💾 Saving mentor-mentee data:', result.mentorMenteeData.length, 'relationships')
          console.log('Sample mentor-mentee record:', result.mentorMenteeData[0])
          storageService.saveData(result.mentorMenteeData, {
            fileName: result.fileName,
            fileType: 'employee-reports',
          })
          
          // Verify it was saved
          const saved = storageService.getData()
          console.log('✅ Verification: localStorage now has', saved.length, 'records for mentor-mentee')
          console.log('Sample saved record:', saved[0])
        } else {
          console.log('⚠️ No mentor-mentee data in response. Result keys:', Object.keys(result))
        }
      }

      setState({ 
        ...state, 
        uploading: false, 
        success: true,
        recordCount: result.recordCount,
      })
    } catch (err: any) {
      setState({ 
        ...state, 
        uploading: false, 
        error: err.message || 'Failed to upload file',
      })
    }
  }

  const handleUploadAll = async () => {
    const promises: Promise<void>[] = []
    
    if (utilization.file && !utilization.success) {
      promises.push(handleUpload('utilization'))
    }
    if (projects.file && !projects.success) {
      promises.push(handleUpload('projects'))
    }
    if (reports.file && !reports.success) {
      promises.push(handleUpload('reports'))
    }

    await Promise.all(promises)
  }

  const allUploaded = 
    (utilization.file ? utilization.success : true) &&
    (projects.file ? projects.success : true) &&
    (reports.file ? reports.success : true)

  const hasFiles = utilization.file || projects.file || reports.file

  const renderUploadCard = (
    type: 'utilization' | 'projects' | 'reports',
    state: UploadState,
    icon: any,
    title: string,
    description: string,
    color: string
  ) => {
    const Icon = icon

    return (
      <div className="bg-surface border border-surface-light rounded-xl p-6 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-lg flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-primary">{title}</h3>
            <p className="text-text-muted text-sm">{description}</p>
          </div>
        </div>

        {/* File Input */}
        <div className="flex-1 mb-4">
          <label className="block cursor-pointer">
            <div className="border-2 border-dashed border-surface-light rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <FileSpreadsheet className="w-10 h-10 text-text-muted mx-auto mb-3" />
              <p className="text-primary hover:text-primary/80 font-medium text-sm">
                Choose a file
              </p>
              <p className="text-text-muted text-xs mt-1">
                CSV, XLS, or XLSX
              </p>
            </div>
            <input
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileSelect(type, file)
              }}
              className="hidden"
              disabled={state.uploading}
            />
          </label>

          {/* Selected File */}
          {state.file && (
            <div className="mt-3 flex items-center space-x-2 p-3 bg-surface-light rounded-lg">
              <FileSpreadsheet className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-text-primary text-xs font-medium truncate">
                  {state.file.name}
                </p>
                <p className="text-text-muted text-xs">
                  {(state.file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Status Messages */}
        {state.error && (
          <div className="mb-3 flex items-start space-x-2 p-3 bg-danger/10 border border-danger/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
            <p className="text-danger text-xs">{state.error}</p>
          </div>
        )}

        {state.success && (
          <div className="mb-3 flex items-start space-x-2 p-3 bg-success/10 border border-success/20 rounded-lg">
            <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-success text-xs font-semibold">Upload successful!</p>
              {state.recordCount && (
                <p className="text-success text-xs">{state.recordCount} records imported</p>
              )}
            </div>
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={() => handleUpload(type)}
          disabled={!state.file || state.uploading || state.success}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {state.uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Uploading...</span>
            </>
          ) : state.success ? (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Uploaded</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </>
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="h-full">
        {/* Header */}
        <div className="px-8 py-6 border-b border-surface-light">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Upload Data</h1>
          <p className="text-text-secondary">Upload your utilization, projects, and employee reports data</p>
        </div>

        {/* Upload Cards */}
        <div className="px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {renderUploadCard(
              'utilization',
              utilization,
              BarChart3,
              'Utilization Data',
              'Employee hours & metrics',
              'from-primary to-secondary'
            )}
            {renderUploadCard(
              'projects',
              projects,
              Briefcase,
              'Projects Data',
              'MP project information',
              'from-accent to-primary'
            )}
            {renderUploadCard(
              'reports',
              reports,
              Users,
              'Employee Reports',
              'Availability & assignments',
              'from-success to-accent'
            )}
          </div>

          {/* Upload All Button */}
          {hasFiles && !allUploaded && (
            <div className="flex justify-center">
              <button
                onClick={handleUploadAll}
                disabled={utilization.uploading || projects.uploading || reports.uploading}
                className="flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-lg shadow-primary/30"
              >
                <Upload className="w-5 h-5" />
                <span>Upload All Files</span>
              </button>
            </div>
          )}

          {/* Success Summary */}
          {allUploaded && hasFiles && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-success/10 border border-success/20 rounded-xl p-6 text-center">
                <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
                <h3 className="text-xl font-bold text-success mb-2">All Files Uploaded Successfully!</h3>
                <p className="text-text-secondary mb-4">
                  Your data has been imported and all pages have been updated.
                </p>
                <div className="flex justify-center space-x-4">
                  <a
                    href="/"
                    className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium"
                  >
                    Go to Dashboard
                  </a>
                  <a
                    href="/reports"
                    className="px-6 py-3 bg-surface-light hover:bg-surface-lighter text-text-primary rounded-lg transition-colors font-medium"
                  >
                    View Reports
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="mt-8 max-w-4xl mx-auto">
            <div className="bg-accent/10 border border-accent/20 rounded-xl p-6">
              <h4 className="text-accent font-semibold mb-3">File Requirements:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-accent">
                <div>
                  <p className="font-semibold mb-1">Utilization File:</p>
                  <p>Name, Title, Target Hours, Project, Utilization, etc.</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">Projects File:</p>
                  <p>Project Name, Status, Type, Region, Resources, etc.</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">Employee Reports:</p>
                  <p>Name, Email, Role, Current Project, Is Available, etc.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
