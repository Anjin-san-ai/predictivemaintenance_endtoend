export default function AgentNetworkPage() {
  return (
    <div className="fixed inset-0 w-full h-full" style={{ margin: 0, padding: 0 }}>
      <iframe
        src="/api/agent-network-html"
        className="w-full h-full border-0"
        title="Agent Network"
      />
    </div>
  );
}
