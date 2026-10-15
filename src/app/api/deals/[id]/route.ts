import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getStageProbability, calculateWeightedValue } from '@/lib/constants'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deal = await prisma.deal.findUnique({
      where: { id },
    })

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    return NextResponse.json(deal)
  } catch (error) {
    console.error('Error fetching deal:', error)
    return NextResponse.json({ error: 'Failed to fetch deal' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existingDeal = await prisma.deal.findUnique({
      where: { id },
    })

    if (!existingDeal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    const stage = body.stage !== undefined ? body.stage : existingDeal.stage
    const dealValue = body.deal_value !== undefined ? parseFloat(body.deal_value) : existingDeal.deal_value

    // Determine win probability
    let winProb: number
    if (body.win_probability !== undefined && body.win_probability !== '') {
      winProb = parseFloat(body.win_probability)
    } else if (body.stage && body.stage !== existingDeal.stage) {
      winProb = getStageProbability(stage)
    } else {
      winProb = existingDeal.win_probability
    }

    if (isNaN(winProb)) winProb = getStageProbability(stage)
    const weightedVal = calculateWeightedValue(dealValue, winProb)

    // Handle actual_close_date logic
    let actualClose = existingDeal.actual_close_date
    if (body.actual_close_date !== undefined) {
      actualClose = body.actual_close_date ? new Date(body.actual_close_date) : null
    } else if (
      (stage.includes('Closed Won') || stage.includes('Closed Lost')) &&
      !existingDeal.stage.includes('Closed Won') &&
      !existingDeal.stage.includes('Closed Lost')
    ) {
      actualClose = new Date()
    } else if (!stage.includes('Closed Won') && !stage.includes('Closed Lost')) {
      actualClose = null
    }

    const updated = await prisma.deal.update({
      where: { id },
      data: {
        deal_name: body.deal_name !== undefined ? body.deal_name : existingDeal.deal_name,
        company: body.company !== undefined ? body.company : existingDeal.company,
        contact_person: body.contact_person !== undefined ? body.contact_person : existingDeal.contact_person,
        stage,
        deal_value: dealValue,
        win_probability: winProb,
        weighted_value: weightedVal,
        owner: body.owner !== undefined ? body.owner : existingDeal.owner,
        expected_close: body.expected_close ? new Date(body.expected_close) : existingDeal.expected_close,
        actual_close_date: actualClose,
        lost_reason: stage.includes('Closed Lost')
          ? (body.lost_reason !== undefined ? body.lost_reason : existingDeal.lost_reason)
          : null,
        next_step_notes: body.next_step_notes !== undefined ? body.next_step_notes : existingDeal.next_step_notes,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating deal:', error)
    return NextResponse.json({ error: 'Failed to update deal' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.deal.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error('Error deleting deal:', error)
    return NextResponse.json({ error: 'Failed to delete deal' }, { status: 500 })
  }
}
