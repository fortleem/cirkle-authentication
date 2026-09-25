import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const [apps, users, appsActive, featured] = await Promise.all([
    db.connectedApp.count(),
    db.user.count(),
    db.connectedApp.count({ where: { status: 'active' } }),
    db.connectedApp.count({ where: { featured: true } }),
  ])

  const categories = await db.connectedApp.groupBy({
    by: ['category'],
    _count: true,
    orderBy: { _count: { category: 'desc' } },
  })

  return NextResponse.json({
    apps,
    users,
    appsActive,
    featured,
    categories: categories.map((c) => ({ category: c.category, count: c._count })),
  })
}
