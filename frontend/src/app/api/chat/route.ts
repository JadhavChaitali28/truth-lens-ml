import { NextRequest, NextResponse } from 'next/server';
import { processNaturalLanguageQuery } from '../../../lib/agentEngine';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'AQ.Ab8RN6JlG-CEQTKXiVPtfPQs4JIv_Ot0VO1ArqZmVWNmbrl1Ww';
const GEMINI_MODEL = process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-2.5-flash';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, skus = [], sales = [], expenses = [], feedbacks = [], signals = [] } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const targetAgentId = body.targetAgentId || null;
    // System prompt grounding the Gemini model exclusively in Rajesh Hardware & Electricals context
    const enterpriseContext = `You are Vyapar AI — The 24/7 Autonomous AI Business Manager for Rajesh Hardware & Electricals (Thane West, Maharashtra) owned by Rajesh Bhai.
The system has 6 specialized collaborating agents:
1. orchestrator: Vyapar AI (Decision Manager & Autonomous Shop Partner)
2. sales: Sales Agent (Daily sales ₹48,750, profit ₹11,430, today forecast ₹52k-₹58k, copper wire velocity +38%)
3. inventory: Inventory Agent (Stock-out predictor: 1-inch PVC pipe out in 3 days [4 bundles left], copper wire out in 4 days [12 rolls left])
4. procurement: Procurement Agent (Checks regular suppliers: Mahesh Traders ₹12,450 [saves ₹670], Patel ₹13,120, Shree ₹12,980)
5. crm: CRM & Khata Agent (Overdue udhar ₹72,500: Sharma Construction ₹32k [92% recovery probability, pays on reminder], Sai Electric ₹21.5k, Om ₹19k)
6. finance: Finance Agent (6-month shelf space vs margin audit: LEDs 32% margin on 12% space vs Water pumps 8% margin on 30% space -> +₹18k-₹24k monthly profit decision)

${targetAgentId ? `USER HAS DIRECTLY TARGETED: [${targetAgentId}]. This agent must respond with domain expertise.` : 'Default to Vyapar AI Swarm Orchestration.'}

LIVE RAJESH HARDWARE TELEMETRY:
- Shop: Rajesh Hardware & Electricals (Thane West, Maharashtra)
- Owner: Rajesh Bhai
- Yesterday's Counter Sales: ₹48,750 (38 transactions via Cash and BharatPe QR) | Estimated Net Profit: ₹11,430 (23.4% margin)
- Today's Revenue Forecast: ₹52,000 – ₹58,000
- Uncollected Customer Receivables (Udhar / Khata): ₹72,500 across 3 accounts
  * Sharma Construction: ₹32,000 (14 days overdue, 92% recovery likelihood)
  * Sai Electric Works: ₹21,500 (8 days overdue, 78% recovery likelihood)
  * Om Enterprises: ₹19,000 (21 days overdue, 65% recovery likelihood)
- Inventory & Stock Status:
  * 1-inch Heavy PVC Conduit Pipe (25m bundle): 4 bundles left (depletion 1.3/day, OUT IN 3 DAYS) -> CRITICAL
  * Finolex 2.5 sq mm FR Copper Wire: 12 rolls left (depletion 3.0/day, OUT IN 4 DAYS, sales surged +38%) -> LOW STOCK
  * Philips & Havells 20W LED Battens & Bulbs: 85 units left (healthy, 32% high margin)
  * Crompton 1.0 HP Submersible Water Pumps: 14 units left (dead stock, 140 days, only 8% margin, blocking 30% shop floor)
- Supplier Quotes for 50 bundles PVC Pipe:
  * Mahesh Traders (Bhiwandi): ₹12,450, delivery tomorrow 10:00 AM (BEST OPTION - saves ₹670)
  * Patel Suppliers (Kalwa): ₹13,120, delivery 2 days
  * Shree Enterprises (Thane MIDC): ₹12,980, delivery tomorrow 6:00 PM
- Strategic Recommendation:
  * Shift floor space from water pumps (8% margin) to LED displays (32% margin) and contractor bundles for +₹18,000–₹24,000/month extra profit.`;

    const systemInstruction = `${enterpriseContext}

RESPONSE INSTRUCTIONS (CRISP & CLEAR EXECUTIVE STANDARD - INDIAN RUPEE ₹ ONLY):
1. Crisp, High-Signal Style: Deliver a concise, mathematically grounded, executive-ready response. Avoid repetitive fluff, wordiness, or unnecessary filler.
2. Lead with Bottom-Line: Open the finalAnswer immediately with the primary bottom-line finding (e.g., exact Net Profit rupee figure (₹) and margin).
3. Currency Standard: ALWAYS use Indian Rupee (₹) symbol and Indian numbering format where appropriate (e.g. ₹31,84,000 or ₹31.84L). NEVER use dollar signs ($).
4. Live Debate Turns (3-4 Turns Max): Generate 3 to 4 sharp, distinct turns among relevant agents (max 2-3 sentences per turn). Each agent must challenge or validate assumptions citing exact data points.
5. Markdown Document (.md View): Format "finalAnswer" as a clean executive markdown document with:
   - Header with clear document title
   - Concise bottom-line summary box / bullet points
   - Clean Markdown Table comparing status quo vs optimized projections
   - Actionable 3-point Execution Plan with exact rupee targets (₹)
6. Return valid JSON adhering strictly to this schema:
{
  "fileName": "kebab-case-document-name.md",
  "participatingAgents": ["orchestrator", "sales", "finance", "inventory"],
  "reasoningSteps": [
    {
      "agentId": "orchestrator",
      "agentName": "Display Name",
      "phase": "data_ingestion",
      "thought": "Sharp 2-sentence conversational argument or analysis...",
      "dataCited": ["Data Point 1", "Data Point 2"]
    }
  ],
  "finalAnswer": "Crisp executive markdown document with Indian Rupees (₹). Use bolding, tables, bullet points, and headers (###). Be exact, quantitative, and scannable.",
  "keyDataPoints": [
    { "label": "Key Metric", "value": "₹XX,XXX" }
  ],
  "suggestedActions": [
    { "label": "Action Button Label", "actionType": "reorder", "payload": {} }
  ]
}
IMPORTANT: Return ONLY the JSON object, with no markdown fences around it if possible, or within \`\`\`json.`;

    const userPrompt = `Executive User Query: "${query}"\nProvide a crisp, clear, and highly quantitative executive analysis in .md document format following the multi-agent discussion schema.`;

    const candidateModels = [
      GEMINI_MODEL,
      'gemini-2.5-flash',
      'gemini-flash-latest',
      'gemini-2.5-pro'
    ].filter((v, i, a) => a.indexOf(v) === i);

    let lastError = null;
    let data: any = null;
    let successfulModel = GEMINI_MODEL;

    // If key doesn't look like a standard Google AI Studio key, fall back immediately for instant performance
    const isAiStudioKey = GEMINI_API_KEY && GEMINI_API_KEY.startsWith('AIzaSy');

    if (isAiStudioKey) {
      for (const model of candidateModels) {
        try {
          const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
          const response = await fetch(apiUrl, {
            method: 'POST',
            signal: AbortSignal.timeout(4000),
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    { text: `${systemInstruction}\n\n${userPrompt}` }
                  ]
                }
              ],
              generationConfig: {
                temperature: 0.2,
                topP: 0.95,
              }
            })
          });

          if (response.ok) {
            data = await response.json();
            successfulModel = model;
            break;
          } else {
            const errText = await response.text();
            console.warn(`Gemini model ${model} failed (${response.status}):`, errText);
            lastError = `${model}: ${response.statusText}`;
            // If permission denied or bad request, key is invalid; no need to loop through models
            if (response.status === 400 || response.status === 401 || response.status === 403) {
              break;
            }
          }
        } catch (reqErr: any) {
          lastError = reqErr.message;
        }
      }
    }

    if (!data) {
      console.warn(`External Gemini API call failed (${lastError}), using local multi-agent engine fallback.`);
      const fallbackResult = processNaturalLanguageQuery(query, skus, sales, expenses, feedbacks, signals);
      return NextResponse.json({
        ...fallbackResult,
        queryText: query,
        model: 'citadel-multi-agent',
        fileName: fallbackResult.fileName || (query ? `${query.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32)}.md` : 'executive-forecast.md'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }
    const candidate = data.candidates?.[0];
    const rawText = candidate?.content?.parts?.[0]?.text || '';

    // Parse JSON from model output
    let parsedResult;
    try {
      // Clean markdown code fence if present
      const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.warn('Failed to parse strict JSON from Gemini, falling back to raw markdown response');
      parsedResult = {
        finalAnswer: rawText,
        reasoningSteps: [
          {
            agentId: 'orchestrator',
            agentName: 'Decision Support Agent (COO)',
            phase: 'data_ingestion',
            thought: `Processed query: "${query}" with Gemini 3.6 Flash.`,
            dataCited: ['Live Gemini Engine Active']
          },
          {
            agentId: 'orchestrator',
            agentName: 'Decision Support Agent (COO)',
            phase: 'final_synthesis',
            thought: 'Synthesized live AI response.',
            dataCited: ['Gemini 3.6 Flash Inference Complete']
          }
        ],
        participatingAgents: ['orchestrator'],
        keyDataPoints: [],
        suggestedActions: []
      };
    }

    return NextResponse.json({
      id: `msg-${Date.now()}`,
      sender: 'coo',
      queryText: query,
      model: GEMINI_MODEL,
      fileName: parsedResult.fileName || (query ? `${query.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32)}.md` : 'executive-forecast.md'),
      ...parsedResult,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

  } catch (err: any) {
    console.error('API /api/chat error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
