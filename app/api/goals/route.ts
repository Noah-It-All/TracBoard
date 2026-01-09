import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
  return new Date(d.setDate(diff))
}

// GET /api/goals - Get current week's goals or specific week
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const weekStr = searchParams.get('week')
    
    let weekStartDate: Date
    if (weekStr) {
      weekStartDate = new Date(weekStr)
    } else {
      weekStartDate = getMonday(new Date())
    }
    
    // Normalize to midnight
    weekStartDate.setHours(0, 0, 0, 0)
    
    const weeklyGoal = await db.weeklyGoal.findUnique({
      where: { weekStartDate }
    })
    
    if (!weeklyGoal) {
      return NextResponse.json({ weeklyGoal: null, goals: [] })
    }
    
    const goals = await db.goal.findMany({
      where: { weeklyGoalId: weeklyGoal.id },
      orderBy: { order: 'asc' }
    })
    
    return NextResponse.json({ weeklyGoal, goals })
  } catch (error) {
    console.error('GET /api/goals error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    )
  }
}

// POST /api/goals - Create or update weekly goals
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { weekStartDate: weekStr, goals: goalsData, basecampPostId, basecampPostUrl } = body
    
    if (!weekStr || !Array.isArray(goalsData)) {
      return NextResponse.json(
        { error: 'weekStartDate and goals array are required' },
        { status: 400 }
      )
    }
    
    const weekStartDate = new Date(weekStr)
    weekStartDate.setHours(0, 0, 0, 0)
    
    // Check if weekly goal exists
    let weeklyGoal = await db.weeklyGoal.findUnique({
      where: { weekStartDate }
    })
    
    if (weeklyGoal) {
      // Update existing
      if (basecampPostId || basecampPostUrl) {
        weeklyGoal = await db.weeklyGoal.update({
          where: { id: weeklyGoal.id },
          data: {
            ...(basecampPostId && { basecampPostId }),
            ...(basecampPostUrl && { basecampPostUrl })
          }
        })
      }
      
      // Delete existing goals
      await db.goal.deleteMany({ where: { weeklyGoalId: weeklyGoal.id } })
    } else {
      // Create new
      weeklyGoal = await db.weeklyGoal.create({
        data: {
          weekStartDate,
          basecampPostId,
          basecampPostUrl
        }
      })
    }
    
    // Create goals
    const createdGoals = []
    for (let i = 0; i < goalsData.length; i++) {
      const goalData = goalsData[i]
      const goal = await db.goal.create({
        data: {
          weeklyGoalId: weeklyGoal.id,
          title: goalData.title,
          description: goalData.description,
          order: i
        }
      })
      createdGoals.push(goal)
    }
    
    return NextResponse.json({ weeklyGoal, goals: createdGoals })
  } catch (error) {
    console.error('POST /api/goals error:', error)
    return NextResponse.json(
      { error: 'Failed to create goals' },
      { status: 500 }
    )
  }
}

// PATCH /api/goals - Update a specific goal
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, title, description, isCompleted } = body
    
    if (!id) {
      return NextResponse.json(
        { error: 'Goal id is required' },
        { status: 400 }
      )
    }
    
    const goal = await db.goal.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(isCompleted !== undefined && { isCompleted })
      }
    })
    
    return NextResponse.json(goal)
  } catch (error) {
    console.error('PATCH /api/goals error:', error)
    return NextResponse.json(
      { error: 'Failed to update goal' },
      { status: 500 }
    )
  }
}

// DELETE /api/goals - Delete a goal, weekly goal, or clear all goals for a week
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const weeklyGoalId = searchParams.get('weeklyGoalId')
    const week = searchParams.get('week')
    const clearAll = searchParams.get('clearAll')
    
    if (id) {
      await db.goal.delete({ where: { id } })
      return NextResponse.json({ success: true })
    } else if (weeklyGoalId) {
      await db.weeklyGoal.delete({ where: { id: weeklyGoalId } })
      return NextResponse.json({ success: true })
    } else if (week && clearAll === 'true') {
      // Clear all goals for the specified week
      const weekStartDate = new Date(week)
      weekStartDate.setHours(0, 0, 0, 0)
      
      const weeklyGoal = await db.weeklyGoal.findUnique({
        where: { weekStartDate }
      })
      
      if (weeklyGoal) {
        await db.goal.deleteMany({ where: { weeklyGoalId: weeklyGoal.id } })
      }
      
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: 'id, weeklyGoalId, or week with clearAll=true is required' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('DELETE /api/goals error:', error)
    return NextResponse.json(
      { error: 'Failed to delete' },
      { status: 500 }
    )
  }
}
