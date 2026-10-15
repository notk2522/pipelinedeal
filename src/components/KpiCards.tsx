'use client'

import React from 'react'
import { DealData } from '@/lib/constants'
import { formatCurrency } from '@/lib/constants'
import { useLanguage } from '@/context/LanguageContext'
import {
  Layers,
  Sparkles,
  Trophy,
  PieChart,
  ArrowUpRight,
} from 'lucide-react'

interface KpiCardsProps {
  deals: DealData[]
  selectedYear?: string
}

export function KpiCards({ deals, selectedYear = 'ALL' }: KpiCardsProps) {
  const { lang, t } = useLanguage()

  // Active deals are those not Closed Won and not Closed Lost
  const activeDeals = deals.filter(
    (d) => !d.stage.includes('Closed Won') && !d.stage.includes('Closed Lost')
  )

  const totalPipelineValue = activeDeals.reduce((sum, d) => sum + (d.deal_value || 0), 0)
  const weightedForecast = activeDeals.reduce((sum, d) => sum + (d.weighted_value || 0), 0)

  const wonDeals = deals.filter((d) => d.stage.includes('Closed Won'))
  const lostDeals = deals.filter((d) => d.stage.includes('Closed Lost'))

  const closedWonValue = wonDeals.reduce((sum, d) => sum + (d.deal_value || 0), 0)

  const closedTotal = wonDeals.length + lostDeals.length
  const winRate = closedTotal > 0 ? Math.round((wonDeals.length / closedTotal) * 100) : 0

  const periodLabel = selectedYear === 'ALL'
    ? (lang === 'th' ? 'รวมทั้งหมด' : 'All-Time')
    : selectedYear

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Pipeline Value */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t.kpiTotalPipeline}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              {periodLabel}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {formatCurrency(totalPipelineValue, lang)}
          </div>
          <div className="mt-1 flex items-center text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-blue-600 dark:text-blue-400 mr-1.5">
              {activeDeals.length}
            </span>
            <span>{t.activeDealsCount}</span>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-80" />
      </div>

      {/* 2. Weighted Forecast */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t.kpiWeightedForecast}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              {periodLabel}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {formatCurrency(weightedForecast, lang)}
          </div>
          <div className="mt-1 flex items-center text-xs text-slate-500 dark:text-slate-400">
            <ArrowUpRight className="w-3.5 h-3.5 text-indigo-500 mr-1" />
            <span>
              {totalPipelineValue > 0
                ? `${Math.round((weightedForecast / totalPipelineValue) * 100)}% of Pipeline`
                : '0%'}
            </span>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-80" />
      </div>

      {/* 3. Closed Won */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {selectedYear === 'ALL' ? t.kpiClosedWonYTD : `Closed Won ${selectedYear}`}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              {periodLabel}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Trophy className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {formatCurrency(closedWonValue, lang)}
          </div>
          <div className="mt-1 flex items-center text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 mr-1.5">
              {wonDeals.length}
            </span>
            <span>{lang === 'th' ? 'ดีลที่ปิดสำเร็จ' : 'deals won'}</span>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-80" />
      </div>

      {/* 4. Win Rate % */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t.kpiWinRate}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
              {periodLabel}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <PieChart className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {winRate}%
            </span>
            <span className="text-xs text-slate-400">
              ({wonDeals.length}W / {lostDeals.length}L)
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${winRate}%` }}
            />
            <div
              className="bg-rose-400 h-full transition-all duration-500"
              style={{ width: `${100 - winRate}%` }}
            />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 opacity-80" />
      </div>
    </div>
  )
}
