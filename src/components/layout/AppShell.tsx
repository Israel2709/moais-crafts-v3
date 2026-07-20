"use client";

import { DesktopShell } from "@/components/layout/desktop/DesktopShell";
import { MobileShell } from "@/components/layout/mobile/MobileShell";
import { AdminSecretGate } from "@/components/admin/AdminSecretGate";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminSecretGate>
      <MobileShell>{children}</MobileShell>
      <DesktopShell>{children}</DesktopShell>
    </AdminSecretGate>
  );
}
