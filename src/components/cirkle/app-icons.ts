'use client'

import {
  Search,
  LayoutDashboard,
  Mail,
  PlayCircle,
  ShieldCheck,
  Wifi,
  Sparkles,
  Ship,
  Coins,
  Scale,
  HardHat,
  TrendingUp,
  HeartPulse,
  Brain,
  FlaskConical,
  Globe,
  Gavel,
  BookOpen,
  AppWindow,
  type LucideIcon,
} from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  search: Search,
  'layout-dashboard': LayoutDashboard,
  mail: Mail,
  'play-circle': PlayCircle,
  'shield-check': ShieldCheck,
  wifi: Wifi,
  sparkles: Sparkles,
  ship: Ship,
  coins: Coins,
  scale: Scale,
  'hard-hat': HardHat,
  'trending-up': TrendingUp,
  'heart-pulse': HeartPulse,
  brain: Brain,
  'flask-conical': FlaskConical,
  globe: Globe,
  gavel: Gavel,
  'book-open': BookOpen,
}

export function getAppIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? AppWindow
}
