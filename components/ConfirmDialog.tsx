import React from 'react'

interface ConfirmDialogProps {
  open: boolean
  title?: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ open, title, message, onConfirm, onCancel }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs">
        {title && <h3 className="text-lg font-bold mb-2">{title}</h3>}
        <p className="mb-4 text-sm text-gray-700">{message}</p>
        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 rounded bg-gray-200 text-gray-700" onClick={onCancel}>Cancel</button>
          <button className="px-4 py-2 rounded bg-red-500 text-white font-semibold" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
