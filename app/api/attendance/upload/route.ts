import { NextRequest, NextResponse } from 'next/server'
import { processWhiteboardImage } from '@/lib/gemini'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert file to base64 for Gemini
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')

    // Process image with Gemini OCR
    const result = await processWhiteboardImage(base64, file.type)

    // Process attendance records
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const attendancePromises = []

    // Store general OCR notes separately (only on first record if needed)
    const generalNotes = result.notes

    // Handle present members
    for (const name of result.present) {
      // Find or create team member
      let member = await db.teamMember.findFirst({
        where: { name: { equals: name, mode: 'insensitive' } },
      })

      if (!member) {
        member = await db.teamMember.create({
          data: { name },
        })
      }

      // Create or update attendance record
      attendancePromises.push(
        db.attendanceRecord.upsert({
          where: {
            teamMemberId_date: {
              teamMemberId: member.id,
              date: today,
            },
          },
          update: {
            isPresent: true,
          },
          create: {
            teamMemberId: member.id,
            date: today,
            isPresent: true,
          },
        })
      )
    }

    // Handle absent members
    for (const name of result.absent) {
      let member = await db.teamMember.findFirst({
        where: { name: { equals: name, mode: 'insensitive' } },
      })

      if (!member) {
        member = await db.teamMember.create({
          data: { name },
        })
      }

      attendancePromises.push(
        db.attendanceRecord.upsert({
          where: {
            teamMemberId_date: {
              teamMemberId: member.id,
              date: today,
            },
          },
          update: {
            isPresent: false,
          },
          create: {
            teamMemberId: member.id,
            date: today,
            isPresent: false,
          },
        })
      )
    }

    await Promise.all(attendancePromises)

    return NextResponse.json({
      success: true,
      processed: result,
    })
  } catch (error) {
    console.error('Error processing attendance upload:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to process image'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
