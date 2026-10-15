'use client'

import React from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { AlertTriangle, X } from 'lucide-react'

interface DeleteConfirmModalProps {
  isOpen: boolean
  dealId: string
  dealName: string
  onClose: () => void
  onConfirm: () => Promise<void>
  isDeleting: boolean
}

export function DeleteConfirmModal({
  isOpen,
  dealId,
  dealName,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteConfirmModalProps) {
  const { t } = useLanguage()

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t.confirmDelete}
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {t.confirmDeleteDesc}
            </p>
            <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-750 text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {dealId}:
              </span>{' '}
              <span className="text-slate-600 dark:text-slate-400">{dealName}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? t.deleting : t.delete}
          </button>
        </div>
      </div>
    </div>
  )
}
