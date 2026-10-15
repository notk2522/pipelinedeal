'use client'

import React, { useState, useEffect } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { Calendar, Layers } from 'lucide-react'

interface PeriodFilterProps {
  selectedYear: string // 'ALL' or '2026', '2025', etc.
  onSelectYear: (year: string) => void
  availableYears: string[]
  totalDealsCount: number
  filteredDealsCount: number
}

export function PeriodFilter({
  selectedYear,
  onSelectYear,
  availableYears,
  totalDealsCount,
  filteredDealsCount,
}: PeriodFilterProps) {
  const { lang, t } = useLanguage()
  const [currentYearStr, setCurrentYearStr] = useState<string>('2026')

  useEffect(() => {
    setCurrentYearStr(new Date().getFullYear().toString())
  }, [])

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 sm:px-4 sm:py-3 gap-3 shadow-2xs">
      {/* Left: Title & Basis info */}
      <div className="flex items-center space-x-2.5">
        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
          <Calendar className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {lang === 'th' ? 'มุมมองช่วงเวลาการขาย' : 'Pipeline Timeframe'}
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              ({filteredDealsCount} {t.dealsCountSuffix})
            </span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            {t.closeDateBasis}
          </p>
        </div>
      </div>

      {/* Right: Pill Bar for All-Time and Years */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
        {/* All-Time Pill */}
        <button
          onClick={() => onSelectYear('ALL')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            selectedYear === 'ALL'
              ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-750'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{lang === 'th' ? 'ยอดโดยรวมทั้งหมด' : 'All-Time Total'}</span>
        </button>

        {/* Year Pills */}
        {availableYears.map((year) => {
          const isSelected = selectedYear === year
          const isCurrent = year === currentYearStr

          return (
            <button
              key={year}
              onClick={() => onSelectYear(year)}
              className={`flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-750'
              }`}
            >
              <span>{lang === 'th' ? `ปี ${year}` : year}</span>
              {isCurrent && (
                <span
                  className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase tracking-wider ${
                    isSelected
                      ? 'bg-blue-700/80 text-blue-100'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {lang === 'th' ? 'ปีนี้' : 'Now'}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
