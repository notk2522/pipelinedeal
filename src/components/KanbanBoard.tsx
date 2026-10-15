'use client'

import React, { useState } from 'react'
import {
  DealData,
  STAGES,
  formatCurrency,
  formatDate,
} from '@/lib/constants'
import { useLanguage } from '@/context/LanguageContext'
import {
  MoreVertical,
  Edit2,
  Trash2,
  Calendar,
  User,
  ArrowRight,
  AlertCircle,
  Building,
  CheckCircle2,
  XCircle,
  GripVertical,
} from 'lucide-react'

interface KanbanBoardProps {
  deals: DealData[]
  onEditDeal: (deal: DealData) => void
  onDeleteDeal: (deal: DealData) => void
  onStageChange: (dealId: string, newStage: string) => Promise<void>
}

export function KanbanBoard({
  deals,
  onEditDeal,
  onDeleteDeal,
  onStageChange,
}: KanbanBoardProps) {
  const { lang, t } = useLanguage()

  // Drag and drop states
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData('text/plain', dealId)
    e.dataTransfer.effectAllowed = 'move'
    setDraggedDealId(dealId)
  }

  const handleDragOver = (e: React.DragEvent, stageKey: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverStage !== stageKey) {
      setDragOverStage(stageKey)
    }
  }

  const handleDragLeave = (e: React.DragEvent, stageKey: string) => {
    if (dragOverStage === stageKey) {
      setDragOverStage(null)
    }
  }

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault()
    const dealId = e.dataTransfer.getData('text/plain') || draggedDealId
    setDraggedDealId(null)
    setDragOverStage(null)

    if (!dealId) return

    const currentDeal = deals.find((d) => d.id === dealId)
    if (currentDeal && currentDeal.stage !== targetStage) {
      await onStageChange(dealId, targetStage)
    }
  }

  const handleDragEnd = () => {
    setDraggedDealId(null)
    setDragOverStage(null)
  }

  return (
    <div className="w-full overflow-x-auto pb-6">
      <div className="inline-flex min-w-full gap-4 items-start">
        {STAGES.map((stage) => {
          const columnDeals = deals.filter((d) => d.stage === stage.key)
          const columnTotalValue = columnDeals.reduce((sum, d) => sum + (d.deal_value || 0), 0)
          const isDragOver = dragOverStage === stage.key

          return (
            <div
              key={stage.key}
              onDragOver={(e) => handleDragOver(e, stage.key)}
              onDragLeave={(e) => handleDragLeave(e, stage.key)}
              onDrop={(e) => handleDrop(e, stage.key)}
              className={`w-72 sm:w-80 shrink-0 flex flex-col rounded-2xl border transition-all duration-150 ${
                isDragOver
                  ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-500/30'
                  : 'border-slate-200/80 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/60'
              }`}
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-slate-200/60 dark:border-slate-800/80 bg-white/70 dark:bg-slate-850/70 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${stage.badgeColor.dot}`} />
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                      {lang === 'th' ? stage.labelTh : stage.labelEn}
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {columnDeals.length}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatCurrency(columnTotalValue, lang)}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {stage.probability}% win prob
                  </span>
                </div>
              </div>

              {/* Cards Container */}
              <div className="p-3 flex-1 flex flex-col gap-3 min-h-[350px]">
                {columnDeals.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                      {t.emptyStage}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {t.dragDropHint}
                    </p>
                  </div>
                ) : (
                  columnDeals.map((deal) => {
                    const isDragging = draggedDealId === deal.id
                    const isClosedWon = deal.stage.includes('Closed Won')
                    const isClosedLost = deal.stage.includes('Closed Lost')
                    const isOverdue =
                      !isClosedWon &&
                      !isClosedLost &&
                      deal.expected_close &&
                      new Date(deal.expected_close).getTime() < Date.now()

                    return (
                      <div
                        key={deal.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, deal.id)}
                        onDragEnd={handleDragEnd}
                        className={`group relative bg-white dark:bg-slate-800 rounded-xl p-3.5 border shadow-2xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
                          isDragging
                            ? 'opacity-40 scale-95 border-blue-400 ring-2 ring-blue-400'
                            : 'border-slate-200/90 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        {/* Top: ID & Actions Menu */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-600/60">
                              {deal.id}
                            </span>
                            {isOverdue && (
                              <span className="flex items-center text-[10px] font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
                                <AlertCircle className="w-3 h-3 mr-0.5" />
                                Overdue
                              </span>
                            )}
                          </div>

                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setOpenMenuId(openMenuId === deal.id ? null : deal.id)
                              }}
                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {/* Dropdown Menu */}
                            {openMenuId === deal.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-6 z-20 w-44 bg-white dark:bg-slate-850 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 text-xs"
                              >
                                <button
                                  onClick={() => {
                                    setOpenMenuId(null)
                                    onEditDeal(deal)
                                  }}
                                  className="w-full px-3 py-1.5 text-left flex items-center space-x-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                                  <span>{t.editDeal}</span>
                                </button>

                                <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                  {t.quickMove}
                                </div>
                                {STAGES.filter((s) => s.key !== deal.stage).map((s) => (
                                  <button
                                    key={s.key}
                                    onClick={async () => {
                                      setOpenMenuId(null)
                                      await onStageChange(deal.id, s.key)
                                    }}
                                    className="w-full px-3 py-1 text-left flex items-center space-x-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px]"
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${s.badgeColor.dot}`} />
                                    <span className="truncate">{lang === 'th' ? s.shortTh : s.shortEn}</span>
                                  </button>
                                ))}

                                <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                                <button
                                  onClick={() => {
                                    setOpenMenuId(null)
                                    onDeleteDeal(deal)
                                  }}
                                  className="w-full px-3 py-1.5 text-left flex items-center space-x-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>{t.deleteDeal}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Company & Deal Name */}
                        <div
                          onClick={() => onEditDeal(deal)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center text-xs font-semibold text-slate-500 dark:text-slate-400 mb-0.5 truncate">
                            <Building className="w-3 h-3 mr-1 shrink-0 text-slate-400" />
                            <span className="truncate">{deal.company}</span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            {deal.deal_name}
                          </h4>
                        </div>

                        {/* Value & Weighted */}
                        <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-baseline justify-between">
                          <div>
                            <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                              {formatCurrency(deal.deal_value, lang)}
                            </span>
                          </div>
                          <div className="text-[11px] text-right">
                            <span className="text-slate-400 dark:text-slate-500">
                              ~{formatCurrency(deal.weighted_value, lang)}
                            </span>
                          </div>
                        </div>

                        {/* Lost reason badge (if Lost) */}
                        {isClosedLost && deal.lost_reason && (
                          <div className="mt-2 text-[11px] font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-900 flex items-center">
                            <XCircle className="w-3 h-3 mr-1 shrink-0 text-rose-500" />
                            <span className="truncate">{deal.lost_reason}</span>
                          </div>
                        )}

                        {/* Actual close badge (if Won) */}
                        {isClosedWon && (
                          <div className="mt-2 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900 flex items-center">
                            <CheckCircle2 className="w-3 h-3 mr-1 shrink-0 text-emerald-500" />
                            <span>
                              {lang === 'th' ? 'ปิดสำเร็จเมื่อ' : 'Closed on'}{' '}
                              {formatDate(deal.actual_close_date, lang)}
                            </span>
                          </div>
                        )}

                        {/* Next Step Notes snippet */}
                        {deal.next_step_notes && (
                          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 bg-slate-50 dark:bg-slate-750 p-1.5 rounded-lg border border-slate-100 dark:border-slate-700 italic">
                            &ldquo;{deal.next_step_notes}&rdquo;
                          </p>
                        )}

                        {/* Footer: Owner & Expected Close Date */}
                        <div className="mt-2.5 pt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <div className="flex items-center space-x-1.5">
                            <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[10px]">
                              {deal.owner.charAt(0)}
                            </div>
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {deal.owner}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{formatDate(deal.expected_close, lang)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
