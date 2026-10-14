import type { ReactNode } from 'react';

/** Split layout for the signed-out pages: brand panel (wide screens) + form. */
export default function AuthLayout({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="grid min-h-svh bg-background lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-zinc-950 p-10 text-white lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(220,38,38,0.35),transparent_60%)]" />
        <div className="relative flex items-center gap-3">
          <img src="/dwom-logo.png" alt="" className="size-10 rounded-lg bg-white object-contain p-1" />
          <div>
            <p className="font-semibold leading-tight">DWOM</p>
            <p className="text-xs text-white/60">Admin console</p>
          </div>
        </div>
        <div className="relative max-w-md space-y-3">
          <p className="text-2xl leading-snug font-semibold text-balance">Fresh groceries, from the market to the door.</p>
          <p className="text-sm text-white/60">Orders, riders, stock and money for the whole operation, in one place.</p>
        </div>
        <p className="relative text-xs text-white/40">© {new Date().getFullYear()} DWOM</p>
      </div>

      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex items-center gap-2 lg:hidden">
            <img src="/dwom-logo.png" alt="" className="size-9 rounded-lg object-contain" />
            <span className="font-semibold">DWOM Admin</span>
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
