'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { LanguageProvider, useLanguage } from '@/context/LanguageContext'
import { Header } from '@/components/Header'
import { KpiCards } from '@/components/KpiCards'
import { StageBreakdown } from '@/components/StageBreakdown'
import { KanbanBoard } from '@/components/KanbanBoard'
import { TableView } from '@/components/TableView'
import { DealModal } from '@/components/DealModal'
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal'
import { DealData } from '@/lib/constants'
import { Loader2, Plus, Sparkles, CheckCircle2 } from 'lucide-react'

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

  // Filter deals when stage filter from breakdown is active
  const displayedDeals = selectedStageFilter
    ? deals.filter((d) => d.stage === selectedStageFilter)
    : deals

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Header
        onNewDeal={() => {
          setCurrentEditDeal(null)
          setIsDealModalOpen(true)
        }}
        onResetSeed={handleResetSeed}
        activeView={activeView}
        onViewChange={setActiveView}
        isSeeding={isSeeding}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Cards Overview */}
        <KpiCards deals={deals} />

        {/* Stage Breakdown Progress & Filter */}
        <StageBreakdown
          deals={deals}
          selectedStage={selectedStageFilter}
          onSelectStage={setSelectedStageFilter}
        />

        {/* View Content (Kanban or Table) */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {lang === 'th' ? 'กำลังโหลดข้อมูลดีลการขาย...' : 'Loading pipeline deals...'}
            </p>
          </div>
        ) : (
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
