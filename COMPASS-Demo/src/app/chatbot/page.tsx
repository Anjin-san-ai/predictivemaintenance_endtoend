'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from '@/components';
import {
  Send,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw,
  BookOpen,
  Wrench,
  FlaskConical,
  Calendar,
  Boxes,
  ExternalLink,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface FleetHealthSummary {
  totalFlights: number;
  flightsAllGood: number;
  flightsWithWarnings: number;
  flightsWithCritical: number;
  deployableCount: number;
  deployablePct: number;
}

interface CriticalComponent {
  aircraftId: string;
  aircraftName: string;
  componentName: string;
  status: string;
  maintenanceDue: string;
}

const QUICK_ACTIONS = [
  { icon: Wrench, label: 'Fleet health summary', query: 'Give me a fleet health summary across all aircraft' },
  { icon: Boxes, label: 'Parts stock check', query: 'What parts are low on stock or out of stock?' },
  { icon: BookOpen, label: 'Landing gear procedure', query: 'What is the inspection procedure for landing gear?' },
  { icon: Calendar, label: 'Next maintenance', query: 'Which aircraft have maintenance due soon?' },
  { icon: FlaskConical, label: 'Engine fault codes', query: 'What are the common engine fault codes and how to address them?' },
  { icon: AlertCircle, label: 'Critical alerts', query: 'Which aircraft have critical components that need immediate attention?' },
];

function formatMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
      elements.push(<strong key={i} style={{ display: 'block', color: '#c8e8cc', marginTop: '8px', marginBottom: '2px' }}>{line.slice(2, -2)}</strong>);
    } else if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(<div key={i} style={{ display: 'flex', gap: '8px', marginLeft: '8px', marginBottom: '2px' }}><span style={{ color: '#2AF556', flexShrink: 0 }}>•</span><span>{line.slice(2)}</span></div>);
    } else if (/^\d+\.\s/.test(line)) {
      elements.push(<div key={i} style={{ display: 'flex', gap: '8px', marginLeft: '8px', marginBottom: '2px' }}><span style={{ color: '#2AF556', flexShrink: 0, minWidth: '16px' }}>{line.match(/^\d+/)?.[0]}.</span><span>{line.replace(/^\d+\.\s/, '')}</span></div>);
    } else if (line.startsWith('# ')) {
      elements.push(<div key={i} style={{ fontWeight: 700, fontSize: '15px', color: '#2AF556', marginTop: '12px', marginBottom: '4px' }}>{line.slice(2)}</div>);
    } else if (line.startsWith('## ')) {
      elements.push(<div key={i} style={{ fontWeight: 600, fontSize: '14px', color: '#c8e8cc', marginTop: '10px', marginBottom: '4px' }}>{line.slice(3)}</div>);
    } else if (line === '---') {
      elements.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid rgba(42,245,86,0.15)', margin: '8px 0' }} />);
    } else if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: '6px' }} />);
    } else {
      // Handle inline bold **text**
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      elements.push(
        <div key={i} style={{ marginBottom: '2px' }}>
          {parts.map((part, j) =>
            part.startsWith('**') && part.endsWith('**')
              ? <strong key={j} style={{ color: '#e8f0ea' }}>{part.slice(2, -2)}</strong>
              : part
          )}
        </div>
      );
    }
    i++;
  }
  return <>{elements}</>;
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Welcome to the COMPASS AI Assistant. I can help you with:

• **Fleet health** — live status of all A400M aircraft from Fleet Monitor
• **Parts & equipment** — stock levels, demand alerts, and availability
• **Maintenance procedures** — 737-300 Series Maintenance Manual reference
• **Flight scheduling** — maintenance-aware scheduling recommendations

Ask me anything, or use the quick-action buttons below to get started.`,
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fleetHealth, setFleetHealth] = useState<FleetHealthSummary | null>(null);
  const [criticalComponents, setCriticalComponents] = useState<CriticalComponent[]>([]);
  const [healthError, setHealthError] = useState(false);
  const [healthLoading, setHealthLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const historyRef = useRef<{ role: string; content: string }[]>([]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const fetchFleetHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const res = await fetch('/api/fleet-health');
      const data = await res.json();
      if (data.error) { setHealthError(true); return; }
      setFleetHealth(data.summary);
      setCriticalComponents([...data.criticalComponents.slice(0, 5), ...data.warningComponents.slice(0, 3)]);
      setHealthError(false);
    } catch {
      setHealthError(true);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFleetHealth();
    const interval = setInterval(fetchFleetHealth, 60000);
    return () => clearInterval(interval);
  }, [fetchFleetHealth]);

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    historyRef.current = [
      ...historyRef.current,
      { role: 'user', content: userMsg.content },
    ];

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          history: historyRef.current.slice(-10),
        }),
      });

      const data = await res.json();
      const replyContent = data.reply || data.error || 'Sorry, I could not generate a response.';

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        timestamp: new Date(),
      };

      historyRef.current = [...historyRef.current, { role: 'assistant', content: replyContent }];
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please check that the Fleet Monitor backend is running and try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const statusColor = (s: string) =>
    s === 'Critical' ? '#ff4757' : s === 'Warning' ? '#C76D41' : '#2AF556';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundImage: 'url(/background.jpeg)', backgroundSize: 'cover', backgroundPosition: 'center top', backgroundAttachment: 'fixed', color: 'var(--color-text-primary, #e8f0ea)', fontFamily: 'var(--font-primary, Inter, sans-serif)', position: 'relative' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,11,20,0.88)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* Left sidebar — fleet context */}
        <aside style={{
          width: '280px',
          flexShrink: 0,
          background: 'var(--color-bg-surface, #0E1C28)',
          borderRight: '1px solid var(--color-border-default, rgba(42,245,86,0.2))',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid rgba(42,245,86,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#c8e8cc', letterSpacing: '0.5px' }}>LIVE FLEET STATUS</span>
            <button
              onClick={fetchFleetHealth}
              disabled={healthLoading}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#3d5445', padding: '2px' }}
              title="Refresh fleet status"
            >
              <RefreshCw size={13} style={{ animation: healthLoading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            {healthError ? (
              <div style={{ padding: '12px', background: 'rgba(255,71,87,0.08)', borderRadius: '8px', border: '1px solid rgba(255,71,87,0.2)', fontSize: '12px', color: '#ff6b7a' }}>
                Fleet Monitor offline. Maintenance manual and parts data still available.
              </div>
            ) : healthLoading && !fleetHealth ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', fontSize: '12px', color: '#3d5445' }}>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Loading fleet data...
              </div>
            ) : fleetHealth ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                  {[
                    { label: 'Total', value: fleetHealth.totalFlights, color: '#c8e8cc' },
                    { label: 'Deployable', value: `${fleetHealth.deployablePct}%`, color: '#2AF556' },
                    { label: 'Warnings', value: fleetHealth.flightsWithWarnings, color: '#C76D41' },
                    { label: 'Critical', value: fleetHealth.flightsWithCritical, color: '#ff4757' },
                  ].map(stat => (
                    <div key={stat.label} style={{ padding: '10px', background: 'rgba(5,11,20,0.6)', borderRadius: '8px', border: '1px solid rgba(42,245,86,0.15)', textAlign: 'center' }}>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: stat.color, fontFamily: 'var(--font-mono)' }}>{stat.value}</div>
                      <div style={{ fontSize: '10px', color: '#3d5445', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {criticalComponents.length > 0 && (
                  <>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#3d5445', marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                      Active Alerts
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {criticalComponents.slice(0, 6).map((c, i) => (
                        <div key={i} style={{ padding: '8px', background: 'rgba(5,11,20,0.6)', borderRadius: '6px', border: `1px solid ${c.status === 'Critical' ? 'rgba(255,71,87,0.25)' : 'rgba(255,165,2,0.25)'}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor(c.status), flexShrink: 0 }} />
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#c8e8cc' }}>{c.aircraftId}</span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#607A60' }}>{c.componentName}</div>
                          <div style={{ fontSize: '10px', color: c.status === 'Critical' ? '#ff4757' : '#C76D41', marginTop: '2px' }}>
                            {c.status} · Due: {c.maintenanceDue}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div style={{ marginTop: '16px', padding: '10px', background: 'rgba(5,11,20,0.4)', borderRadius: '8px', border: '1px solid rgba(42,245,86,0.1)' }}>
                  <div style={{ fontSize: '10px', color: '#3d5445', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Quick Links</div>
                  {[
                    { label: 'Fleet Monitor (3D)', href: 'http://localhost:3001/fleet-monitor' },
                    { label: 'Parts Repository', href: 'http://localhost:3001/parts-and-equipment' },
                    { label: 'Smart Scheduling', href: 'http://localhost:3001' },
                  ].map(link => (
                    <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#2AF556', textDecoration: 'none', marginBottom: '4px', padding: '3px 0' }}
                    >
                      <ExternalLink size={10} /> {link.label}
                    </a>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </aside>

        {/* Main chat area */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* Chat header */}
          <div style={{ padding: '14px 24px', borderBottom: '1px solid rgba(42,245,86,0.2)', background: 'var(--color-bg-surface, #0E1C28)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'radial-gradient(circle at 30% 30%, rgba(42,245,86,0.9), rgba(96,122,96,0.5))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#2AF556', boxShadow: '0 0 14px -2px rgba(42,245,86,0.4)', fontFamily: 'var(--font-mono)' }}>
              AI
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '16px', color: '#e8f0ea' }}>COMPASS AI Assistant</div>
              <div style={{ fontSize: '11px', color: '#3d5445' }}>
                Powered by Fleet Monitor · Parts Repository · 737-300 Maintenance Manual
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  gap: '10px',
                  alignItems: 'flex-start',
                }}
              >
                {msg.role === 'assistant' && (
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'radial-gradient(circle at 30% 30%, rgba(42,245,86,0.8), rgba(96,122,96,0.4))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#2AF556', flexShrink: 0, marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                    AI
                  </div>
                )}
                <div
                  style={{
                    maxWidth: msg.role === 'user' ? '65%' : '80%',
                    padding: '12px 16px',
                    borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, rgba(42,245,86,0.35), rgba(42,245,86,0.15))'
                      : 'rgba(14,28,40,0.85)',
                    border: msg.role === 'user'
                      ? '1px solid rgba(42,245,86,0.4)'
                      : '1px solid rgba(42,245,86,0.15)',
                    fontSize: '14px',
                    lineHeight: 1.6,
                    color: '#e8f0ea',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
                  }}
                >
                  {msg.role === 'assistant' ? formatMarkdown(msg.content) : msg.content}
                  <div style={{ fontSize: '10px', color: '#3d5445', marginTop: '6px', textAlign: 'right' }}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'radial-gradient(circle at 30% 30%, rgba(42,245,86,0.8), rgba(96,122,96,0.4))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#2AF556', flexShrink: 0, fontFamily: 'var(--font-mono)' }}>
                  AI
                </div>
                <div style={{ padding: '12px 16px', borderRadius: '18px 18px 18px 4px', background: 'rgba(14,28,40,0.85)', border: '1px solid rgba(42,245,86,0.15)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      style={{
                        width: '7px', height: '7px', borderRadius: '50%', background: '#2AF556',
                        animation: 'chatPulse 1s ease-in-out infinite',
                        animationDelay: `${i * 0.18}s`,
                        display: 'inline-block',
                        boxShadow: '0 0 6px rgba(42,245,86,0.6)',
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick action chips */}
          <div style={{ padding: '10px 24px 0', display: 'flex', flexWrap: 'wrap', gap: '6px', borderTop: '1px solid rgba(42,245,86,0.1)' }}>
            {QUICK_ACTIONS.map(action => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => sendMessage(action.query)}
                  disabled={isLoading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '5px 12px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: 500,
                    border: '1px solid rgba(42,245,86,0.25)',
                    background: 'rgba(42,245,86,0.08)',
                    color: '#607A60',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 150ms ease',
                    opacity: isLoading ? 0.5 : 1,
                  }}
                  onMouseOver={e => { if (!isLoading) { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(42,245,86,0.18)'; (e.currentTarget as HTMLButtonElement).style.color = '#c8e8cc'; } }}
                  onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(42,245,86,0.08)'; (e.currentTarget as HTMLButtonElement).style.color = '#607A60'; }}
                >
                  <Icon size={11} /> {action.label}
                </button>
              );
            })}
          </div>

          {/* Input bar */}
          <div style={{ padding: '12px 24px 16px', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder="Ask about fleet health, maintenance procedures, parts availability…"
                rows={1}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(14,28,40,0.85)',
                  border: '1px solid rgba(42,245,86,0.3)',
                  borderRadius: '12px',
                  color: '#e8f0ea',
                  fontSize: '14px',
                  resize: 'none',
                  outline: 'none',
                  lineHeight: 1.5,
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  maxHeight: '120px',
                  overflowY: 'auto',
                }}
                onInput={e => {
                  const el = e.currentTarget;
                  el.style.height = 'auto';
                  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
                }}
              />
            </div>
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              style={{
                width: '44px', height: '44px',
                borderRadius: '12px',
                border: 'none',
                background: input.trim() && !isLoading
                  ? 'linear-gradient(135deg, #2AF556, #50f972)'
                  : 'rgba(42,245,86,0.2)',
                color: input.trim() && !isLoading ? '#fff' : '#3d5445',
                cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 200ms ease',
                flexShrink: 0,
              }}
            >
              {isLoading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={18} />}
            </button>
          </div>
        </main>
      </div>

      <style>{`
        @keyframes chatPulse {
          0%, 80%, 100% { transform: scale(0.4); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        textarea::placeholder { color: #3d5445; }
        textarea:focus { border-color: rgba(42,245,86,0.6) !important; box-shadow: 0 0 0 2px rgba(42,245,86,0.15); }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
        ::-webkit-scrollbar-thumb { background: rgba(42,245,86,0.3); border-radius: 3px; }
      `}</style>
      </div>
    </div>
  );
}
