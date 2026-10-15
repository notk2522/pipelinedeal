'use client'

import React, { useState, useMemo } from 'react'
import {
  DealData,
  STAGES,
  DEFAULT_OWNERS,
  formatCurrency,
  formatDate,
} from '@/lib/constants'
import { useLanguage } from '@/context/LanguageContext'
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
  Building,
  User,
  XCircle,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react'

interface TableViewProps {
  deals: DealData[]
  initialStageFilter?: string | null
  onEditDeal: (deal: DealData) => void
  onDeleteDeal: (deal: DealData) => void
  onStageChange: (dealId: string, newStage: string) => Promise<void>
}

export function TableView({
  deals,
  initialStageFilter = null,
  onEditDeal,
  onDeleteDeal,
  onStageChange,
}: TableViewProps) {
  const { lang, t } = useLanguage()

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('')
  const [stageFilter, setStageFilter] = useState<string>(initialStageFilter || 'ALL')
  const [ownerFilter, setOwnerFilter] = useState<string>('ALL')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'value_high' | 'value_low' | 'expected_close'>('newest')

  // Get unique owners across all deals
  const uniqueOwners = useMemo(() => {
    const set = new Set<string>()
    DEFAULT_OWNERS.forEach((o) => set.add(o))
    deals.forEach((d) => {
      if (d.owner) set.add(d.owner)
    })
    return Array.from(set)
  }, [deals])

  // Filter and sort deals
  const filteredDeals = useMemo(() => {
    return deals
      .filter((deal) => {
        // Search
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase()
          const matchName = deal.deal_name.toLowerCase().includes(q)
          const matchCompany = deal.company.toLowerCase().includes(q)
          const matchContact = deal.contact_person.toLowerCase().includes(q)
          const matchId = deal.id.toLowerCase().includes(q)
          const matchNotes = deal.next_step_notes?.toLowerCase().includes(q) || false
          if (!matchName && !matchCompany && !matchContact && !matchId && !matchNotes) {
            return false
          }
        }

        // Stage Filter
        if (stageFilter !== 'ALL' && deal.stage !== stageFilter) {
          return false
        }

        // Owner Filter
        if (ownerFilter !== 'ALL' && deal.owner !== ownerFilter) {
          return false
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
        }
        if (sortBy === 'oldest') {
          return new Date(a.created_date).getTime() - new Date(b.created_date).getTime()
        }
        if (sortBy === 'value_high') {
          return b.deal_value - a.deal_value
        }
        if (sortBy === 'value_low') {
          return a.deal_value - b.deal_value
        }
        if (sortBy === 'expected_close') {
          return new Date(a.expected_close).getTime() - new Date(b.expected_close).getTime()
        }
        return 0
      })
  }, [deals, searchTerm, stageFilter, ownerFilter, sortBy])

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Deal ID',
      'Deal Name',
      'Company',
      'Contact Person',
      'Stage',
      'Deal Value (THB)',
      'Win Probability (%)',
      'Weighted Value (THB)',
      'Owner',
      'Expected Close',
      'Actual Close',
      'Lost Reason',
      'Next Step Notes',
    ]

    const rows = filteredDeals.map((d) => [
      `"${d.id}"`,
      `"${d.deal_name.replace(/"/g, '""')}"`,
      `"${d.company.replace(/"/g, '""')}"`,
      `"${d.contact_person.replace(/"/g, '""')}"`,
      `"${d.stage}"`,
      d.deal_value,
      d.win_probability,
      d.weighted_value,
      `"${d.owner}"`,
      `"${formatDate(d.expected_close, 'en')}"`,
      `"${d.actual_close_date ? formatDate(d.actual_close_date, 'en') : ''}"`,
      `"${(d.lost_reason || '').replace(/"/g, '""')}"`,
      `"${(d.next_step_notes || '').replace(/"/g, '""')}"`,
    ])

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `pipeline_deals_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
      {/* Top Filter & Search Toolbar */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
          />
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Stage Filter */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="text-xs px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="ALL">{t.allStages}</option>
            {STAGES.map((s) => (
              <option key={s.key} value={s.key}>
                {lang === 'th' ? s.shortTh : s.shortEn}
              </option>
            ))}
          </select>

          {/* Owner Filter */}
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="text-xs px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="ALL">{t.allOwners}</option>
            {uniqueOwners.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="newest">{t.sortNewest}</option>
            <option value="oldest">{t.sortOldest}</option>
            <option value="value_high">{t.sortValueHigh}</option>
            <option value="value_low">{t.sortValueLow}</option>
            <option value="expected_close">{t.sortExpectedClose}</option>
          </select>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-2xs"
            title={t.exportCsv}
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">{t.exportCsv}</span>
          </button>
        </div>
      </div>

      {/* Record Count Bar */}
      <div className="px-4 py-2 bg-slate-100/50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>{t.totalRecords.replace('{count}', filteredDeals.length.toString())}</span>
        {(stageFilter !== 'ALL' || ownerFilter !== 'ALL' || searchTerm) && (
          <button
            onClick={() => {
              setSearchTerm('')
              setStageFilter('ALL')
              setOwnerFilter('ALL')
            }}
            className="text-blue-600 dark:text-blue-400 font-medium hover:underline text-[11px]"
          >
            {lang === 'th' ? 'ล้างตัวกรองทั้งหมด' : 'Clear all filters'}
          </button>
        )}
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">{t.colId}</th>
              <th className="py-3 px-4">{t.colDeal}</th>
              <th className="py-3 px-4">{t.colStage}</th>
              <th className="py-3 px-4 text-right">{t.colValue}</th>
              <th className="py-3 px-4 text-center">{t.colWinProb}</th>
              <th className="py-3 px-4 text-right">{t.colWeighted}</th>
              <th className="py-3 px-4">{t.colOwner}</th>
              <th className="py-3 px-4">{t.colExpectedClose}</th>
              <th className="py-3 px-4 text-center">{t.colActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
            {filteredDeals.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400 dark:text-slate-500">
                  {lang === 'th' ? 'ไม่พบดีลที่ตรงกับเงื่อนไขการค้นหา' : 'No deals match your search criteria'}
                </td>
              </tr>
            ) : (
              filteredDeals.map((deal) => {
                const stageConfig = STAGES.find((s) => s.key === deal.stage)
                const isClosedWon = deal.stage.includes('Closed Won')
                const isClosedLost = deal.stage.includes('Closed Lost')
                const isOverdue =
                  !isClosedWon &&
                  !isClosedLost &&
                  deal.expected_close &&
                  new Date(deal.expected_close).getTime() < Date.now()

                return (
                  <tr
                    key={deal.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {/* Deal ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {deal.id}
                    </td>

                    {/* Deal & Company */}
                    <td className="py-3.5 px-4 min-w-[200px]">
                      <div className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer" onClick={() => onEditDeal(deal)}>
                        {deal.deal_name}
                      </div>
                      <div className="flex items-center text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <Building className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                        <span className="truncate">{deal.company}</span>
                        <span className="mx-1">•</span>
                        <User className="w-3 h-3 mr-0.5 text-slate-400 shrink-0" />
                        <span className="truncate">{deal.contact_person}</span>
                      </div>
                    </td>

                    {/* Stage Badge & Dropdown */}
                    <td className="py-3.5 px-4 min-w-[160px]">
                      <div className="relative inline-block">
                        <select
                          value={deal.stage}
                          onChange={(e) => onStageChange(deal.id, e.target.value)}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border cursor-pointer appearance-none pr-6 focus:outline-hidden ${
                            stageConfig
                              ? `${stageConfig.badgeColor.bg} ${stageConfig.badgeColor.text} ${stageConfig.badgeColor.border}`
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {STAGES.map((s) => (
                            <option key={s.key} value={s.key}>
                              {lang === 'th' ? s.labelTh : s.labelEn}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3 h-3 absolute right-2 top-2 pointer-events-none opacity-60" />
                      </div>

                      {/* Lost reason if lost */}
                      {isClosedLost && deal.lost_reason && (
                        <div className="mt-1 text-[10px] text-rose-600 dark:text-rose-400 flex items-center">
                          <XCircle className="w-3 h-3 mr-1 shrink-0" />
                          <span className="truncate">{deal.lost_reason}</span>
                        </div>
                      )}
                    </td>

                    {/* Deal Value */}
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                      {formatCurrency(deal.deal_value, lang)}
                    </td>

                    {/* Win Prob */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-md font-semibold text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {deal.win_probability}%
                      </span>
                    </td>

                    {/* Weighted Value */}
                    <td className="py-3.5 px-4 text-right font-medium text-slate-600 dark:text-slate-400">
                      {formatCurrency(deal.weighted_value, lang)}
                    </td>

                    {/* Owner */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[10px]">
                          {deal.owner.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {deal.owner}
                        </span>
                      </div>
                    </td>

                    {/* Expected Close */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span className={isOverdue ? 'text-rose-600 dark:text-rose-400 font-semibold' : ''}>
                          {formatDate(deal.expected_close, lang)}
                        </span>
                      </div>
                      {isOverdue && (
                        <span className="text-[10px] text-rose-500 font-medium block">
                          Overdue
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => onEditDeal(deal)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                          title={t.editDeal}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteDeal(deal)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title={t.deleteDeal}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
