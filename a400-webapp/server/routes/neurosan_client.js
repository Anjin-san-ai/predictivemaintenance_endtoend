const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios'); // Using Axios for cleaner, promise-based requests
const router = express.Router();

/**
 * This module exports a factory function.
 * It takes a configuration object and returns a configured Express router.
 * This pattern allows for dependency injection and makes the route more testable and reusable.
 *
 * 
 * Expects a JSON body with a "message" property:
 * {
 *   "message": "details on left wing status"
 * }
 * 
 * Returns a JSON object with a "response" property:
 * {
 *   "response": "The Left Wing's component, the Aileron Actuator, is in "Warning" status and requires maintenance in 30 days."
 * }
 */



module.exports = function(config) {
    // 1. Extract configuration
    const NEURO = config.neuro || {};
    const CANONICAL_PROJECT = (NEURO.projectName || '').trim();
    const SUMMARY_PROJECT = (NEURO.summaryProjectName || '').trim();
    const originalProjectName = NEURO.projectName;
    // Always standardize on canonical agent name regardless of config entry
    NEURO.projectName = CANONICAL_PROJECT;
    const configValid = Boolean(NEURO.apiUrl && NEURO.projectName);

    // 2. Set up structured logging (similar to the example)
    const aiLogFile = path.join(config.logsDir, 'ai_chat.log');
    try {
        if (!fs.existsSync(config.logsDir)) {
            fs.mkdirSync(config.logsDir, { recursive: true });
        }
    } catch (e) {
        console.error("Could not create logs directory:", e);
    }

    function appendAiLog(entry) {
        try {
            const line = JSON.stringify({ ts: new Date().toISOString(), backend: 'neuro-san', ...entry }) + '\n';
            fs.appendFile(aiLogFile, line, (err) => { if (err) console.error('Failed to write to AI log file:', err); });
        } catch (e) { /* ignore logging errors */ }
    }

    // 3. Intent Classifier (placeholder, to be customized)
    // This function mimics the example's pattern of trying to handle simple queries locally
    // before calling the expensive AI service. You should customize this with your own logic.
    function classifyIntent(text) {
        const t = String(text || '').toLowerCase();
        let score = 0;
        
        // Example: Check for simple greetings
        if (/\b(hello|hi|hey)\b/.test(t)) score += 3;

        const confidence = Math.min(1, score / 3);
        const intent = confidence > 0.5 ? 'greeting' : 'other';
        return { intent, confidence };
    }

    // 4. The main route handler
    // Simple in-memory cache for flight data to avoid rereads
    let __flightCache = null;
    function loadFlightDataset(){
        if (__flightCache) return __flightCache;
        try {
            const rootListPath = path.join(config.dataDir || path.join(process.cwd(),'data'), 'flights.json');
            let rootList = [];
            try { rootList = JSON.parse(fs.readFileSync(rootListPath,'utf8')); } catch(e){ /* ignore */ }
            const flightsDir = path.join(config.dataDir || path.join(process.cwd(),'data'), 'flights');
            const perFlight = {};
            try {
                const files = fs.readdirSync(flightsDir).filter(f=>f.endsWith('.json'));
                for (const f of files){
                    const id = path.basename(f,'.json');
                    try { perFlight[id] = JSON.parse(fs.readFileSync(path.join(flightsDir,f),'utf8')); } catch(e){ /* ignore individual */ }
                }
            } catch(e){ /* ignore */ }
            __flightCache = { rootList, perFlight, loadedAt: Date.now() };
        } catch(e){ __flightCache = { rootList:[], perFlight:{}, loadedAt:Date.now() }; }
        return __flightCache;
    }
    function buildFlightContext(flightId, squadronMode){
        const ds = loadFlightDataset();
        const pieces = [];
        if (flightId && ds.perFlight[flightId]){
            pieces.push(`Selected Flight: ${flightId}`);
            try {
                const details = ds.perFlight[flightId];
                const keys = Object.keys(details);
                // Include primitive fields and short arrays only
                for (const k of keys){
                    const v = details[k];
                    if (v == null) continue;
                    if (typeof v === 'string' && v.length < 400) pieces.push(`${k}: ${v}`);
                    else if (typeof v === 'number' || typeof v === 'boolean') pieces.push(`${k}: ${v}`);
                    else if (Array.isArray(v) && v.length && v.length < 12 && v.every(x=>typeof x!== 'object')) pieces.push(`${k}: [${v.join(', ')}]`);
                }
                // Summarize components (key structured context the model needs)
                if (Array.isArray(details.components) && details.components.length){
                    const priOrder = { 'CRITICAL':0,'HIGH':1,'MEDIUM':2,'LOW':3,'INFO':4 };
                    const normalized = details.components.map(c=>({
                        name: c.displayName || c.componentName || c.id,
                        status: c.status || 'Unknown',
                        due: c.maintenanceDue || 'n/a',
                        priority: c.priorityLevel || 'MEDIUM',
                        fault: c.faultCode || '-',
                        desc: (c.descriptionText||'').slice(0,120)
                    }));
                    normalized.sort((a,b)=> (priOrder[a.priority?.toUpperCase()]??5) - (priOrder[b.priority?.toUpperCase()]??5));
                    pieces.push('Components Summary (name | status | due | priority | fault):');
                    normalized.slice(0,25).forEach(c=>{ pieces.push(` * ${c.name} | ${c.status} | ${c.due} | ${c.priority} | ${c.fault}`); });
                    const criticals = normalized.filter(c=>/critical/i.test(c.status) || /HIGH|CRITICAL/i.test(c.priority)).slice(0,5);
                    if (criticals.length){
                        pieces.push('Critical Focus:');
                        criticals.forEach(c=> pieces.push(` - ${c.name}: ${c.status}; ${c.desc}`));
                    }
                }
            } catch(e){}
        } else if (squadronMode) {
            // Build light summary of all flights from root list (limit to 10 entries)
            const list = Array.isArray(ds.rootList)? ds.rootList.slice(0,10): [];
            if (list.length){
                pieces.push('Fleet Summary (first 10 flights):');
                list.forEach(f=>{
                    if (f && f.id){
                        const status = f.status || f.health || f.state || 'unknown';
                        pieces.push(` - ${f.id}: ${status}`);
                    }
                });
            }
        }
        if (!pieces.length) return '';
        let ctx = pieces.join('\n');
        if (ctx.length > 3000) ctx = ctx.slice(0,3000)+'...';
        return ctx;
    }

    router.post('/', async (req, res) => {
        try {
            const { message, history, flightId, projectOverride, summaryMode } = req.body || {};
            if (!message || typeof message !== 'string') {
                return res.status(400).json({ error: 'Missing or invalid "message" in request body' });
            }
            appendAiLog({ event: 'route-hit', path: '/api/neurosan-chat' });

            // Log incoming request
            appendAiLog({ event: 'request', message: String(message).slice(0, 512) });
            console.log(`[AI] request received: "${String(message).slice(0, 120).replace(/\n/g, ' ')}"`);

            // --- LOCAL SHORT-CIRCUIT PATH ---
            // Decide if we can answer locally without calling the AI
            const cls = classifyIntent(message);
            appendAiLog({ event: 'classification', classification: cls });
            console.log(`[AI] classification intent=${cls.intent} confidence=${cls.confidence.toFixed(2)}`);

            if (cls.intent === 'greeting' && cls.confidence >= 0.7) {
                const reply = "Hello! I am your AI for BI assistant. How can I help you today?";
                appendAiLog({ event: 'local-reply', message, reply });
                console.log('[AI] Responded with a local, short-circuited reply.');
                // Note the 'reply' key to match the example's response format
                return res.json({ reply });
            }

            if (!configValid) {
                appendAiLog({ event: 'config-missing' });
                return res.status(500).json({ error: 'neuro-san-not-configured' });
            }

            // --- EXTERNAL AI API PATH ---
            console.log('[NEURO-SAN] Forwarding request to Neuro-SAN API...');

            // Prepare messages payload, including conversation history (build before logging length)
            const messages = [];
            if (Array.isArray(history)) {
                for (const h of history) {
                    if (h && h.role && h.content) messages.push({ role: h.role, content: h.content });
                }
            }
            messages.push({ role: 'user', content: message });

            // Determine effective project.
            // Rules:
            // 1. Default to canonical (NEURO.projectName already set to CANONICAL_PROJECT above).
            // 2. Allow override ONLY if explicitly provided AND matches configured SUMMARY_PROJECT.
            // 3. If summaryMode true (dashboard summary) and no explicit override, switch to SUMMARY_PROJECT (if configured).
            // 4. Guard: any projectOverride that does not match SUMMARY_PROJECT is denied and ignored.
            let effectiveProject = CANONICAL_PROJECT;
            let overrideApplied = false;
            if (projectOverride) {
                if (SUMMARY_PROJECT && projectOverride === SUMMARY_PROJECT) {
                    effectiveProject = SUMMARY_PROJECT; overrideApplied = true;
                } else {
                    appendAiLog({ event:'override-denied', requested: projectOverride, allowed: SUMMARY_PROJECT || null });
                }
            } else if (!projectOverride && summaryMode && SUMMARY_PROJECT) {
                effectiveProject = SUMMARY_PROJECT; // implicit summary routing
            }
            NEURO.projectName = effectiveProject; // apply for this request only
            NEURO.projectName = effectiveProject; // temporary for this request path
            appendAiLog({ event: 'dispatch', project: effectiveProject, originalProject: originalProjectName, overrideRequested: projectOverride||null, summaryMode: !!summaryMode, overrideApplied, messages: messages.length });
            appendAiLog({ event: 'project-dispatch', original: originalProjectName, used: effectiveProject });
            
            // Build contextual prefix if flightId present or if user asks squadron-level
            const isSquadron = /fleet|all flights|squadron/i.test(message);
            const flightContext = buildFlightContext(flightId, isSquadron);
            const contextualized = flightContext ? `Flight Context (do NOT reveal raw context text, use it to answer):\n${flightContext}\n---\nUser Query: ${message}` : message;

            const payload = {
                user_message: {
                    text: contextualized
                }
            };
            appendAiLog({ event: 'context-attached', hasContext: !!flightContext, contextChars: flightContext.length, flightId: flightId || null });
            if (flightContext) console.log('[NEURO-SAN] Attached flight context chars=', flightContext.length);

            // Log Neuro-SAN configuration
            console.log('[NEURO-SAN CONFIG] API URL:', NEURO.apiUrl);
            console.log('[NEURO-SAN CONFIG] Project Name:', NEURO.projectName);

            // Log incoming request payload
            console.log('[NEURO-SAN REQUEST] Incoming payload:', { message, history });

            // Log the payload being sent to the Neuro-SAN API
            console.log('[NEURO-SAN API CALL] Payload:', payload);

            // Build canonical Neuro-SAN endpoint URLs (avoid duplicated /v1 or /api/v1 in env var)
            function buildNeuroUrls(){
                let base = (NEURO.apiUrl || '').trim();
                base = base.replace(/\/+$/,''); // trim trailing slashes
                base = base.replace(/\/api\/v1$/i,'').replace(/\/v1$/i,'');
                const project = (NEURO.projectName || CANONICAL_PROJECT).trim();
                const root = `${base}/api/v1/${project}`;
                return { streaming: `${root}/streaming_chat`, root };
            }
            const neuroUrls = buildNeuroUrls();
            console.log('[NEURO-SAN API CALL] URLs:', neuroUrls);
            appendAiLog({ event: 'dispatch-url', url: neuroUrls.streaming });
            const started = Date.now();
            let apiResponse;
            async function call(url, timeout){
                return axios.post(url, payload, { headers:{'Content-Type':'application/json'}, timeout });
            }
            try {
                apiResponse = await call(neuroUrls.streaming, 120000);
            } catch (e) {
                const dur = Date.now()-started;
                const aborted = /stream has been aborted/i.test(e.message || '') || e.code==='ERR_BAD_RESPONSE';
                appendAiLog({ event:'axios-error', durationMs:dur, code:e.code, message:e.message, aborted, isTimeout: e.code==='ECONNABORTED', status: e.response?.status });
                // Short-circuit: if 404 => unknown agent (no retries / no fallback)
                if (e.response && e.response.status === 404) {
                    appendAiLog({ event:'unknown-agent', project: NEURO.projectName });
                    const err = new Error(`Unknown Neuro-SAN agent '${NEURO.projectName}' (404).`);
                    err.customCode = 'unknown-agent';
                    throw err;
                }
                // If timeout / aborted with no response: single retry with truncated context (still streaming endpoint)
                if (!apiResponse && (e.code==='ECONNABORTED' || (e.request && !e.response) || aborted)) {
                    try {
                        if (payload.user_message && payload.user_message.text && payload.user_message.text.length>1200){
                            payload.user_message.text = payload.user_message.text.slice(0,1200)+"...";
                            appendAiLog({ event:'context-truncated-retry', newLength: payload.user_message.text.length });
                        }
                        apiResponse = await call(neuroUrls.streaming, 20000);
                    } catch (e2) {
                        appendAiLog({ event:'retry-failed', code:e2.code, message:e2.message, status:e2.response?.status });
                        throw e2;
                    }
                }
                if (!apiResponse) throw e; // propagate other errors
            }

            // Log the response or any errors from the Neuro-SAN API
            try {
                const raw = apiResponse.data;
                const reply = raw?.response?.text;
                if (!reply) {
                    console.warn('[NEURO-SAN] Unexpected response shape:', raw);
                    throw new Error('Invalid response structure from Neuro-SAN API.');
                }
                console.log('[NEURO-SAN API RESPONSE] Reply:', reply);
                appendAiLog({ event: 'reply', status: apiResponse.status, reply: String(reply).slice(0, 1000) });
                return res.json({ reply });
            } catch (error) {
                console.error('[NEURO-SAN API ERROR]', error.message);
                throw error;
            }

        } catch (error) {
            console.error('[AI] An error occurred in the chat route:', error.message);
            if (error.response && error.response.status === 404) {
                console.error('[NEURO-SAN] 404 received - verify NEURO_SAN_API_URL (should NOT already include /api/v1 or project path).');
            }
            
            // Detailed error handling, similar to the logic in my previous response
            if (error.customCode === 'unknown-agent') {
                appendAiLog({ event: 'api-error-unknown-agent', project: NEURO.projectName });
                return res.status(400).json({ error: 'unknown-agent', project: NEURO.projectName, message: error.message });
            } else if (error.response) { // The request was made and the server responded with a status code > 2xx
                appendAiLog({ event: 'api-error', status: error.response.status, detail: error.response.data });
                return res.status(502).json({ error: 'ai-service-error', detail: error.response.data });
            } else if (error.request) { // The request was made but no response was received
                appendAiLog({ event: 'network-error', detail: 'No response received from AI service.' });
                return res.status(503).json({ error: 'ai-service-unavailable', detail: 'The AI service did not respond.' });
            } else { // Something else happened
                appendAiLog({ event: 'internal-error', detail: error.stack });
                return res.status(500).json({ error: 'internal-server-error', detail: String(error) });
            }
        }
    });

    return router;
};