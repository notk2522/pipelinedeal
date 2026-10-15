'use client'

import React from 'react'
import { DealData, STAGES, formatCurrency } from '@/lib/constants'
import { useLanguage } from '@/context/LanguageContext'
import { Layers, ChevronRight } from 'lucide-react'

interface StageBreakdownProps {
  deals: DealData[]
  selectedStage: string | null
  onSelectStage: (stage: string | null) => void
}

export function StageBreakdown({
  deals,
  selectedStage,
  onSelectStage,
}: StageBreakdownProps) {
  const { lang, t } = useLanguage()

  // Calculate overall total deal value for percentage bars
  const grandTotalValue = deals.reduce((sum, d) => sum + (d.deal_value || 0), 0)

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {t.stageBreakdownTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.stageBreakdownSubtitle}
            </p>
          </div>
        </div>

        {selectedStage && (
          <button
            onClick={() => onSelectStage(null)}
            className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline self-start sm:self-auto flex items-center"
          >
            {t.allStages} ({deals.length}) <ChevronRight className="w-3 h-3 ml-0.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4">
        {STAGES.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.key)
          const count = stageDeals.length
          const totalVal = stageDeals.reduce((sum, d) => sum + (d.deal_value || 0), 0)
          const weightedVal = stageDeals.reduce((sum, d) => sum + (d.weighted_value || 0), 0)
          const percentOfTotal = grandTotalValue > 0 ? (totalVal / grandTotalValue) * 100 : 0
          const isSelected = selectedStage === stage.key

          return (
            <div
              key={stage.key}
              onClick={() => onSelectStage(isSelected ? null : stage.key)}
              className={`group cursor-pointer rounded-xl p-3 border transition-all text-left flex flex-col justify-between ${
                isSelected
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
                  : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <div className="flex items-center space-x-1.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${stage.badgeColor.dot}`} />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {lang === 'th' ? stage.shortTh : stage.shortEn}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0">
                    {count}
                  </span>
                </div>

                <div className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  {formatCurrency(totalVal, lang)}
                </div>

                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>{stage.probability}% prob</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    ~{formatCurrency(weightedVal, lang)}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-2.5 w-full bg-slate-200/70 dark:bg-slate-700/60 rounded-full h-1 overflow-hidden">
                <div
                  className={`h-full ${stage.badgeColor.bar} transition-all duration-300`}
                  style={{ width: `${Math.min(100, Math.max(percentOfTotal > 0 ? 5 : 0, percentOfTotal))}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
