import type { Metadata } from "next";
import { Sidebar } from "@/components/trading/Sidebar";
import { TopBar } from "@/components/trading/TopBar";

export const metadata: Metadata = {
  title: "Trading App — TradeSim",
};

export default function TradingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-onyx-surface font-body-md text-body-md text-onyx-on-surface">
      <Sidebar />
      <TopBar />
      <main className="min-h-screen w-full bg-onyx-surface px-space-md pb-space-lg pl-64 pt-14">
        <div className="flex w-full flex-col gap-space-md">{children}</div>
      </main>
    </div>
  );
}
