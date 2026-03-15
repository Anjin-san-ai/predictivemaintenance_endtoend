'use client';

import { Header } from "@/components";

export default function AgentNetworkPage() {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <iframe
        src="/api/agent-network-html"
        className="flex-1 w-full border-0"
        title="Agent Network"
      />
    </div>
  );
}
