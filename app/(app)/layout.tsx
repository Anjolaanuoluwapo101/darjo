import AppShell from "@/components/layout/AppShell";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      <AppShell>{children}</AppShell>
    </NotificationProvider>
  );
}
