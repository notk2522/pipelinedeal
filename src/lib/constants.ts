export type StageKey =
  | '1. Lead / Qualification'
  | '2. Meeting / Needs Analysis'
  | '3. Proposal / Quote Sent'
  | '4. Negotiation / Contract'
  | '5. Closed Won'
  | '6. Closed Lost'

export interface DealData {
  id: string
  deal_name: string
  company: string
  contact_person: string
  stage: StageKey | string
  deal_value: number
  win_probability: number
  weighted_value: number
  owner: string
  created_date: string | Date
  expected_close: string | Date
  actual_close_date?: string | Date | null
  lost_reason?: string | null
  next_step_notes?: string | null
  createdAt?: string | Date
  updatedAt?: string | Date
}

export interface StageConfig {
  key: StageKey
  labelTh: string
  labelEn: string
  shortTh: string
  shortEn: string
  probability: number
  badgeColor: {
    bg: string
    text: string
    border: string
    dot: string
    bar: string
  }
}

export const STAGES: StageConfig[] = [
  {
    key: '1. Lead / Qualification',
    labelTh: '1. ลีด / คัดกรองเบื้องต้น',
    labelEn: '1. Lead / Qualification',
    shortTh: 'ลีดใหม่',
    shortEn: 'Lead',
    probability: 10,
    badgeColor: {
      bg: 'bg-sky-50 dark:bg-sky-950/40',
      text: 'text-sky-700 dark:text-sky-300',
      border: 'border-sky-200 dark:border-sky-800',
      dot: 'bg-sky-500',
      bar: 'bg-sky-500',
    },
  },
  {
    key: '2. Meeting / Needs Analysis',
    labelTh: '2. ประชุม / วิเคราะห์ความต้องการ',
    labelEn: '2. Meeting / Needs Analysis',
    shortTh: 'นัดคุย/วิเคราะห์',
    shortEn: 'Meeting',
    probability: 30,
    badgeColor: {
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      text: 'text-indigo-700 dark:text-indigo-300',
      border: 'border-indigo-200 dark:border-indigo-800',
      dot: 'bg-indigo-500',
      bar: 'bg-indigo-500',
    },
  },
  {
    key: '3. Proposal / Quote Sent',
    labelTh: '3. ส่งใบเสนอราคา / แผนงาน',
    labelEn: '3. Proposal / Quote Sent',
    shortTh: 'ส่งใบเสนอราคา',
    shortEn: 'Proposal',
    probability: 60,
    badgeColor: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
      dot: 'bg-amber-500',
      bar: 'bg-amber-500',
    },
  },
  {
    key: '4. Negotiation / Contract',
    labelTh: '4. เจรจาต่อรอง / สัญญา',
    labelEn: '4. Negotiation / Contract',
    shortTh: 'เจรจาสัญญา',
    shortEn: 'Negotiation',
    probability: 80,
    badgeColor: {
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-800',
      dot: 'bg-purple-500',
      bar: 'bg-purple-500',
    },
  },
  {
    key: '5. Closed Won',
    labelTh: '5. ปิดการขายสำเร็จ (Won)',
    labelEn: '5. Closed Won',
    shortTh: 'สำเร็จ (Won)',
    shortEn: 'Closed Won',
    probability: 100,
    badgeColor: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800',
      dot: 'bg-emerald-500',
      bar: 'bg-emerald-500',
    },
  },
  {
    key: '6. Closed Lost',
    labelTh: '6. ปิดการขายไม่สำเร็จ (Lost)',
    labelEn: '6. Closed Lost',
    shortTh: 'ไม่สำเร็จ (Lost)',
    shortEn: 'Closed Lost',
    probability: 0,
    badgeColor: {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800',
      dot: 'bg-rose-500',
      bar: 'bg-rose-500',
    },
  },
]

export const DEFAULT_OWNERS = ['สมชาย', 'วิภา', 'อภิรักษ์']

export const LOST_REASONS = [
  { value: 'ราคาแพงเกินไป', labelTh: 'ราคาแพงเกินไป', labelEn: 'Price too high' },
  { value: 'สเปกไม่ตรง', labelTh: 'สเปกไม่ตรงความต้องการ', labelEn: 'Specs mismatch' },
  { value: 'ลูกค้ายกเลิกงบ', labelTh: 'ลูกค้ายกเลิกงบ / ชะลอโครงการ', labelEn: 'Budget cancelled / postponed' },
  { value: 'เลือกคู่แข่ง', labelTh: 'เลือกคู่แข่งเจ้าอื่น', labelEn: 'Chose competitor' },
  { value: 'อื่นๆ', labelTh: 'อื่นๆ (ระบุในหมายเหตุ)', labelEn: 'Other (specify in notes)' },
]

export function getStageProbability(stageKey: string): number {
  const stage = STAGES.find((s) => s.key === stageKey)
  return stage ? stage.probability : 10
}

export function calculateWeightedValue(dealValue: number, winProbability: number): number {
  const prob = Math.max(0, Math.min(100, winProbability))
  return Math.round((dealValue * (prob / 100)) * 100) / 100
}

export function formatCurrency(amount: number, locale: 'th' | 'en' = 'th'): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '฿0'
  return new Intl.NumberFormat(locale === 'th' ? 'th-TH' : 'en-US', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateInput: string | Date | null | undefined, locale: 'th' | 'en' = 'th'): string {
  if (!dateInput) return '-'
  const d = new Date(dateInput)
  if (isNaN(d.getTime())) return '-'
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d)
}
