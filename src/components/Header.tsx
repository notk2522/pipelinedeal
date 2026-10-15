'use client'

import React from 'react'
import { useLanguage } from '@/context/LanguageContext'
import {
  TrendingUp,
  Plus,
  RotateCcw,
  Languages,
  Kanban,
  TableProperties,
} from 'lucide-react'

interface HeaderProps {
  onNewDeal: () => void
  onResetSeed: () => void
  activeView: 'kanban' | 'table'
  onViewChange: (view: 'kanban' | 'table') => void
  isSeeding?: boolean
}

export function Header({
  onNewDeal,
  onResetSeed,
  activeView,
  onViewChange,
  isSeeding = false,
}: HeaderProps) {
  const { lang, toggleLang, t } = useLanguage()

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3.5 gap-3">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Pipeline<span className="text-blue-600 dark:text-blue-400">Deal</span>
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                  Sales Tracker
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Center: View Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl self-start sm:self-auto border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => onViewChange('kanban')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeView === 'kanban'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>{t.kanbanView}</span>
            </button>
            <button
              onClick={() => onViewChange('table')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeView === 'table'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TableProperties className="w-3.5 h-3.5" />
              <span>{t.tableView}</span>
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-2 self-end sm:self-auto">
            {/* Language Switcher */}
            <button
              onClick={toggleLang}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-xs"
              title="สลับภาษา / Switch Language"
            >
              <Languages className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{lang === 'th' ? 'TH 🇹🇭' : 'EN 🇬🇧'}</span>
            </button>

            {/* Reset Seed Button */}
            <button
              onClick={onResetSeed}
              disabled={isSeeding}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-xs disabled:opacity-50"
              title={t.resetSeed}
            >
              <RotateCcw className={`w-3.5 h-3.5 text-slate-500 ${isSeeding ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">{t.resetSeed}</span>
            </button>

            {/* New Deal Primary Button */}
            <button
              onClick={onNewDeal}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{t.newDeal}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
