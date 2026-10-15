import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getStageProbability, calculateWeightedValue } from '@/lib/constants'
import { initialDeals } from '@/lib/seed-data'

export async function GET() {
  try {
    let count = await prisma.deal.count()

    // Auto-seed if database is currently empty
    if (count === 0) {
      for (const d of initialDeals) {
        await prisma.deal.create({
          data: {
            id: d.id,
            deal_name: d.deal_name,
            company: d.company,
            contact_person: d.contact_person,
            stage: d.stage,
            deal_value: d.deal_value,
            win_probability: d.win_probability,
            weighted_value: d.weighted_value,
            owner: d.owner,
            created_date: new Date(d.created_date),
            expected_close: new Date(d.expected_close),
            actual_close_date: d.actual_close_date ? new Date(d.actual_close_date) : null,
            lost_reason: d.lost_reason || null,
            next_step_notes: d.next_step_notes || null,
          },
        })
      }
    }

    const deals = await prisma.deal.findMany({
      orderBy: { created_date: 'desc' },
    })

    return NextResponse.json(deals)
  } catch (error) {
    console.error('Error fetching deals:', error)
    return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Generate Deal ID if not supplied (e.g. D-1001, D-1002...)
    let dealId = body.id
    if (!dealId) {
      const allDeals = await prisma.deal.findMany({
        select: { id: true },
      })
      const numericIds = allDeals
        .map((d) => {
          const match = d.id.match(/^D-(\d+)$/)
          return match ? parseInt(match[1], 10) : 0
        })
        .filter((n) => !isNaN(n) && n > 0)

      const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 1000
      dealId = `D-${maxId + 1}`
    }

    const stage = body.stage || '1. Lead / Qualification'
    const dealValue = parseFloat(body.deal_value) || 0

    // Win probability: use provided or fallback to stage default
    let winProb = body.win_probability !== undefined && body.win_probability !== ''
      ? parseFloat(body.win_probability)
      : getStageProbability(stage)

    if (isNaN(winProb)) winProb = getStageProbability(stage)

    const weightedVal = calculateWeightedValue(dealValue, winProb)

    // Automatically set actual_close_date if stage is Closed Won or Closed Lost
    let actualClose = body.actual_close_date ? new Date(body.actual_close_date) : null
    if (!actualClose && (stage.includes('Closed Won') || stage.includes('Closed Lost'))) {
      actualClose = new Date()
    } else if (!stage.includes('Closed Won') && !stage.includes('Closed Lost')) {
      actualClose = null
    }

    const newDeal = await prisma.deal.create({
      data: {
        id: dealId,
        deal_name: body.deal_name,
        company: body.company,
        contact_person: body.contact_person,
        stage,
        deal_value: dealValue,
        win_probability: winProb,
        weighted_value: weightedVal,
        owner: body.owner || 'สมชาย',
        created_date: body.created_date ? new Date(body.created_date) : new Date(),
        expected_close: body.expected_close ? new Date(body.expected_close) : new Date(Date.now() + 30 * 86400000),
        actual_close_date: actualClose,
        lost_reason: stage.includes('Closed Lost') ? body.lost_reason || null : null,
        next_step_notes: body.next_step_notes || null,
      },
    })

    return NextResponse.json(newDeal, { status: 201 })
  } catch (error) {
    console.error('Error creating deal:', error)
    return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 })
  }
}
