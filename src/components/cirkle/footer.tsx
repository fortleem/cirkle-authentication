import { CirkleLogo } from '@/components/cirkle/logo'
import { Github, Shield } from 'lucide-react'

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-background/40 backdrop-blur supports-[backdrop-filter]:bg-background/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <CirkleLogo size={26} withWordmark wordmarkClassName="text-xs" />
          <span className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Cirkle. One identity for the whole ecosystem.
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-primary" />
            SOC2-aligned · OAuth 2.0 · OIDC
          </span>
          <a
            href="https://github.com/cirkle-superapp"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <Github className="h-3.5 w-3.5" />
            cirkle-superapp
          </a>
        </div>
      </div>
    </footer>
  )
}
