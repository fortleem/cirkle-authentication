import { db } from '../src/lib/db'

const APPS = [
  {
    slug: 'cirkle-search',
    name: 'Cirkle Search',
    description: 'Unified search engine and discovery layer for the entire Cirkle ecosystem. Searches across apps, content, and integrations.',
    category: 'Search',
    color: '#10b981',
    icon: 'search',
    homepage: 'https://github.com/cirkle-superapp/circle-search',
    redirectUrl: 'https://cirkle-search.cirkle.app/auth/callback',
    featured: true,
    status: 'active',
  },
  {
    slug: 'cirkle-superapp',
    name: 'Cirkle SuperApp',
    description: 'The flagship super-app that brings together all Cirkle services into one unified experience.',
    category: 'Platform',
    color: '#14b8a6',
    icon: 'layout-dashboard',
    homepage: 'https://github.com/cirkle-superapp/CIRKLE',
    redirectUrl: 'https://cirkle-superapp.vercel.app/auth/callback',
    featured: true,
    status: 'active',
  },
  {
    slug: 'cirkle-mail',
    name: 'Cirkle Mail',
    description: 'Secure encrypted email service with smart inbox, AI triage, and end-to-end encryption.',
    category: 'Communication',
    color: '#f59e0b',
    icon: 'mail',
    homepage: 'https://github.com/cirkle-superapp/MAIL',
    redirectUrl: 'https://cirkle-mail.vercel.app/auth/callback',
    featured: true,
    status: 'active',
  },
  {
    slug: 'mashahd',
    name: 'Mashahd',
    description: 'Media streaming and content platform for video, live broadcasts, and on-demand entertainment.',
    category: 'Media',
    color: '#ef4444',
    icon: 'play-circle',
    homepage: 'https://github.com/cirkle-superapp/mashahd',
    redirectUrl: 'https://mashahd.vercel.app/auth/callback',
    featured: true,
    status: 'active',
  },
  {
    slug: 'verify',
    name: 'Cirkle Verify',
    description: 'Identity verification, KYC, document validation, and anti-fraud services for the ecosystem.',
    category: 'Security',
    color: '#8b5cf6',
    icon: 'shield-check',
    homepage: 'https://github.com/cirkle-superapp/verify',
    redirectUrl: 'https://cirkle-verify.vercel.app/auth/callback',
    featured: false,
    status: 'active',
  },
  {
    slug: 'wasl',
    name: 'Wasl',
    description: 'Connectivity and presence platform enabling real-time sync across Cirkle apps and devices.',
    category: 'Infrastructure',
    color: '#0ea5e9',
    icon: 'wifi',
    homepage: 'https://github.com/cirkle-superapp/wasl',
    redirectUrl: 'https://cirkle-wasl.vercel.app/auth/callback',
    featured: false,
    status: 'active',
  },
  {
    slug: 'aurienta',
    name: 'Aurienta',
    description: 'AI-driven content authoring and knowledge management with intelligent assistants.',
    category: 'AI',
    color: '#a855f7',
    icon: 'sparkles',
    homepage: 'https://github.com/Aurienta/Aurienta',
    redirectUrl: 'https://aurienta.vercel.app/auth/callback',
    featured: true,
    status: 'active',
  },
  {
    slug: 'sgtx',
    name: 'SGTX',
    description: 'Vessel tracking, AIS streaming, and maritime intelligence for global fleet monitoring.',
    category: 'Maritime',
    color: '#0891b2',
    icon: 'ship',
    homepage: 'https://github.com/SGTX-PILOT/SGTX',
    redirectUrl: 'https://sgtx.vercel.app/auth/callback',
    featured: false,
    status: 'active',
  },
  {
    slug: 'mtq',
    name: 'Mithqal (MTQ)',
    description: 'Precious metals market data, trading intelligence, and financial signals dashboard.',
    category: 'Finance',
    color: '#ca8a04',
    icon: 'coins',
    homepage: 'https://github.com/MITHQALMTQ/MTQ',
    redirectUrl: 'https://mithqal.vercel.app/auth/callback',
    featured: false,
    status: 'active',
  },
  {
    slug: 'judge-smart',
    name: 'Judge Smart',
    description: 'Legal intelligence and case analytics platform powered by AI reasoning.',
    category: 'Legal',
    color: '#7c3aed',
    icon: 'scale',
    homepage: 'https://github.com/fortleem/judge_synapse',
    redirectUrl: 'https://judge-smart.vercel.app/auth/callback',
    featured: false,
    status: 'active',
  },
  {
    slug: 'ppe',
    name: 'PPE Smart',
    description: 'Personal protective equipment compliance, monitoring, and workplace safety platform.',
    category: 'Safety',
    color: '#16a34a',
    icon: 'hard-hat',
    homepage: 'https://github.com/fortleem/PPE',
    redirectUrl: 'https://ppe-smart.vercel.app/auth/callback',
    featured: false,
    status: 'active',
  },
  {
    slug: 'mtq-sigma',
    name: 'MTQ Sigma',
    description: 'Advanced quantitative analytics and portfolio risk engine for the Mithqal suite.',
    category: 'Finance',
    color: '#b45309',
    icon: 'trending-up',
    homepage: 'https://github.com/MITHQALMTQ/MTQ_SIGMA',
    redirectUrl: 'https://mtq-sigma.vercel.app/auth/callback',
    featured: false,
    status: 'active',
  },
  {
    slug: 'wedjat',
    name: 'Wedjat',
    description: 'AI healthcare and diagnostics assistant with vision-language medical reasoning.',
    category: 'Health',
    color: '#dc2626',
    icon: 'heart-pulse',
    homepage: 'https://github.com/WEDJATAI/WEDJAT',
    redirectUrl: 'https://wedjat.vercel.app/auth/callback',
    featured: true,
    status: 'active',
  },
  {
    slug: 'wedjat-brainai',
    name: 'Wedjat Brain AI',
    description: 'Neural reasoning core powering medical decision support and clinical intelligence.',
    category: 'AI',
    color: '#be123c',
    icon: 'brain',
    homepage: 'https://github.com/WEDJATAI/Wedjat_BrainAI',
    redirectUrl: 'https://wedjatbrain-ai.vercel.app/auth/callback',
    featured: false,
    status: 'active',
  },
  {
    slug: 'wedjatrsm',
    name: 'WedjatRSM',
    description: 'Research study management platform for clinical workflows and trial data.',
    category: 'Research',
    color: '#9333ea',
    icon: 'flask-conical',
    homepage: 'https://github.com/WEDJATAI/wedjatrsm',
    redirectUrl: 'https://wedjatrsm.vercel.app/auth/callback',
    featured: false,
    status: 'active',
  },
  {
    slug: 'olympex',
    name: 'Olymp-Ex',
    description: 'Export trade and logistics platform connecting suppliers, buyers, and customs.',
    category: 'Trade',
    color: '#0d9488',
    icon: 'globe',
    homepage: 'https://github.com/fortleem/olympex_export',
    redirectUrl: 'https://olympex.vercel.app/auth/callback',
    featured: false,
    status: 'active',
  },
  {
    slug: 'egycourt',
    name: 'EgyCourt',
    description: 'Egyptian judicial case management and legal proceedings platform.',
    category: 'Legal',
    color: '#15803d',
    icon: 'gavel',
    homepage: 'https://github.com/egycourt/egycourt',
    redirectUrl: 'https://egycourt.vercel.app/auth/callback',
    featured: false,
    status: 'active',
  },
  {
    slug: 'sgtx-fable',
    name: 'SGTX Fable',
    description: 'Narrative intelligence and storytelling engine for maritime situational awareness.',
    category: 'Maritime',
    color: '#155e75',
    icon: 'book-open',
    homepage: 'https://github.com/fortleem/SGTX_FABLE',
    redirectUrl: 'https://sgtx-fable.vercel.app/auth/callback',
    featured: false,
    status: 'active',
  },
]

async function main() {
  console.log('🌱 Seeding Cirkle ecosystem apps...')

  for (const app of APPS) {
    await db.connectedApp.upsert({
      where: { slug: app.slug },
      update: { ...app },
      create: { ...app },
    })
    console.log(`  ✓ ${app.name}`)
  }

  // Create a demo user so the dashboard can be explored
  const { hashPassword } = await import('../src/lib/auth')
  const existingDemo = await db.user.findUnique({ where: { email: 'demo@cirkle.app' } })
  if (!existingDemo) {
    const passwordHash = await hashPassword('cirkle2025')
    await db.user.create({
      data: {
        email: 'demo@cirkle.app',
        name: 'Cirkle Demo',
        passwordHash,
        role: 'member',
        emailVerified: true,
      },
    })
    console.log('  ✓ Demo user created (demo@cirkle.app / cirkle2025)')
  } else {
    console.log('  • Demo user already exists')
  }

  const count = await db.connectedApp.count()
  console.log(`\n✅ Seed complete. ${count} connected apps in the Cirkle ecosystem.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
