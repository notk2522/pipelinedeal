'use client'

import React, { useState, useEffect } from 'react'
import {
  DealData,
  STAGES,
  DEFAULT_OWNERS,
  LOST_REASONS,
  getStageProbability,
  calculateWeightedValue,
  formatCurrency,
} from '@/lib/constants'
import { useLanguage } from '@/context/LanguageContext'
import {
  X,
  Sparkles,
  Calendar,
  Building,
  User,
  AlertCircle,
  FileText,
  Tag,
  DollarSign,
  ChevronDown,
} from 'lucide-react'

interface DealModalProps {
  isOpen: boolean
  deal: DealData | null
  onClose: () => void
  onSave: (dealData: Partial<DealData>) => Promise<void>
}

export function DealModal({ isOpen, deal, onClose, onSave }: DealModalProps) {
  const { lang, t } = useLanguage()

  // Form states
  const [dealName, setDealName] = useState('')
  const [company, setCompany] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [stage, setStage] = useState('1. Lead / Qualification')
  const [dealValue, setDealValue] = useState<number | string>(0)
  const [winProbability, setWinProbability] = useState<number>(10)
  const [owner, setOwner] = useState('สมชาย')
  const [customOwner, setCustomOwner] = useState('')
  const [expectedClose, setExpectedClose] = useState('')
  const [actualCloseDate, setActualCloseDate] = useState('')
  const [lostReason, setLostReason] = useState('')
  const [customLostReason, setCustomLostReason] = useState('')
  const [nextStepNotes, setNextStepNotes] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form when deal changes or modal opens
  useEffect(() => {
    if (!isOpen) return

    if (deal) {
      setDealName(deal.deal_name || '')
      setCompany(deal.company || '')
      setContactPerson(deal.contact_person || '')
      setStage(deal.stage || '1. Lead / Qualification')
      setDealValue(deal.deal_value || 0)
      setWinProbability(deal.win_probability ?? getStageProbability(deal.stage))
      
      if (DEFAULT_OWNERS.includes(deal.owner)) {
        setOwner(deal.owner)
        setCustomOwner('')
      } else {
        setOwner('other')
        setCustomOwner(deal.owner || '')
      }

      setExpectedClose(
        deal.expected_close ? new Date(deal.expected_close).toISOString().split('T')[0] : ''
      )
      setActualCloseDate(
        deal.actual_close_date ? new Date(deal.actual_close_date).toISOString().split('T')[0] : ''
      )
      
      const foundReason = LOST_REASONS.find((r) => r.value === deal.lost_reason)
      if (foundReason) {
        setLostReason(deal.lost_reason || '')
        setCustomLostReason('')
      } else if (deal.lost_reason) {
        setLostReason('อื่นๆ')
        setCustomLostReason(deal.lost_reason)
      } else {
        setLostReason('')
        setCustomLostReason('')
      }

      setNextStepNotes(deal.next_step_notes || '')
    } else {
      // New deal default values
      setDealName('')
      setCompany('')
      setContactPerson('')
      setStage('1. Lead / Qualification')
      setDealValue('')
      setWinProbability(10)
      setOwner('สมชาย')
      setCustomOwner('')
      // Default expected close to 30 days from now
      const thirtyDays = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
      setExpectedClose(thirtyDays)
      setActualCloseDate('')
      setLostReason('')
      setCustomLostReason('')
      setNextStepNotes('')
    }
    setErrors({})
  }, [isOpen, deal])

  // Handle stage change: automatically calculate win probability and actual close date
  const handleStageChange = (newStage: string) => {
    setStage(newStage)
    const autoProb = getStageProbability(newStage)
    setWinProbability(autoProb)

    const todayStr = new Date().toISOString().split('T')[0]

    if (newStage.includes('Closed Won') || newStage.includes('Closed Lost')) {
      if (!actualCloseDate) {
        setActualCloseDate(todayStr)
      }
      if (newStage.includes('Closed Lost') && !lostReason) {
        setLostReason('ราคาแพงเกินไป')
      }
    } else {
      // Moving back to active stage
      setActualCloseDate('')
      setLostReason('')
      setCustomLostReason('')
    }
  }

  // Live calculation of weighted value
  const numValue = typeof dealValue === 'number' ? dealValue : parseFloat(dealValue) || 0
  const calculatedWeighted = calculateWeightedValue(numValue, winProbability)

  // Validate form
  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!dealName.trim()) newErrors.dealName = t.requiredField
    if (!company.trim()) newErrors.company = t.requiredField
    if (!contactPerson.trim()) newErrors.contactPerson = t.requiredField
    if (dealValue === '' || isNaN(numValue) || numValue < 0) {
      newErrors.dealValue = t.requiredField
    }
    if (owner === 'other' && !customOwner.trim()) {
      newErrors.owner = t.requiredField
    }
    if (stage.includes('Closed Lost') && !lostReason) {
      newErrors.lostReason = t.requiredField
    }
    if (stage.includes('Closed Lost') && lostReason === 'อื่นๆ' && !customLostReason.trim()) {
      newErrors.customLostReason = t.requiredField
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const finalOwner = owner === 'other' ? customOwner.trim() : owner
      let finalLostReason: string | null = null
      if (stage.includes('Closed Lost')) {
        finalLostReason = lostReason === 'อื่นๆ' ? customLostReason.trim() : lostReason
      }

      await onSave({
        deal_name: dealName.trim(),
        company: company.trim(),
        contact_person: contactPerson.trim(),
        stage,
        deal_value: numValue,
        win_probability: winProbability,
        weighted_value: calculatedWeighted,
        owner: finalOwner,
        expected_close: expectedClose ? new Date(expectedClose) : new Date(Date.now() + 30 * 86400000),
        actual_close_date: actualCloseDate ? new Date(actualCloseDate) : null,
        lost_reason: finalLostReason,
        next_step_notes: nextStepNotes.trim() || null,
      })
      onClose()
    } catch (err) {
      console.error(err)
      alert(t.errorOccurred)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
              {deal ? deal.id : '+'}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {deal ? t.editDeal : t.newDeal}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {deal ? `${deal.id} • ${deal.company}` : t.appSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Row 1: Deal Name & Company */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.fieldName} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={dealName}
                  onChange={(e) => setDealName(e.target.value)}
                  placeholder={t.fieldNamePlaceholder}
                  className={`w-full text-xs sm:text-sm px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all ${
                    errors.dealName
                      ? 'border-rose-400 dark:border-rose-600'
                      : 'border-slate-300 dark:border-slate-700 focus:border-blue-500'
                  }`}
                />
              </div>
              {errors.dealName && (
                <p className="mt-1 text-[11px] text-rose-500">{errors.dealName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.fieldCompany} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder={t.fieldCompanyPlaceholder}
                  className={`w-full text-xs sm:text-sm pl-9 pr-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all ${
                    errors.company
                      ? 'border-rose-400 dark:border-rose-600'
                      : 'border-slate-300 dark:border-slate-700 focus:border-blue-500'
                  }`}
                />
              </div>
              {errors.company && (
                <p className="mt-1 text-[11px] text-rose-500">{errors.company}</p>
              )}
            </div>
          </div>

          {/* Row 2: Contact Person & Owner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.fieldContact} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder={t.fieldContactPlaceholder}
                  className={`w-full text-xs sm:text-sm pl-9 pr-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all ${
                    errors.contactPerson
                      ? 'border-rose-400 dark:border-rose-600'
                      : 'border-slate-300 dark:border-slate-700 focus:border-blue-500'
                  }`}
                />
              </div>
              {errors.contactPerson && (
                <p className="mt-1 text-[11px] text-rose-500">{errors.contactPerson}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.fieldOwner} <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                >
                  {DEFAULT_OWNERS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                  <option value="other">{lang === 'th' ? '+ ระบุชื่ออื่น...' : '+ Other...'}</option>
                </select>
                {owner === 'other' && (
                  <input
                    type="text"
                    value={customOwner}
                    onChange={(e) => setCustomOwner(e.target.value)}
                    placeholder={t.fieldOwnerPlaceholder}
                    className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                )}
              </div>
              {errors.owner && <p className="mt-1 text-[11px] text-rose-500">{errors.owner}</p>}
            </div>
          </div>

          {/* Row 3: Stage Selector with colored badges */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t.fieldStage} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={stage}
                onChange={(e) => handleStageChange(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-hidden focus:border-blue-500"
              >
                {STAGES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {lang === 'th' ? s.labelTh : s.labelEn} ({s.probability}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4: Deal Value, Win Probability & Weighted Value Formula Preview */}
          <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Deal Value Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.fieldValue} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">฿</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={dealValue}
                    onChange={(e) => setDealValue(e.target.value)}
                    placeholder={t.fieldValuePlaceholder}
                    className={`w-full text-xs sm:text-sm pl-8 pr-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden ${
                      errors.dealValue
                        ? 'border-rose-400 dark:border-rose-600'
                        : 'border-slate-300 dark:border-slate-700 focus:border-blue-500'
                    }`}
                  />
                </div>
                {errors.dealValue && (
                  <p className="mt-1 text-[11px] text-rose-500">{errors.dealValue}</p>
                )}
              </div>

              {/* Win Probability % Input (Auto calculated but editable) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t.fieldWinProb}
                  </label>
                  <button
                    type="button"
                    onClick={() => setWinProbability(getStageProbability(stage))}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                    title="คืนค่า % ตาม Stage"
                  >
                    Reset ({getStageProbability(stage)}%)
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={winProbability}
                    onChange={(e) => setWinProbability(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold">%</span>
                </div>
                <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                  {t.fieldWinProbHint}
                </p>
              </div>
            </div>

            {/* Live Weighted Calculation Preview */}
            <div className="flex items-center justify-between pt-2 border-t border-blue-100 dark:border-blue-900/40 text-xs">
              <div className="flex items-center space-x-1.5 text-blue-700 dark:text-blue-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="font-semibold">{t.fieldWeighted}:</span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  ({formatCurrency(numValue, lang)} × {winProbability}%)
                </span>
              </div>
              <div className="text-sm font-bold text-blue-700 dark:text-blue-300">
                {formatCurrency(calculatedWeighted, lang)}
              </div>
            </div>
          </div>

          {/* Row 5: Expected Close & Actual Close */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.fieldExpectedClose}
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="date"
                  value={expectedClose}
                  onChange={(e) => setExpectedClose(e.target.value)}
                  className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.fieldActualClose}
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="date"
                  value={actualCloseDate}
                  onChange={(e) => setActualCloseDate(e.target.value)}
                  className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                />
              </div>
              <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                {t.fieldActualCloseHint}
              </p>
            </div>
          </div>

          {/* Row 6: Conditional Lost Reason (Shown ONLY when Closed Lost is selected) */}
          {stage.includes('Closed Lost') && (
            <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 space-y-2 animate-in fade-in duration-150">
              <label className="block text-xs font-semibold text-rose-800 dark:text-rose-300">
                {t.fieldLostReason} <span className="text-rose-500">*</span>
              </label>
              <select
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-rose-500"
              >
                <option value="">{t.fieldLostReasonSelect}</option>
                {LOST_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {lang === 'th' ? r.labelTh : r.labelEn}
                  </option>
                ))}
              </select>
              {errors.lostReason && (
                <p className="text-[11px] text-rose-600">{errors.lostReason}</p>
              )}

              {lostReason === 'อื่นๆ' && (
                <div>
                  <input
                    type="text"
                    value={customLostReason}
                    onChange={(e) => setCustomLostReason(e.target.value)}
                    placeholder="ระบุเหตุผลที่ลูกค้าปฏิเสธเพิ่มเติม..."
                    className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  {errors.customLostReason && (
                    <p className="mt-1 text-[11px] text-rose-600">
                      {errors.customLostReason}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Row 7: Next Step Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t.fieldNextNotes}
            </label>
            <textarea
              rows={3}
              value={nextStepNotes}
              onChange={(e) => setNextStepNotes(e.target.value)}
              placeholder={t.fieldNextNotesPlaceholder}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 resize-none"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-sm shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? t.saving : t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
