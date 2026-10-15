'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { LanguageProvider, useLanguage } from '@/context/LanguageContext'
import { Header } from '@/components/Header'
import { KpiCards } from '@/components/KpiCards'
import { PeriodFilter } from '@/components/PeriodFilter'
import { StageBreakdown } from '@/components/StageBreakdown'
import { KanbanBoard } from '@/components/KanbanBoard'
import { TableView } from '@/components/TableView'
import { DealModal } from '@/components/DealModal'
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal'
import { DealData } from '@/lib/constants'
import {
  Loader2,
  Plus,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Inbox,
  Calendar,
} from 'lucide-react'

function DashboardContent() {
  const { lang, t } = useLanguage()

  // Deals state
  const [deals, setDeals] = useState<DealData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSeeding, setIsSeeding] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Active view: 'kanban' | 'table'
  const [activeView, setActiveView] = useState<'kanban' | 'table'>('kanban')
  const [selectedStageFilter, setSelectedStageFilter] = useState<string | null>(null)

  // Period / Year Filter: 'ALL' or specific year like '2026', '2025'
  const [currentYearStr, setCurrentYearStr] = useState<string>('2026')
  const [selectedYear, setSelectedYear] = useState<string>('ALL')

  useEffect(() => {
    setCurrentYearStr(new Date().getFullYear().toString())
  }, [])

  // Modal states
  const [isDealModalOpen, setIsDealModalOpen] = useState(false)
  const [currentEditDeal, setCurrentEditDeal] = useState<DealData | null>(null)

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [dealToDelete, setDealToDelete] = useState<DealData | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Toast notification helper
  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 3500)
  }

  // Fetch all deals
  const fetchDeals = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/deals')
      if (res.ok) {
        const data = await res.json()
        setDeals(data)
      }
    } catch (err) {
      console.error('Failed to fetch deals:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDeals()
  }, [fetchDeals])

  // Helper: extract close year from deal (expected_close, or actual_close_date, or created_date)
  const getDealYear = useCallback((deal: DealData): string => {
    const dateToUse = deal.actual_close_date || deal.expected_close || deal.created_date
    if (!dateToUse) return currentYearStr
    const d = new Date(dateToUse)
    return isNaN(d.getTime()) ? currentYearStr : d.getFullYear().toString()
  }, [currentYearStr])

  // Extract all distinct available years
  const availableYears = useMemo(() => {
    const yearSet = new Set<string>()
    const currentYearNum = parseInt(currentYearStr, 10)
    yearSet.add((currentYearNum + 1).toString()) // 2027
    yearSet.add(currentYearStr) // 2026
    yearSet.add((currentYearNum - 1).toString()) // 2025

    deals.forEach((d) => {
      const y = getDealYear(d)
      if (y) yearSet.add(y)
    })

    return Array.from(yearSet).sort((a, b) => parseInt(b, 10) - parseInt(a, 10))
  }, [deals, currentYearStr, getDealYear])

  // Filter deals by Selected Year (or ALL)
  const periodDeals = useMemo(() => {
    if (selectedYear === 'ALL') return deals
    return deals.filter((d) => getDealYear(d) === selectedYear)
  }, [deals, selectedYear, getDealYear])

  // Further filter by Stage (if stage breakdown chip is selected)
  const displayedDeals = useMemo(() => {
    if (!selectedStageFilter) return periodDeals
    return periodDeals.filter((d) => d.stage === selectedStageFilter)
  }, [periodDeals, selectedStageFilter])

  // Handle Save (Create or Update)
  const handleSaveDeal = async (dealData: Partial<DealData>) => {
    try {
      if (currentEditDeal) {
        // Update existing deal
        const res = await fetch(`/api/deals/${currentEditDeal.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dealData),
        })
        if (res.ok) {
          const updated = await res.json()
          setDeals((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
          showToast(t.dealUpdatedSuccess)
        }
      } else {
        // Create new deal
        const res = await fetch('/api/deals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dealData),
        })
        if (res.ok) {
          const created = await res.json()
          setDeals((prev) => [created, ...prev])
          showToast(t.dealCreatedSuccess)
        }
      }
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!dealToDelete) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/deals/${dealToDelete.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setDeals((prev) => prev.filter((d) => d.id !== dealToDelete.id))
        setIsDeleteModalOpen(false)
        setDealToDelete(null)
        showToast(t.dealDeletedSuccess)
      }
    } catch (err) {
      console.error(err)
      alert(t.errorOccurred)
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle Clear All Deals
  const handleClearAll = async () => {
    if (!confirm(t.clearAllConfirm)) return
    try {
      const res = await fetch('/api/deals', { method: 'DELETE' })
      if (res.ok) {
        setDeals([])
        showToast(t.clearAllSuccess)
      }
    } catch (err) {
      console.error(err)
      alert(t.errorOccurred)
    }
  }

  // Handle Stage Change (Drag & Drop or dropdown)
  const handleStageChange = async (dealId: string, newStage: string) => {
    const targetDeal = deals.find((d) => d.id === dealId)
    if (!targetDeal) return

    // If moving to Closed Lost and deal has no lost reason, open edit modal
    if (newStage.includes('Closed Lost') && !targetDeal.lost_reason) {
      setCurrentEditDeal({
        ...targetDeal,
        stage: newStage,
      })
      setIsDealModalOpen(true)
      return
    }

    // Optimistic UI update
    setDeals((prev) =>
      prev.map((d) => {
        if (d.id === dealId) {
          return {
            ...d,
            stage: newStage,
          }
        }
        return d
      })
    )

    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      })
      if (res.ok) {
        const updated = await res.json()
        setDeals((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
        showToast(t.stageMovedSuccess)
      } else {
        // Revert on failure
        fetchDeals()
      }
    } catch (err) {
      console.error(err)
      fetchDeals()
    }
  }

  // Handle Reset / Seed Demo Data
  const handleResetSeed = async () => {
    if (!confirm(t.resetSeedConfirm)) return
    setIsSeeding(true)
    try {
      const res = await fetch('/api/deals/seed', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setDeals(data.deals)
        showToast(t.seedSuccess)
      }
    } catch (err) {
      console.error(err)
      alert(t.errorOccurred)
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Header
        onNewDeal={() => {
          setCurrentEditDeal(null)
          setIsDealModalOpen(true)
        }}
        onResetSeed={handleResetSeed}
        onClearAll={handleClearAll}
        activeView={activeView}
        onViewChange={setActiveView}
        isSeeding={isSeeding}
        dealCount={deals.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* Period / Year Selector Filter */}
        <PeriodFilter
          selectedYear={selectedYear}
          onSelectYear={setSelectedYear}
          availableYears={availableYears}
          totalDealsCount={deals.length}
          filteredDealsCount={periodDeals.length}
        />

        {/* KPI Cards Overview (Calculated for selected period) */}
        <KpiCards deals={periodDeals} selectedYear={selectedYear} />

        {/* Stage Breakdown Progress & Filter */}
        <StageBreakdown
          deals={periodDeals}
          selectedStage={selectedStageFilter}
          onSelectStage={setSelectedStageFilter}
        />

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {lang === 'th' ? 'กำลังโหลดข้อมูลดีลการขาย...' : 'Loading pipeline deals...'}
            </p>
          </div>
        ) : deals.length === 0 ? (
          /* Empty Pipeline Hero State */
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8 sm:p-14 text-center shadow-xs">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 mb-4">
              <TrendingUp className="w-8 h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {t.noDealsYet}
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {t.noDealsYetSubtitle}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => {
                  setCurrentEditDeal(null)
                  setIsDealModalOpen(true)
                }}
                className="flex items-center space-x-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-md shadow-blue-600/30 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t.createFirstDeal}</span>
              </button>
              <button
                onClick={handleResetSeed}
                disabled={isSeeding}
                className="flex items-center space-x-2 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 rounded-xl transition-all cursor-pointer"
              >
                <RotateCcw className={`w-4 h-4 text-slate-500 ${isSeeding ? 'animate-spin' : ''}`} />
                <span>{t.resetSeed}</span>
              </button>
            </div>
          </div>
        ) : displayedDeals.length === 0 ? (
          /* Filtered Period Empty State */
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center">
            <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {t.noDealsInPeriod} {selectedYear !== 'ALL' && `(${selectedYear})`}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {lang === 'th'
                ? 'ไม่มีรายการดีลที่คาดว่าจะปิดในช่วงเวลาที่เลือก คุณสามารถเลือกดูยอดรวมทั้งหมด หรือสร้างดีลใหม่ได้'
                : 'No deals match the selected timeframe. Switch to All-Time or create a new deal.'}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setSelectedYear('ALL')}
                className="px-3.5 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
              >
                {t.showAllDeals} ({deals.length})
              </button>
              <button
                onClick={() => {
                  setCurrentEditDeal(null)
                  setIsDealModalOpen(true)
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
              >
                + {t.newDeal}
              </button>
            </div>
          </div>
        ) : (
          /* Main Views (Kanban or Table) */
          <div className="transition-all">
            {activeView === 'kanban' ? (
              <KanbanBoard
                deals={displayedDeals}
                onEditDeal={(deal) => {
                  setCurrentEditDeal(deal)
                  setIsDealModalOpen(true)
                }}
                onDeleteDeal={(deal) => {
                  setDealToDelete(deal)
                  setIsDeleteModalOpen(true)
                }}
                onStageChange={handleStageChange}
              />
            ) : (
              <TableView
                deals={displayedDeals}
                initialStageFilter={selectedStageFilter}
                onEditDeal={(deal) => {
                  setCurrentEditDeal(deal)
                  setIsDealModalOpen(true)
                }}
                onDeleteDeal={(deal) => {
                  setDealToDelete(deal)
                  setIsDeleteModalOpen(true)
                }}
                onStageChange={handleStageChange}
              />
            )}
          </div>
        )}
      </main>

      {/* Floating Action / Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl shadow-xl border border-slate-700 dark:border-slate-200 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Create / Edit Deal Modal */}
      <DealModal
        isOpen={isDealModalOpen}
        deal={currentEditDeal}
        onClose={() => {
          setIsDealModalOpen(false)
          setCurrentEditDeal(null)
        }}
        onSave={handleSaveDeal}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        dealId={dealToDelete?.id || ''}
        dealName={dealToDelete?.deal_name || ''}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setDealToDelete(null)
        }}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  )
}

export default function Home() {
  return (
    <LanguageProvider>
      <DashboardContent />
    </LanguageProvider>
  )
}
