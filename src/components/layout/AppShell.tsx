"use client";

import { DesktopShell } from "@/components/layout/desktop/DesktopShell";
import { MobileShell } from "@/components/layout/mobile/MobileShell";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGate>
      <MobileShell>{children}</MobileShell>
      <DesktopShell>{children}</DesktopShell>
    </AdminAuthGate>
  );
}
