// Prisma database adapter - Supabase/PostgreSQL for all environments
// Requires DATABASE_URL pointing to your Supabase Postgres instance

interface TeamMember {
  id: string
  name: string
  email?: string | null
  teamId?: string | null
  createdAt: Date
  updatedAt: Date
}

interface AttendanceRecord {
  id: string
  date: Date
  isPresent: boolean
  teamMemberId: string
  imageUrl?: string | null
  notes?: string | null
  createdAt: Date
}

interface Team {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
}

interface ConfigItem {
  id: string
  key: string
  value: string
  createdAt: Date
  updatedAt: Date
}

export type Database = {
  teamMember: {
    findFirst: (args: { where: { name: { equals: string; mode: 'insensitive' } } }) => Promise<TeamMember | null>
    create: (args: { data: { name: string; email?: string } }) => Promise<TeamMember>
    update: (args: { where: { id: string }; data: Partial<Pick<TeamMember, 'name' | 'email' | 'teamId'>> }) => Promise<TeamMember | null>
    findMany: () => Promise<TeamMember[]>
  }
  attendanceRecord: {
    create: (args: {
      data: { teamMemberId: string; date: string; isPresent: boolean; imageUrl?: string; notes?: string }
    }) => Promise<AttendanceRecord>
    upsert: (args: {
      where: { teamMemberId_date: { teamMemberId: string; date: Date } }
      update: { isPresent: boolean; imageUrl?: string; notes?: string }
      create: { teamMemberId: string; date: Date; isPresent: boolean; imageUrl?: string; notes?: string }
    }) => Promise<AttendanceRecord>
    delete: (args: {
      where: { teamMemberId_date: { teamMemberId: string; date: Date } }
    }) => Promise<AttendanceRecord>
    findMany: (args?: {
      where?: {
        teamMemberId?: string
        date?: { gte?: Date; lt?: Date }
      }
      include?: { teamMember: boolean }
      orderBy?: { date: 'desc' | 'asc' }
      take?: number
    }) => Promise<AttendanceRecord[]>
  }
  teamMemberWithRecords: {
    findMany: () => Promise<Array<TeamMember & { attendanceRecords: AttendanceRecord[] }>>
  }
  team: {
    create: (args: { data: { name: string } }) => Promise<Team>
    findMany: (args?: any) => Promise<any[]>
    update: (args: { where: { id: string }; data: Partial<Pick<Team, 'name'>> }) => Promise<Team | null>
  }
  config: {
    upsert: (args: { data: { key: string; value: string } }) => Promise<ConfigItem>
    findUnique: (args: { where: { key: string } }) => Promise<ConfigItem | null>
    findMany: () => Promise<ConfigItem[]>
  }
}

let dbInstance: Database | null = null
let prismaInstance: any = null

export function getDatabase(): Database {
  if (!dbInstance) {
    const { PrismaClient } = require('@prisma/client')
    
    // Create a global Prisma instance to avoid connection pool exhaustion
    if (!prismaInstance) {
      prismaInstance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
      })
    }
    const prisma = prismaInstance

    dbInstance = {
      teamMember: {
        findFirst: async (args) => {
          const result = await prisma.teamMember.findFirst(args)
          return result ? {
            id: result.id,
            name: result.name,
            email: result.email,
            teamId: result.teamId,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
          } : null
        },
        create: async (args) => {
          const result = await prisma.teamMember.create(args)
          return {
            id: result.id,
            name: result.name,
            email: result.email,
            teamId: result.teamId,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
          }
        },
        update: async (args) => {
          const result = await prisma.teamMember.update(args)
          return {
            id: result.id,
            name: result.name,
            email: result.email,
            teamId: result.teamId,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
          }
        },
        findMany: async () => {
          const results = await prisma.teamMember.findMany()
          return results.map((m: any) => ({
            id: m.id,
            name: m.name,
            email: m.email,
            teamId: m.teamId,
            createdAt: m.createdAt,
            updatedAt: m.updatedAt,
          }))
        },
      },
      attendanceRecord: {
        create: async (args) => {
          const result = await prisma.attendanceRecord.create(args)
          return {
            id: result.id,
            date: result.date,
            isPresent: result.isPresent,
            teamMemberId: result.teamMemberId,
            imageUrl: result.imageUrl,
            notes: result.notes,
            createdAt: result.createdAt,
          }
        },
        upsert: async (args) => {
          const result = await prisma.attendanceRecord.upsert(args)
          return {
            id: result.id,
            date: result.date,
            isPresent: result.isPresent,
            teamMemberId: result.teamMemberId,
            imageUrl: result.imageUrl,
            notes: result.notes,
            createdAt: result.createdAt,
          }
        },
        delete: async (args) => {
          const result = await prisma.attendanceRecord.delete(args)
          return {
            id: result.id,
            date: result.date,
            isPresent: result.isPresent,
            teamMemberId: result.teamMemberId,
            imageUrl: result.imageUrl,
            notes: result.notes,
            createdAt: result.createdAt,
          }
        },
        findMany: async (args) => {
          const results = await prisma.attendanceRecord.findMany(args)
          return results.map((r: any) => ({
            id: r.id,
            date: r.date,
            isPresent: r.isPresent,
            teamMemberId: r.teamMemberId,
            imageUrl: r.imageUrl,
            notes: r.notes,
            createdAt: r.createdAt,
          }))
        },
      },
      teamMemberWithRecords: {
        findMany: async () => {
          const results = await prisma.teamMember.findMany({
            include: {
              attendanceRecords: { orderBy: { date: 'desc' } },
              team: true,
            },
          })
          return results.map((m: any) => ({
            id: m.id,
            name: m.name,
            email: m.email,
            teamId: m.teamId,
            createdAt: m.createdAt,
            updatedAt: m.updatedAt,
            attendanceRecords: m.attendanceRecords.map((r: any) => ({
              id: r.id,
              date: r.date,
              isPresent: r.isPresent,
              teamMemberId: r.teamMemberId,
              imageUrl: r.imageUrl,
              notes: r.notes,
              createdAt: r.createdAt,
            })),
          }))
        },
      },
      team: {
        create: async (args) => {
          const result = await prisma.team.create(args)
          return {
            id: result.id,
            name: result.name,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
          }
        },
        findMany: async (args?: any) => {
          const results = await prisma.team.findMany(args)
          return results.map((t: any) => ({
            id: t.id,
            name: t.name,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
            ...(t.members && { members: t.members }),
          }))
        },
        update: async (args) => {
          const result = await prisma.team.update(args)
          return {
            id: result.id,
            name: result.name,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
          }
        },
      },
      config: {
        upsert: async (args) => {
          const result = await prisma.config.upsert(args)
          return {
            id: result.id,
            key: result.key,
            value: result.value,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
          }
        },
        findUnique: async (args) => {
          const result = await prisma.config.findUnique(args)
          return result ? {
            id: result.id,
            key: result.key,
            value: result.value,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
          } : null
        },
        findMany: async () => {
          const results = await prisma.config.findMany()
          return results.map((c: any) => ({
            id: c.id,
            key: c.key,
            value: c.value,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
          }))
        },
      },
    } as Database
  }

  return dbInstance
}

export const db = getDatabase()
