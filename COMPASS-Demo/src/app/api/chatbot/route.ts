import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

const A400_API_URL = process.env.A400_API_URL || 'http://localhost:3000';

interface ManualChunk {
  title: string;
  content: string;
  index: number;
}

interface ManualData {
  source: string;
  totalPages: number | string;
  chunksCount: number;
  extractedAt: string;
  chunks: ManualChunk[];
}

// Load maintenance manual chunks once (at module load time, server-side)
let manualData: ManualData | null = null;
function getManualChunks(): ManualChunk[] {
  if (manualData) return manualData.chunks;
  const filePath = join(process.cwd(), 'src', 'data', 'maintenance-manual-chunks.json');
  if (!existsSync(filePath)) return [];
  try {
    manualData = JSON.parse(readFileSync(filePath, 'utf-8'));
    return manualData?.chunks || [];
  } catch {
    return [];
  }
}

/**
 * Simple keyword-based retrieval: finds the top-N most relevant chunks
 * for the user's message without needing a vector database.
 */
function findRelevantChunks(query: string, chunks: ManualChunk[], topN = 3): ManualChunk[] {
  const words = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3);

  if (words.length === 0) return chunks.slice(0, topN);

  const scored = chunks.map(chunk => {
    const haystack = (chunk.title + ' ' + chunk.content).toLowerCase();
    let score = 0;
    for (const word of words) {
      const re = new RegExp(word, 'g');
      const matches = haystack.match(re);
      if (matches) score += matches.length;
    }
    return { chunk, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .filter(s => s.score > 0)
    .map(s => s.chunk);
}

/** Fetch a short fleet health snapshot to inject into context */
async function getFleetContext(): Promise<string> {
  try {
    const res = await fetch(`${A400_API_URL}/api/squadron-summary`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return '';
    const data = await res.json();
    return `Fleet status: ${data.totalFlights} aircraft total, ${data.flightsAllGood} Good, ${data.flightsWithWarnings} Warning, ${data.flightsWithCritical} Critical, ${data.deployableCount} deployable (${data.deployablePct}%).`;
  } catch {
    return '';
  }
}

/** Fetch parts summary */
async function getPartsContext(): Promise<string> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/parts`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return '';
    const parts = await res.json();
    const outOfStock = parts.filter((p: any) => p.status === 'OUT_OF_STOCK').length;
    const lowStock = parts.filter((p: any) => p.status === 'LOW_STOCK').length;
    const onOrder = parts.filter((p: any) => p.status === 'ON_ORDER').length;
    return `Parts inventory: ${parts.length} parts total — ${outOfStock} out of stock, ${lowStock} low stock, ${onOrder} on order.`;
  } catch {
    return '';
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history = [], flightId } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'missing message' }, { status: 400 });
    }

    // Gather context in parallel
    const [fleetContext, partsContext] = await Promise.all([getFleetContext(), getPartsContext()]);

    // Find relevant maintenance manual chunks
    const chunks = getManualChunks();
    const relevantChunks = findRelevantChunks(message, chunks, 3);
    const manualContext =
      relevantChunks.length > 0
        ? `\n\nRelevant 737-300 Maintenance Manual sections:\n${relevantChunks
            .map(c => `[${c.title}]\n${c.content.slice(0, 600)}`)
            .join('\n\n---\n\n')}`
        : '';

    // Build enriched system prompt
    const systemPrompt = [
      'You are COMPASS AI — an intelligent maintenance and operations assistant for a military/transport aircraft fleet.',
      'You have access to live fleet health data from the Sentry AI Fleet Monitor (A400M aircraft), parts inventory from the COMPASS Repository, and the official 737-300 Series Maintenance Manual.',
      '',
      'Guidelines:',
      '- Answer questions about aircraft maintenance procedures, component health, parts availability, and flight scheduling.',
      '- When citing the maintenance manual, mention the section title.',
      '- Be concise and technical. Prioritise safety.',
      '- If a question is outside your knowledge, say so clearly.',
      '',
      fleetContext ? `Current fleet status (live): ${fleetContext}` : '',
      partsContext ? `Parts inventory summary (live): ${partsContext}` : '',
      manualContext,
    ]
      .filter(Boolean)
      .join('\n');

    let reply: string | null = null;

    // Build chat messages array for Azure OpenAI
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];
    if (Array.isArray(history)) {
      history.forEach((h: any) => {
        if (h && h.role && h.content) messages.push({ role: h.role, content: h.content });
      });
    }
    messages.push({ role: 'user', content: message });

    // Load Azure OpenAI config: env vars take priority, then fall back to bundled config
    let aiConfig: Record<string, any> = {};
    try {
      const cfgPath = join(process.cwd(), 'src', 'data', 'ai-config.json');
      if (existsSync(cfgPath)) {
        const raw = JSON.parse(readFileSync(cfgPath, 'utf-8'));
        if (Array.isArray(raw.kp)) raw.key = Buffer.from(raw.kp.join(''), 'base64').toString('utf-8');
        aiConfig = raw;
      }
    } catch { /* ignore */ }

    const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT || aiConfig.endpoint || '';
    const azureKey = process.env.AZURE_OPENAI_API_KEY || aiConfig.key || '';
    const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || aiConfig.deployment || 'gpt-4o';
    const apiVersion = process.env.OPENAI_API_VERSION || aiConfig.apiVersion || '2025-01-01-preview';

    // Primary path: call Azure OpenAI directly from COMPASS
    if (azureEndpoint && azureKey) {
      try {
        const url = `${azureEndpoint.replace(/\/+$/, '')}/openai/deployments/${azureDeployment}/chat/completions?api-version=${apiVersion}`;
        const aoaiRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'api-key': azureKey },
          body: JSON.stringify({ messages, max_tokens: 1024, temperature: 0.3 }),
          signal: AbortSignal.timeout(30000),
        });
        if (aoaiRes.ok) {
          const data = await aoaiRes.json();
          reply = data.choices?.[0]?.message?.content || null;
        } else {
          console.error('[chatbot] Azure OpenAI returned', aoaiRes.status, await aoaiRes.text().catch(() => ''));
        }
      } catch (e) {
        console.error('[chatbot] Azure OpenAI call failed:', e);
      }
    }

    // Fallback: proxy through A400 backend if direct Azure OpenAI is unavailable
    if (!reply) {
      try {
        const proxyBody = {
          message,
          history,
          flightId: flightId || null,
          bypassLocal: true,
          promptId: 'compassChatbot',
          _compassSystemInjection: systemPrompt,
        };
        const a400Res = await fetch(`${A400_API_URL}/api/ai-chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(proxyBody),
          signal: AbortSignal.timeout(25000),
        });
        if (a400Res.ok) {
          const data = await a400Res.json();
          reply = data.reply || null;
        }
      } catch {
        // A400 backend also unavailable
      }
    }

    // Final fallback: offline summary from local data
    if (!reply) {
      reply = [
        `I'm the COMPASS AI Assistant. Here's what I know right now:`,
        fleetContext ? `\n• ${fleetContext}` : '',
        partsContext ? `\n• ${partsContext}` : '',
        relevantChunks.length > 0
          ? `\n\nFrom the 737-300 Maintenance Manual:\n${relevantChunks.map(c => `**${c.title}**: ${c.content.slice(0, 300)}`).join('\n\n')}`
          : '',
        `\n\n*AI backend is currently unavailable. Showing cached data only.*`,
      ]
        .filter(Boolean)
        .join('');
    }

    return NextResponse.json({ reply });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'chatbot-error' }, { status: 500 });
  }
}
