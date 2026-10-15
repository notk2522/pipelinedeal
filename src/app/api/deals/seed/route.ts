import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { initialDeals } from '@/lib/seed-data'

export async function POST() {
  try {
    // Delete existing deals
    await prisma.deal.deleteMany({})

    // Insert initial deals
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

    const allDeals = await prisma.deal.findMany({
      orderBy: { created_date: 'desc' },
    })

    return NextResponse.json({ success: true, count: allDeals.length, deals: allDeals })
  } catch (error) {
    console.error('Error seeding deals:', error)
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 })
  }
}
