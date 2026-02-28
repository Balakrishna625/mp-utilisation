'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { 
  monthlyDataStorage, 
  MONTH_TO_NUMBER, 
  NUMBER_TO_MONTH,
  getQuarterFromMonth,
  getFinancialYear,
  FY_QUARTER_MAPPING
} from '@/lib/monthlyDataStorage'
import { 
  calculatePeriodInfo, 
  formatDateISO, 
  formatDateDisplay 
} from '@/lib/dateUtils'
import type { MonthlyDataStructure, MonthlyDataMetadata } from '@/types/utilization'
import { Upload, Calendar, Database, CheckCircle, AlertCircle, FileSpreadsheet, TrendingUp, Trash2, X } from 'lucide-react'

export default function MonthlyDataUploadPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  
  const [periodType, setPeriodType] = useState<'monthly' | 'weekly'>('monthly')
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<number>(2025)
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [existingData, setExistingData] = useState<MonthlyDataStructure>({})
  const [metadata, setMetadata] = useState<MonthlyDataMetadata | null>(null)
  const [loading, setLoading] = useState(true)
  const [dbRecords, setDbRecords] = useState<any[]>([])

  // Redirect if not authenticated or not a manager
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'manager') {
      router.push('/login')
    } else {
      setLoading(false)
    }
  }, [isAuthenticated, user, router])

  // Load existing data from database
  useEffect(() => {
    loadDataFromDatabase()
  }, [])

  const loadDataFromDatabase = async () => {
    try {
      const response = await fetch('/api/monthly')
      const result = await response.json()
      
      if (result.success && result.data) {
        setDbRecords(result.data)
        
        if (result.metadata) {
          setMetadata(result.metadata)
        }
      }
    } catch (error) {
      console.error('Failed to load data from database:', error)
    }
  }

  // Auto-select current month
  useEffect(() => {
    const currentMonth = NUMBER_TO_MONTH[new Date().getMonth() + 1]
    setSelectedMonth(currentMonth)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setUploadStatus('idle')
      setMessage('')
    }
  }

  const handleDeletePeriod = async (periodId: string, periodLabel: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${periodLabel}?\n\nThis action cannot be undone.`
    )
    
    if (!confirmed) return
    
    try {
      const response = await fetch(`/api/monthly?periodId=${encodeURIComponent(periodId)}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        setUploadStatus('success')
        setMessage(`Successfully deleted ${periodLabel}`)
        
        // Reload data
        await loadDataFromDatabase()
        
        // Clear message after 3 seconds
        setTimeout(() => {
          setUploadStatus('idle')
          setMessage('')
        }, 3000)
      } else {
        setUploadStatus('error')
        setMessage(`Failed to delete: ${result.error}`)
      }
    } catch (error) {
      setUploadStatus('error')
      setMessage('Failed to delete data')
    }
  }

  const handleClearAllData = async () => {
    const confirmed = window.confirm(
      `⚠️ WARNING: This will delete ALL uploaded data!\n\nAre you absolutely sure you want to continue?\n\nThis action cannot be undone.`
    )
    
    if (!confirmed) return
    
    // Double confirmation for destructive action
    const doubleConfirmed = window.confirm(
      `This is your final warning!\n\nAll data across all financial years will be permanently deleted.\n\nClick OK to proceed or Cancel to abort.`
    )
    
    if (!doubleConfirmed) return
    
    try {
      const response = await fetch('/api/monthly', { method: 'DELETE' })
      const result = await response.json()
      
      if (result.success) {
        setUploadStatus('success')
        setMessage('All data has been cleared')
        
        // Reload data (will be empty)
        await loadDataFromDatabase()
        
        // Clear message after 3 seconds
        setTimeout(() => {
          setUploadStatus('idle')
          setMessage('')
        }, 3000)
      } else {
        setUploadStatus('error')
        setMessage('Failed to clear data')
      }
    } catch (error) {
      setUploadStatus('error')
      setMessage('Failed to clear data')
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus('error')
      setMessage('Please select a file')
      return
    }

    // Validate based on period type
    if (periodType === 'monthly' && !selectedMonth) {
      setUploadStatus('error')
      setMessage('Please select a month')
      return
    }

    if (periodType === 'weekly') {
      if (!fromDate || !toDate) {
        setUploadStatus('error')
        setMessage('Please select both From Date and To Date')
        return
      }

      const from = new Date(fromDate)
      const to = new Date(toDate)

      if (from > to) {
        setUploadStatus('error')
        setMessage('From Date must be before or equal to To Date')
        return
      }
    }

    setUploading(true)
    setUploadStatus('idle')
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('periodType', periodType)

      if (periodType === 'monthly') {
        formData.append('month', selectedMonth)
        formData.append('year', selectedYear.toString())
      } else {
        formData.append('fromDate', fromDate)
        formData.append('toDate', toDate)
      }

      const response = await fetch('/api/monthly-upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      setUploadStatus('success')
      
      // Create success message based on period type
      let successMsg = `Successfully uploaded ${result.recordCount || 'data'} records`
      if (periodType === 'monthly') {
        successMsg += ` for ${selectedMonth} FY${selectedYear.toString().slice(-2)}`
      } else if (periodType === 'weekly' && result.periodInfo) {
        successMsg += ` for ${result.periodInfo.month} ${result.periodInfo.financialYear} (${formatDateDisplay(new Date(fromDate))} - ${formatDateDisplay(new Date(toDate))})`
      }
      
      setMessage(successMsg)
      setFile(null)
      
      // Reload data from database
      await loadDataFromDatabase()

      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement
      if (fileInput) fileInput.value = ''

    } catch (error: any) {
      console.error('Upload error:', error)
      setUploadStatus('error')
      setMessage(error.message || 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated || user?.role !== 'manager') {
    return null
  }

  const selectedQuarter = selectedMonth ? getQuarterFromMonth(selectedMonth) : ''
  const selectedFY = selectedMonth ? getFinancialYear(selectedMonth, selectedYear) : ''

  const months = Object.keys(MONTH_TO_NUMBER)
  // Generate years from 2020 to 2030 (allows historical and future data)
  const years = Array.from({ length: 11 }, (_, i) => 2020 + i)

  // Group database records by FY > Quarter > Period
  const groupedData = dbRecords.reduce((acc: any, record: any) => {
    const fy = record.financialYear
    const quarter = record.quarter
    
    if (!acc[fy]) {
      acc[fy] = { quarters: {} }
    }
    if (!acc[fy].quarters[quarter]) {
      acc[fy].quarters[quarter] = { periods: [] }
    }
    
    // Create a unique period entry
    const periodKey = record.periodType === 'weekly' 
      ? `${record.fromDate}_${record.toDate}`
      : record.month
    
    // Check if this period already exists
    const existingPeriod = acc[fy].quarters[quarter].periods.find((p: any) => p.key === periodKey)
    
    if (!existingPeriod) {
      acc[fy].quarters[quarter].periods.push({
        key: periodKey,
        type: record.periodType,
        month: record.month,
        fromDate: record.fromDate,
        toDate: record.toDate,
        label: record.periodType === 'weekly'
          ? `${record.month}: ${formatDateDisplay(new Date(record.fromDate))} - ${formatDateDisplay(new Date(record.toDate))}`
          : record.month,
        count: 1,
        records: [record]
      })
    } else {
      existingPeriod.count++
      existingPeriod.records.push(record)
    }
    
    return acc
  }, {})

  const availableFYs = Object.keys(groupedData).sort().reverse()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Monthly Utilization Data Upload</h1>
          <p className="text-gray-600">Upload monthly utilization data organized by Financial Year and Quarters</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Upload Data</h2>
                <p className="text-sm text-gray-600">Select period and upload Excel/CSV file</p>
              </div>
            </div>

            {/* Period Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Period Type
              </label>
              <div className="flex gap-3">
                <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all ${
                  periodType === 'monthly' 
                    ? 'bg-blue-50 border-blue-500 text-blue-700' 
                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                }`}>
                  <input
                    type="radio"
                    name="periodType"
                    value="monthly"
                    checked={periodType === 'monthly'}
                    onChange={(e) => setPeriodType('monthly')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className={`text-sm font-semibold ${periodType === 'monthly' ? 'text-blue-700' : 'text-gray-700'}`}>
                    Monthly
                  </span>
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all ${
                  periodType === 'weekly' 
                    ? 'bg-blue-50 border-blue-500 text-blue-700' 
                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                }`}>
                  <input
                    type="radio"
                    name="periodType"
                    value="weekly"
                    checked={periodType === 'weekly'}
                    onChange={(e) => setPeriodType('weekly')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className={`text-sm font-semibold ${periodType === 'weekly' ? 'text-blue-700' : 'text-gray-700'}`}>
                    Weekly
                  </span>
                </label>
              </div>
            </div>

            {/* Month and Year Selection - Only for Monthly */}
            {periodType === 'monthly' && (
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="">Choose month...</option>
                  {months.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Display Quarter and FY */}
              {selectedMonth && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border-2 border-blue-200">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-xs font-semibold text-gray-600 mb-1">Financial Year</div>
                      <div className="text-2xl font-bold text-blue-600">{selectedFY}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-600 mb-1">Quarter</div>
                      <div className="text-2xl font-bold text-purple-600">{selectedQuarter}</div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-gray-600 text-center">
                    {selectedMonth} {selectedYear}
                  </div>
                </div>
              )}
            </div>
            )}

            {/* Date Range Selection - Only for Weekly */}
            {periodType === 'weekly' && (
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      From Date
                    </label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 font-medium"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      To Date
                    </label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Display calculated FY, Quarter, Month for selected date range */}
                {fromDate && toDate && new Date(fromDate) <= new Date(toDate) && (
                  (() => {
                    const periodInfo = calculatePeriodInfo(new Date(fromDate), new Date(toDate))
                    return (
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border-2 border-blue-200">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-xs font-semibold text-gray-600 mb-1">Financial Year</div>
                            <div className="text-xl font-bold text-blue-600">{periodInfo.financialYear}</div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-gray-600 mb-1">Quarter</div>
                            <div className="text-xl font-bold text-purple-600">{periodInfo.quarter}</div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-gray-600 mb-1">Month</div>
                            <div className="text-xl font-bold text-green-600">{periodInfo.month}</div>
                          </div>
                        </div>
                        <div className="mt-3 text-xs text-gray-600 text-center">
                          {formatDateDisplay(periodInfo.fromDate)} - {formatDateDisplay(periodInfo.toDate)}
                        </div>
                      </div>
                    )
                  })()
                )}
              </div>
            )}

            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Upload File
              </label>
              <div className="relative">
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  onChange={handleFileChange}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer
                    file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              {file && (
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{file.name}</span>
                </div>
              )}
            </div>

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={uploading || !file || !selectedMonth}
              className={`w-full py-4 rounded-xl font-semibold text-white transition-all transform hover:scale-105 ${
                uploading || !file || !selectedMonth
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg'
              }`}
            >
              {uploading ? 'Uploading...' : 'Upload Data'}
            </button>

            {/* Status Messages */}
            {uploadStatus !== 'idle' && (
              <div className={`mt-4 p-4 rounded-xl flex items-start gap-3 ${
                uploadStatus === 'success' ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
              }`}>
                {uploadStatus === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className={uploadStatus === 'success' ? 'text-green-800' : 'text-red-800'}>
                  {message}
                </div>
              </div>
            )}
          </div>

          {/* Existing Data Overview */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Database className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Existing Data</h2>
                  <p className="text-sm text-gray-600">Overview of uploaded data</p>
                </div>
              </div>
              
              {availableFYs.length > 0 && (
                <button
                  onClick={handleClearAllData}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg border-2 border-red-200 hover:bg-red-100 hover:border-red-300 transition-all font-semibold"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All Data
                </button>
              )}
            </div>

            {metadata && (
              <div className="mb-6 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                <div className="text-sm text-gray-600 mb-1">Last Updated</div>
                <div className="font-semibold text-gray-900">
                  {new Date(metadata.uploadedAt).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {metadata.fileName}
                </div>
              </div>
            )}

            {availableFYs.length > 0 ? (
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {availableFYs.map(fy => {
                  const fyData = groupedData[fy]
                  const quarters = Object.keys(fyData.quarters).sort()

                  return (
                    <div key={fy} className="border-2 border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-gray-900">{fy}</h3>
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                      </div>

                      <div className="space-y-2">
                        {quarters.map(quarter => {
                          const quarterData = fyData.quarters[quarter]
                          const periods = quarterData.periods.sort((a: any, b: any) => {
                            // Sort by fromDate or month
                            if (a.fromDate && b.fromDate) {
                              return new Date(a.fromDate).getTime() - new Date(b.fromDate).getTime()
                            }
                            return (MONTH_TO_NUMBER[a.month] || 0) - (MONTH_TO_NUMBER[b.month] || 0)
                          })

                          return (
                            <div key={quarter} className="bg-gray-50 rounded-lg p-3">
                              <div className="font-semibold text-gray-700 mb-2">{quarter}</div>
                              <div className="flex flex-wrap gap-2">
                                {periods.map((period: any) => {
                                  return (
                                    <div 
                                      key={period.key}
                                      className={`px-3 py-1 bg-white rounded-lg border text-sm flex items-center gap-2 group ${
                                        period.type === 'weekly' 
                                          ? 'border-green-300 bg-green-50' 
                                          : 'border-gray-300'
                                      }`}
                                    >
                                      <span className="font-medium text-gray-700">
                                        {period.type === 'weekly' ? (
                                          <span className="text-green-700">{period.label}</span>
                                        ) : (
                                          period.month
                                        )}
                                      </span>
                                      <span className="text-gray-500">({period.count})</span>
                                      <button
                                        onClick={() => handleDeletePeriod(period.key, period.label)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded text-red-600 hover:text-red-700"
                                        title="Delete this period"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No data uploaded yet</p>
                <p className="text-sm text-gray-400 mt-2">Upload your first data file to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* FY/Quarter Reference */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Financial Year Quarter Reference</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(FY_QUARTER_MAPPING).map(([quarter, months]) => (
              <div key={quarter} className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border-2 border-blue-200">
                <div className="text-lg font-bold text-blue-600 mb-2">{quarter}</div>
                <div className="text-sm text-gray-700 space-y-1">
                  {months.map(month => (
                    <div key={month}>{month}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-sm text-gray-600 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
            <strong>Note:</strong> Financial Year matches the selected calendar year. 
            For example, all months in 2025 = FY25, all months in 2024 = FY24.
          </div>
        </div>
      </div>
    </div>
  )
}
