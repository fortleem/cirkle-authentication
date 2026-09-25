import { db } from '../src/lib/db'

/**
 * Dynamic authentication requirements per platform.
 * As Auth Manager, each Cirkle product is mapped to a specific requirement
 * profile that the consent flow enforces dynamically.
 *
 * identityType:       personal | business | either
 * verificationLevel:  basic (email) | enhanced (email+phone) | strict (KYC/docs)
 * twoFactorRequired:  whether 2FA is mandatory
 * businessRequired:   whether a verified business profile is mandatory
 * requiredScopes:     OAuth-style scope string handed to the app
 */
const APPS = [
  { slug: 'cirkle-search', name: 'Cirkle Search', description: 'Unified search engine and discovery layer for the entire Cirkle ecosystem. Searches across apps, content, and integrations.', category: 'Search', color: '#d4a017', icon: 'search', homepage: 'https://github.com/cirkle-superapp/circle-search', redirectUrl: 'https://cirkle-search.cirkle.app/auth/callback', featured: true, identityType: 'either', verificationLevel: 'basic', twoFactorRequired: false, businessRequired: false, requiredScopes: 'openid profile email search.read' },
  { slug: 'cirkle-superapp', name: 'Cirkle SuperApp', description: 'The flagship super-app that brings together all Cirkle services into one unified experience.', category: 'Platform', color: '#c9941a', icon: 'layout-dashboard', homepage: 'https://github.com/cirkle-superapp/CIRKLE', redirectUrl: 'https://cirkle-superapp.vercel.app/auth/callback', featured: true, identityType: 'either', verificationLevel: 'basic', twoFactorRequired: false, businessRequired: false, requiredScopes: 'openid profile email superapp.all' },
  { slug: 'cirkle-mail', name: 'Cirkle Mail', description: 'Secure encrypted email service with smart inbox, AI triage, and end-to-end encryption.', category: 'Communication', color: '#e0a82e', icon: 'mail', homepage: 'https://github.com/cirkle-superapp/MAIL', redirectUrl: 'https://cirkle-mail.vercel.app/auth/callback', featured: true, identityType: 'personal', verificationLevel: 'enhanced', twoFactorRequired: false, businessRequired: false, requiredScopes: 'openid profile email mail.send mail.read' },
  { slug: 'mashahd', name: 'Mashahd', description: 'Media streaming and content platform for video, live broadcasts, and on-demand entertainment.', category: 'Media', color: '#cf8a1a', icon: 'play-circle', homepage: 'https://github.com/cirkle-superapp/mashahd', redirectUrl: 'https://mashahd.vercel.app/auth/callback', featured: true, identityType: 'either', verificationLevel: 'basic', twoFactorRequired: false, businessRequired: false, requiredScopes: 'openid profile email media.read media.play' },
  { slug: 'verify', name: 'Cirkle Verify', description: 'Identity verification, KYC, document validation, and anti-fraud services for the ecosystem.', category: 'Security', color: '#b8860b', icon: 'shield-check', homepage: 'https://github.com/cirkle-superapp/verify', redirectUrl: 'https://cirkle-verify.vercel.app/auth/callback', featured: false, identityType: 'either', verificationLevel: 'strict', twoFactorRequired: true, businessRequired: false, requiredScopes: 'openid profile email verify.kyc verify.documents' },
  { slug: 'wasl', name: 'Wasl', description: 'Connectivity and presence platform enabling real-time sync across Cirkle apps and devices.', category: 'Infrastructure', color: '#daa520', icon: 'wifi', homepage: 'https://github.com/cirkle-superapp/wasl', redirectUrl: 'https://cirkle-wasl.vercel.app/auth/callback', featured: false, identityType: 'either', verificationLevel: 'enhanced', twoFactorRequired: false, businessRequired: false, requiredScopes: 'openid profile email devices.read devices.pair' },
  { slug: 'aurienta', name: 'Aurienta', description: 'AI-driven content authoring and knowledge management with intelligent assistants.', category: 'AI', color: '#d4af37', icon: 'sparkles', homepage: 'https://github.com/Aurienta/Aurienta', redirectUrl: 'https://aurienta.vercel.app/auth/callback', featured: true, identityType: 'either', verificationLevel: 'basic', twoFactorRequired: false, businessRequired: false, requiredScopes: 'openid profile email content.write' },
  { slug: 'sgtx', name: 'SGTX', description: 'Vessel tracking, AIS streaming, and maritime intelligence for global fleet monitoring.', category: 'Maritime', color: '#c19a2b', icon: 'ship', homepage: 'https://github.com/SGTX-PILOT/SGTX', redirectUrl: 'https://sgtx.vercel.app/auth/callback', featured: false, identityType: 'business', verificationLevel: 'enhanced', twoFactorRequired: true, businessRequired: true, requiredScopes: 'openid profile email fleet.read ais.read' },
  { slug: 'mtq', name: 'Mithqal (MTQ)', description: 'Precious metals market data, trading intelligence, and financial signals dashboard.', category: 'Finance', color: '#b8860b', icon: 'coins', homepage: 'https://github.com/MITHQALMTQ/MTQ', redirectUrl: 'https://mithqal.vercel.app/auth/callback', featured: false, identityType: 'either', verificationLevel: 'enhanced', twoFactorRequired: true, businessRequired: false, requiredScopes: 'openid profile email trades.read market.read' },
  { slug: 'judge-smart', name: 'Judge Smart', description: 'Legal intelligence and case analytics platform powered by AI reasoning.', category: 'Legal', color: '#c9a227', icon: 'scale', homepage: 'https://github.com/fortleem/judge_synapse', redirectUrl: 'https://judge-smart.vercel.app/auth/callback', featured: false, identityType: 'either', verificationLevel: 'enhanced', twoFactorRequired: true, businessRequired: false, requiredScopes: 'openid profile email cases.read legal.read' },
  { slug: 'ppe', name: 'PPE Smart', description: 'Personal protective equipment compliance, monitoring, and workplace safety platform.', category: 'Safety', color: '#bb8a1f', icon: 'hard-hat', homepage: 'https://github.com/fortleem/PPE', redirectUrl: 'https://ppe-smart.vercel.app/auth/callback', featured: false, identityType: 'business', verificationLevel: 'enhanced', twoFactorRequired: true, businessRequired: true, requiredScopes: 'openid profile email safety.read compliance.read' },
  { slug: 'mtq-sigma', name: 'MTQ Sigma', description: 'Advanced quantitative analytics and portfolio risk engine for the Mithqal suite.', category: 'Finance', color: '#a0741a', icon: 'trending-up', homepage: 'https://github.com/MITHQALMTQ/MTQ_SIGMA', redirectUrl: 'https://mtq-sigma.vercel.app/auth/callback', featured: false, identityType: 'business', verificationLevel: 'strict', twoFactorRequired: true, businessRequired: true, requiredScopes: 'openid profile email analytics.read quant.read' },
  { slug: 'wedjat', name: 'Wedjat', description: 'AI healthcare and diagnostics assistant with vision-language medical reasoning.', category: 'Health', color: '#cfa017', icon: 'heart-pulse', homepage: 'https://github.com/WEDJATAI/WEDJAT', redirectUrl: 'https://wedjat.vercel.app/auth/callback', featured: true, identityType: 'either', verificationLevel: 'strict', twoFactorRequired: true, businessRequired: false, requiredScopes: 'openid profile email health.read' },
  { slug: 'wedjat-brainai', name: 'Wedjat Brain AI', description: 'Neural reasoning core powering medical decision support and clinical intelligence.', category: 'AI', color: '#c09030', icon: 'brain', homepage: 'https://github.com/WEDJATAI/Wedjat_BrainAI', redirectUrl: 'https://wedjatbrain-ai.vercel.app/auth/callback', featured: false, identityType: 'either', verificationLevel: 'strict', twoFactorRequired: true, businessRequired: false, requiredScopes: 'openid profile email medical.reasoning' },
  { slug: 'wedjatrsm', name: 'WedjatRSM', description: 'Research study management platform for clinical workflows and trial data.', category: 'Research', color: '#b8961a', icon: 'flask-conical', homepage: 'https://github.com/WEDJATAI/wedjatrsm', redirectUrl: 'https://wedjatrsm.vercel.app/auth/callback', featured: false, identityType: 'either', verificationLevel: 'strict', twoFactorRequired: true, businessRequired: false, requiredScopes: 'openid profile email research.read clinical.read' },
  { slug: 'olympex', name: 'Olymp-Ex', description: 'Export trade and logistics platform connecting suppliers, buyers, and customs.', category: 'Trade', color: '#c19a2b', icon: 'globe', homepage: 'https://github.com/fortleem/olympex_export', redirectUrl: 'https://olympex.vercel.app/auth/callback', featured: false, identityType: 'business', verificationLevel: 'enhanced', twoFactorRequired: true, businessRequired: true, requiredScopes: 'openid profile email trade.documents customs.read' },
  { slug: 'egycourt', name: 'EgyCourt', description: 'Egyptian judicial case management and legal proceedings platform.', category: 'Legal', color: '#bb9a2a', icon: 'gavel', homepage: 'https://github.com/egycourt/egycourt', redirectUrl: 'https://egycourt.vercel.app/auth/callback', featured: false, identityType: 'either', verificationLevel: 'enhanced', twoFactorRequired: true, businessRequired: false, requiredScopes: 'openid profile email court.read' },
  { slug: 'sgtx-fable', name: 'SGTX Fable', description: 'Narrative intelligence and storytelling engine for maritime situational awareness.', category: 'Maritime', color: '#cda434', icon: 'book-open', homepage: 'https://github.com/fortleem/SGTX_FABLE', redirectUrl: 'https://sgtx-fable.vercel.app/auth/callback', featured: false, identityType: 'either', verificationLevel: 'basic', twoFactorRequired: false, businessRequired: false, requiredScopes: 'openid profile email narratives.read' },
]

async function main() {
  console.log('🌱 Seeding Cirkle ecosystem with dynamic auth requirements...')

  for (const app of APPS) {
    await db.connectedApp.upsert({
      where: { slug: app.slug },
      update: { ...app },
      create: { ...app },
    })
    console.log(`  ✓ ${app.name} [${app.identityType}/${app.verificationLevel}${app.twoFactorRequired ? '+2FA' : ''}${app.businessRequired ? '+Biz' : ''}]`)
  }

  // Demo user — the single Cirkle username reaching the whole ecosystem
  const { hashPassword } = await import('../src/lib/auth')
  const existingDemo = await db.user.findUnique({ where: { username: 'cirkle' } })
  if (!existingDemo) {
    const passwordHash = await hashPassword('cirkle2025')
    const demo = await db.user.create({
      data: {
        username: 'cirkle',
        email: 'demo@cirkle.app',
        name: 'Cirkle Demo',
        passwordHash,
        role: 'member',
        emailVerified: true,
        phone: '+20 100 000 0000',
        phoneVerified: true,
        twoFactorEnabled: false,
      },
    })

    // Demo business profile — personal + business connected under one username
    await db.business.create({
      data: {
        name: 'Cirkle Holdings',
        legalName: 'Cirkle Holdings LLC',
        taxId: 'CIRK-2025-LLC',
        type: 'llc',
        country: 'Egypt',
        industry: 'Technology',
        verified: true,
        ownerId: demo.id,
      },
    })
    // mark businessVerified on the user since they own a verified business
    await db.user.update({ where: { id: demo.id }, data: { businessVerified: true } })
    console.log('  ✓ Demo user created (username: cirkle / demo@cirkle.app / cirkle2025)')
    console.log('  ✓ Demo business "Cirkle Holdings" linked to the same identity')
  } else {
    console.log('  • Demo user already exists')
  }

  const count = await db.connectedApp.count()
  console.log(`\n✅ Seed complete. ${count} connected apps with dynamic auth requirements.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
