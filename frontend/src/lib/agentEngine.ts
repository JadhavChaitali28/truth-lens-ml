import { 
  AgentId, 
  SKUItem, 
  SalesRecord, 
  ExpenseRecord, 
  CustomerFeedback, 
  MarketSignal,
  AgentInsight,
  StrategicRecommendation,
  MultiAgentReasoningStep,
  ChatMessage
} from './types';

export function calculateBusinessHealthScore(
  skus: SKUItem[], 
  sales: SalesRecord[], 
  expenses: ExpenseRecord[], 
  feedbacks: CustomerFeedback[]
): number {
  let score = 100;
  
  // Stockout penalty
  const criticalSkus = skus.filter(s => s.status === 'critical').length;
  score -= criticalSkus * 8;

  // Sales target penalty
  const currentMonthSales = sales[sales.length - 1];
  if (currentMonthSales && currentMonthSales.revenue < currentMonthSales.target) {
    const deficitRatio = (currentMonthSales.target - currentMonthSales.revenue) / currentMonthSales.target;
    score -= Math.round(deficitRatio * 25);
  }

  // Expense overrun penalty
  const overBudgetExpenses = expenses.filter(e => e.status === 'over_budget').length;
  score -= overBudgetExpenses * 6;

  // Negative customer feedback penalty
  const negativeFeedbacks = feedbacks.filter(f => f.sentiment === 'negative').length;
  score -= negativeFeedbacks * 4;

  return Math.max(30, Math.min(99, score));
}

export function generateAgentInsights(
  skus: SKUItem[],
  sales: SalesRecord[],
  expenses: ExpenseRecord[],
  feedbacks: CustomerFeedback[],
  signals: MarketSignal[]
): AgentInsight[] {
  const insights: AgentInsight[] = [];

  // 1. Sales Agent Insight
  const latestSales = sales[sales.length - 1];
  insights.push({
    id: 'ins-sales-1',
    agentId: 'sales',
    title: 'Monthly Revenue Target Variance (-23.4%)',
    summary: `August revenue (₹31,84,000) missed target (₹41,60,000) primarily due to stock depletion in top revenue driver SKU-884 and competitor price undercutting in Mumbai.`,
    detailedAnalysis: `Sales volume fell by 28% in the last 10 days of the month. Monsooned Malabar Arabica (SKU-884) accounts for 42% of revenue shortfall.`,
    severity: 'high',
    timestamp: '10 mins ago',
    metrics: [
      { label: 'August Revenue', value: '₹31,84,000', change: '-23.4% vs target' },
      { label: 'Orders Processed', value: '1,040', change: '-18.1% MoM' },
      { label: 'Avg Order Value', value: '₹3,061.54', change: '+2.5%' }
    ],
    suggestedAction: {
      label: 'Run 10% Loyalty Flash Campaign on Chai Flasks',
      actionType: 'discount',
      payload: { targetCategory: 'Drinkware & Living' }
    }
  });

  // 2. Inventory Agent Insight
  const criticalCount = skus.filter(s => s.status === 'critical').length;
  insights.push({
    id: 'ins-inv-1',
    agentId: 'inventory',
    title: `Critical Stockout Alert (${criticalCount} SKUs < 4 Days Stock)`,
    summary: `SKU-884 (42 units left, 3 days) & SKU-990 (18 units left, 4 days) are on track to completely exhaust inventory before next scheduled restock from Western Ghats and Lamington Road.`,
    detailedAnalysis: `Daily depletion rate of SKU-884 surged to 14.2 units/day. Reorder lead time is 36 hours via Mumbai air cargo or 5 days via road transport.`,
    severity: 'critical',
    timestamp: 'Just now',
    metrics: [
      { label: 'Stockout Risk SKUs', value: `${criticalCount} Items`, change: 'Action Required' },
      { label: 'Working Capital Locked in Dead Stock', value: '₹2,26,800', change: '540 units SKU-405' },
      { label: 'Optimal EOQ Reorder', value: '250 units', change: 'SKU-884' }
    ],
    suggestedAction: {
      label: 'Execute Emergency Air-Cargo Reorder',
      actionType: 'reorder',
      payload: { skuId: 'SKU-884', qty: 250 }
    }
  });

  // 3. Finance Agent Insight
  insights.push({
    id: 'ins-fin-1',
    agentId: 'finance',
    title: 'Bhiwandi Freight Expense Variance (+86.7% Over Budget)',
    summary: `Logistics expenses reached ₹6,72,000 against a ₹3,60,000 budget due to uncoordinated monsoon air cargo orders and courier surcharge hikes.`,
    detailedAnalysis: `Operating margin compressed to 18.2% (down from 26.5% in July). Net cash flow remains positive at ₹11,36,000, but liquidity buffer narrowed.`,
    severity: 'medium',
    timestamp: '25 mins ago',
    metrics: [
      { label: 'Logistics Cost Variance', value: '+₹3,12,000', change: '+86.7% Over' },
      { label: '30-Day Liquidity Buffer', value: '₹11,36,000', change: 'Safe (>₹8L min)' },
      { label: 'Gross Profit Margin', value: '41.8%', change: '-4.2%' }
    ],
    suggestedAction: {
      label: 'Consolidate Carrier SLA',
      actionType: 'cut_expense',
      payload: { expId: 'exp-101' }
    }
  });

  // 4. Customer Experience Agent Insight
  const negCount = feedbacks.filter(f => f.sentiment === 'negative').length;
  insights.push({
    id: 'ins-cust-1',
    agentId: 'customer',
    title: `WhatsApp Complaint Spike (${negCount} Unresolved Incidents)`,
    summary: `Negative sentiment reached 28% in WhatsApp conversations. Primary drivers are monsoon shipping delays along the Bhiwandi corridor and courier fee jumps.`,
    detailedAnalysis: `Key keyphrases extracted: "delayed shipment", "out of stock", "delivery fee jump". 3 VIP wholesale café clients in South Bombay flagged high churn risk.`,
    severity: 'high',
    timestamp: '1 hour ago',
    metrics: [
      { label: 'CSAT Score', value: '78 / 100', change: '-8 pts' },
      { label: 'WhatsApp Negative Sentiment', value: '28%', change: '+12%' },
      { label: 'High Risk VIP Accounts', value: '3 Clients', change: 'Alert' }
    ],
    suggestedAction: {
      label: 'Send Priority Stock Guarantee to VIP Clients',
      actionType: 'contact_customer',
      payload: { clientIds: ['Café Mondegar', 'Irani Café'] }
    }
  });

  // 5. Market Research Agent Insight
  insights.push({
    id: 'ins-mkt-1',
    agentId: 'market',
    title: 'Competitor Price Cut Detected (Blue Tokai -20%)',
    summary: `Main competitor Blue Tokai launched a promotional rate of ₹2,280/kg on roasted coffee beans, undercutting our ₹2,850 listing across Mumbai outlets.`,
    detailedAnalysis: `Web crawler detected promotion running through Sept 10. Raw Arabica commodity futures at Karnataka auctions also rose +14% due to Western Ghats monsoon disruptions.`,
    severity: 'medium',
    timestamp: '3 hours ago',
    metrics: [
      { label: 'Competitor Promo Price', value: '₹2,280 / kg', change: '-20% Flash' },
      { label: 'Raw Commodity Index', value: 'Arabica +14%', change: 'Cost Pressure' },
      { label: 'Office Category Demand', value: '+28%', change: 'Positive Tailwind' }
    ],
    suggestedAction: {
      label: 'Match Promo with Value Bundle',
      actionType: 'adjust_price',
      payload: { category: 'Coffee' }
    }
  });

  return insights;
}

export async function queryLiveGeminiAgent(
  query: string,
  skus: SKUItem[],
  sales: SalesRecord[],
  expenses: ExpenseRecord[],
  feedbacks: CustomerFeedback[],
  signals: MarketSignal[],
  targetAgentId?: string | null
): Promise<ChatMessage> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, skus, sales, expenses, feedbacks, signals, targetAgentId, storeMode: 'vyapar' })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.finalAnswer) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Live Gemini API query failed, falling back to local multi-agent synthesis:', err);
  }

  return processNaturalLanguageQuery(query, skus, sales, expenses, feedbacks, signals);
}

export function processNaturalLanguageQuery(
  query: string,
  skus: SKUItem[],
  sales: SalesRecord[],
  expenses: ExpenseRecord[],
  feedbacks: CustomerFeedback[],
  signals: MarketSignal[]
): ChatMessage {
  const normalized = query.toLowerCase();
  const reasoningSteps: MultiAgentReasoningStep[] = [];
  let finalAnswer = "";
  let participatingAgents: AgentId[] = [];
  let keyDataPoints: { label: string; value: string }[] = [];
  let suggestedActions: { label: string; actionType: string; payload: Record<string, any> }[] = [];

  // Timestamp format helper
  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // ============================================================================
  // VYAPAR AI: RAJESH BHAI (THANE HARDWARE) SCRIPT MILESTONES & HINGLISH QUERIES
  // ============================================================================

  // 1. Morning Briefing: "Aaj shop ka status batao" / "Good morning"
  if (
    normalized.includes('status') && (normalized.includes('aaj') || normalized.includes('shop') || normalized.includes('morning') || normalized.includes('dukan') || normalized.includes('sthiti')) ||
    normalized.includes('shop ka status') ||
    normalized.includes('aaj shop')
  ) {
    participatingAgents = ['orchestrator', 'sales', 'inventory', 'finance'];

    reasoningSteps.push({
      agentId: 'orchestrator',
      agentName: 'Vyapar AI (Decision Manager)',
      phase: 'data_ingestion',
      thought: 'Ingested shop telemetry for Rajesh Hardware & Electricals (Thane West). Aggregating POS cash/UPI bills, stockout risks, and overdue khata ledger.',
      dataCited: ['Store: Rajesh Hardware (Thane)', 'Sales: ₹48,750', 'Profit: ₹11,430', 'Udhar: ₹72,500'],
      timestamp: nowStr
    });

    reasoningSteps.push({
      agentId: 'sales',
      agentName: 'Sales Agent',
      phase: 'domain_analysis',
      thought: 'Analyzed yesterday transaction volume: 38 customer transactions across counter cash and QR UPI. Projected today forecast is ₹52,000–₹58,000 based on local Thane electrical work orders.',
      dataCited: ['Yesterday Sales: ₹48,750', 'Net Margin: ₹11,430 (23.4%)', 'Today Forecast: ₹52,000–₹58,000'],
      timestamp: nowStr
    });

    reasoningSteps.push({
      agentId: 'inventory',
      agentName: 'Inventory Agent',
      phase: 'domain_analysis',
      thought: 'Stock-out prediction model detected 1-inch Heavy PVC conduit pipe reaching zero inventory within 3 days. Safety threshold is breached.',
      dataCited: ['1-inch PVC Pipe: 4 bundles left', 'Depletion: 1.3 bundles/day', 'Days Remaining: 3'],
      timestamp: nowStr
    });

    reasoningSteps.push({
      agentId: 'finance',
      agentName: 'Finance Agent',
      phase: 'final_synthesis',
      thought: 'Receivables audit flags ₹72,500 locked in customer udhar. 2 accounts (Sharma Construction ₹32,000 and Sai Electric ₹21,500) are overdue.',
      dataCited: ['Pending Receivables: ₹72,500', 'Overdue Debtors: 2'],
      timestamp: nowStr
    });

    finalAnswer = `### 🌅 Good morning Rajesh ji!

Here is your shop status for **Rajesh Hardware & Electricals (Thane West)**:

| Metric | Amount (₹) | Key Highlight |
| :--- | :--- | :--- |
| **Yesterday's Sales** | **₹48,750** | 38 transactions (Cash + BharatPe UPI) |
| **Estimated Net Profit** | **₹11,430** | 23.4% net margin |
| **Outstanding Payments (Udhar)** | **₹72,500** | 3 customer trade accounts |
| **Today's Expected Revenue** | **₹52,000 – ₹58,000** | Based on recent Thane project velocity |

---

### ⚡ I found three things you should know:
1. **📦 Low Stock**: Your **1-inch PVC pipe** will run out in **3 days**.
2. **💸 Overdue Payments**: **Two customers** have overdue payments (**Sharma Construction ₹32,000** & **Sai Electric ₹21,500**).
3. **📈 Revenue Forecast**: Based on recent trends, today's expected revenue is **₹52,000 to ₹58,000**.`;

    keyDataPoints = [
      { label: "Yesterday's Sales", value: "₹48,750" },
      { label: "Net Profit", value: "₹11,430" },
      { label: "Outstanding Udhar", value: "₹72,500" },
      { label: "Today's Forecast", value: "₹52k–₹58k" }
    ];

    suggestedActions = [
      { label: "Haan, low-stock item order kar do", actionType: "vyapar_supplier_modal", payload: { item: "1-inch PVC Pipe" } },
      { label: "Kaunse customers ne payment nahi kiya?", actionType: "query", payload: { query: "Kaunse customers ne payment nahi kiya?" } }
    ];

    return {
      id: `msg-${Date.now()}`,
      sender: 'coo',
      queryText: query,
      fileName: 'morning-shop-briefing.md',
      participatingAgents,
      reasoningSteps,
      finalAnswer,
      keyDataPoints,
      suggestedActions,
      timestamp: nowStr
    };
  }

  // 2. Low-Stock Reorder & 3-Supplier Comparison: "Haan, low-stock item order kar do"
  if (
    normalized.includes('low') ||
    normalized.includes('pvc') ||
    normalized.includes('item order') ||
    (normalized.includes('supplier') && (normalized.includes('price') || normalized.includes('rate') || normalized.includes('best') || normalized.includes('compare'))) ||
    (normalized.includes('order') && (normalized.includes('stock') || normalized.includes('pipe') || normalized.includes('item')))
  ) {
    participatingAgents = ['procurement', 'inventory', 'orchestrator'];

    reasoningSteps.push({
      agentId: 'inventory',
      agentName: 'Inventory Agent',
      phase: 'data_ingestion',
      thought: 'Calculated optimal replenishment for 1-inch Heavy PVC Conduit Pipe. Current stock: 4 bundles. Target EOQ: 50 bundles (covers 38 days demand).',
      dataCited: ['SKU-PVC-1IN: 4 bundles', 'Required Replenishment: 50 bundles'],
      timestamp: nowStr
    });

    reasoningSteps.push({
      agentId: 'procurement',
      agentName: 'Procurement Agent',
      phase: 'domain_analysis',
      thought: 'Queried 3 regular wholesale suppliers in Bhiwandi and Thane. Mahesh Traders: ₹12,450, Patel Suppliers: ₹13,120, Shree Enterprises: ₹12,980. Identified ₹670 potential margin savings.',
      dataCited: ['Mahesh Traders: ₹12,450', 'Patel: ₹13,120', 'Shree: ₹12,980', 'Saving: ₹670'],
      timestamp: nowStr
    });

    reasoningSteps.push({
      agentId: 'orchestrator',
      agentName: 'Vyapar AI (Decision Manager)',
      phase: 'final_synthesis',
      thought: 'Selecting Mahesh Traders as the recommended vendor due to verified lowest net price (₹12,450) and guaranteed morning delivery (10:00 AM) to Thane West shop.',
      dataCited: ['Best Vendor: Mahesh Traders', 'Potential Saving: ₹670', 'Delivery: Tomorrow 10:00 AM'],
      timestamp: nowStr
    });

    finalAnswer = `Checking regular suppliers for **1-inch PVC conduit pipe (50 bundles)**:

| Supplier | Location | Quoted Price | Delivery Time | Reliability | Status / Saving |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **⭐ Mahesh Traders** | **Bhiwandi Market** | **₹12,450** | **Tomorrow 10:00 AM** | **98%** | **Best Option (Save ₹670)** |
| Patel Suppliers | Kalwa Naka | ₹13,120 | 2 Days | 91% | +₹670 higher |
| Shree Enterprises | Thane MIDC | ₹12,980 | Tomorrow 6:00 PM | 94% | +₹530 higher |

---

⭐ **Best option**: **Mahesh Traders**  
💰 **Potential saving**: **₹670**  
🚚 **Delivery**: Tomorrow morning before shop opens.

Purchase order is ready. Click below or say *"Order kar do"* to confirm.`;

    keyDataPoints = [
      { label: "Best Supplier", value: "Mahesh Traders" },
      { label: "Best Price", value: "₹12,450" },
      { label: "Direct Savings", value: "₹670" },
      { label: "Expected Delivery", value: "Tomorrow 10 AM" }
    ];

    suggestedActions = [
      { label: "Order kar do", actionType: "query", payload: { query: "Order kar do." } },
      { label: "Kaunse customers ne payment nahi kiya?", actionType: "query", payload: { query: "Kaunse customers ne payment nahi kiya?" } }
    ];

    return {
      id: `msg-${Date.now()}`,
      sender: 'coo',
      queryText: query,
      fileName: 'supplier-rate-comparison.md',
      participatingAgents,
      reasoningSteps,
      finalAnswer,
      keyDataPoints,
      suggestedActions,
      timestamp: nowStr
    };
  }

  // 2b. Confirm PVC Purchase Order: "Order kar do"
  else if (
    normalized.replace(/[.,!]/g, '').trim() === 'order kar do' ||
    normalized.replace(/[.,!]/g, '').trim() === 'haan order kar do' ||
    normalized.startsWith('order kar do') ||
    (normalized.includes('order') && (normalized.includes('confirm') || normalized.includes('mahesh')))
  ) {
    participatingAgents = ['procurement', 'orchestrator'];

    reasoningSteps.push({
      agentId: 'procurement',
      agentName: 'Procurement Agent',
      phase: 'domain_analysis',
      thought: 'Generated Purchase Order PO-2026-PVC-50 for Mahesh Traders (Bhiwandi Market). Total amount ₹12,450 for 50 bundles 1-inch Heavy PVC Conduit Pipe.',
      dataCited: ['PO: PO-2026-PVC-50', 'Supplier: Mahesh Traders', 'Total: ₹12,450', 'Saving: ₹670'],
      timestamp: nowStr
    });

    reasoningSteps.push({
      agentId: 'orchestrator',
      agentName: 'Vyapar AI (Decision Manager)',
      phase: 'final_synthesis',
      thought: 'Dispatched electronic PO via WhatsApp Business & Email to Mahesh Traders. Delivery confirmed for tomorrow morning 10:00 AM before shop opening.',
      dataCited: ['Delivery: Tomorrow 10:00 AM', 'Confirmed Rate: ₹12,450'],
      timestamp: nowStr
    });

    finalAnswer = `### ✅ Done. Purchase order created!

| PO Number | Supplier | Items Ordered | Total Cost | Net Saving | Delivery Expected |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PO-2026-PVC-50** | **Mahesh Traders (Bhiwandi)** | **50 Bundles (1-inch Heavy PVC Pipe)** | **₹12,450** | **₹670 Saved** | **Tomorrow 10:00 AM** (Before shop opens) |

---
- 📦 **Order Status**: Transmitted directly to Mahesh Traders via WhatsApp.
- 🚚 **Delivery**: Tomorrow morning at Rajesh Hardware counter (Thane West).
- 💰 **Direct Savings**: **₹670** saved compared to Patel Suppliers.

*Purchase order is active. What would you like to check next, Rajesh Bhai?*`;

    keyDataPoints = [
      { label: "Purchase Order", value: "PO-2026-PVC-50" },
      { label: "Confirmed Vendor", value: "Mahesh Traders" },
      { label: "Amount", value: "₹12,450" },
      { label: "Savings Locked", value: "₹670" }
    ];

    suggestedActions = [
      { label: "Kaunse customers ne payment nahi kiya?", actionType: "query", payload: { query: "Kaunse customers ne payment nahi kiya?" } },
      { label: "Business improve kaise kar sakte hai?", actionType: "query", payload: { query: "Business improve kaise kar sakte hai?" } }
    ];

    return {
      id: `msg-${Date.now()}`,
      sender: 'coo',
      queryText: query,
      fileName: 'purchase-order-created.md',
      participatingAgents,
      reasoningSteps,
      finalAnswer,
      keyDataPoints,
      suggestedActions,
      timestamp: nowStr
    };
  }

  // 3. Customer Outstanding Khata: "Kaunse customers ne payment nahi kiya?"
  if (
    normalized.includes('payment') && (normalized.includes('nahi kiya') || normalized.includes('kaunse') || normalized.includes('baki') || normalized.includes('pending') || normalized.includes('who')) ||
    normalized.includes('customer') && (normalized.includes('unpaid') || normalized.includes('khata') || normalized.includes('udhar'))
  ) {
    participatingAgents = ['crm', 'finance', 'orchestrator'];

    reasoningSteps.push({
      agentId: 'crm',
      agentName: 'CRM & Khata Agent',
      phase: 'data_ingestion',
      thought: 'Auditing uncollected credit balances across all active trade accounts in Thane. Total outstanding udhar: ₹72,500 across 3 construction accounts.',
      dataCited: ['Total Udhar: ₹72,500', 'Sharma: ₹32,000', 'Sai Electric: ₹21,500', 'Om: ₹19,000'],
      timestamp: nowStr
    });

    reasoningSteps.push({
      agentId: 'crm',
      agentName: 'CRM & Khata Agent',
      phase: 'domain_analysis',
      thought: 'Evaluating payment behavior history: Sharma Construction has 92% recovery probability within 24h of WhatsApp notification. Sai Electric clears in 2 installments (78% probability).',
      dataCited: ['Sharma Recovery Prob: 92%', 'Sai Recovery Prob: 78%', 'Om Recovery Prob: 65%'],
      timestamp: nowStr
    });

    reasoningSteps.push({
      agentId: 'orchestrator',
      agentName: 'Vyapar AI (Decision Manager)',
      phase: 'final_synthesis',
      thought: 'Prioritizing cash recovery dispatch. Vyapar AI drafts respectful, automated WhatsApp payment messages with instant UPI payment links for Rajesh Bhai.',
      dataCited: ['Cash Recovery Actionable', 'Immediate Target: ₹32,000 Sharma Construction'],
      timestamp: nowStr
    });

    finalAnswer = `Here are the customers with overdue payments (Total Outstanding: **₹72,500**):

| Customer Name | Amount Stuck (₹) | Overdue | AI Recovery Likelihood | Behavioral Learning |
| :--- | :--- | :--- | :--- | :--- |
| **Sharma Construction** | **₹32,000** | 14 Days | **92% (High)** | Usually pays right after receiving a polite WhatsApp reminder |
| **Sai Electric Works** | **₹21,500** | 8 Days | **78% (Medium)** | Pays in 2 split installments after reminder |
| **Om Enterprises** | **₹19,000** | 21 Days | **65% (Attention)** | Requires WhatsApp notice + follow-up call |

---

💡 **Vyapar AI Learning**:
The AI doesn't just send a plain message — it learns from your business history. It knows **Sharma Construction** usually pays after receiving a reminder, so it prioritises this customer to recover cash immediately.

Say *"Reminder bhej do"* to send personalised WhatsApp messages with instant UPI links.`;

    keyDataPoints = [
      { label: "Total Outstanding", value: "₹72,500" },
      { label: "Sharma Construction", value: "₹32,000 (92% prob)" },
      { label: "Sai Electric Works", value: "₹21,500 (78% prob)" },
      { label: "Om Enterprises", value: "₹19,000 (65% prob)" }
    ];

    suggestedActions = [
      { label: "Reminder bhej do (Send WhatsApp Reminders)", actionType: "vyapar_send_reminders", payload: { total: 72500 } }
    ];

    return {
      id: `msg-${Date.now()}`,
      sender: 'coo',
      queryText: query,
      fileName: 'overdue-customers-recovery.md',
      participatingAgents,
      reasoningSteps,
      finalAnswer,
      keyDataPoints,
      suggestedActions,
      timestamp: nowStr
    };
  }

  // 3b. Send Reminders Confirmation: "Reminder bhej do"
  if (
    normalized.includes('reminder') && (normalized.includes('bhej') || normalized.includes('send') || normalized.includes('do'))
  ) {
    participatingAgents = ['crm', 'orchestrator'];

    reasoningSteps.push({
      agentId: 'crm',
      agentName: 'CRM & Khata Agent',
      phase: 'domain_analysis',
      thought: 'Generated personalized WhatsApp payment reminders in Hinglish for Sharma Construction (₹32,000), Sai Electric Works (₹21,500), and Om Enterprises (₹19,000) with UPI deep-links.',
      dataCited: ['3 Messages Prepared', 'Deep-link generated', 'Total Target: ₹72,500'],
      timestamp: nowStr
    });

    reasoningSteps.push({
      agentId: 'orchestrator',
      agentName: 'Vyapar AI (Decision Manager)',
      phase: 'final_synthesis',
      thought: 'Dispatched 3 WhatsApp reminders. Learned behavioral prediction expects ₹32,000 recovery from Sharma Construction within 24 hours.',
      dataCited: ['WhatsApp API Dispatched', 'Expected Inflow: ₹32,000 today'],
      timestamp: nowStr
    });

    finalAnswer = `✅ **Personalised WhatsApp reminders successfully prepared and dispatched!**

1. **Sharma Construction (₹32,000)**:
   > *"Namaste Vinod ji, Rajesh Hardware & Electricals (Thane) se. Aapka ₹32,000 ka bill 14 dino se pending hai. Kripya UPI link se clear karein: https://pay.vyapar.ai/inv-sharma"*
   - 🎯 **Expected Recovery**: ₹32,000 within 24 hours (92% probability based on past history).

2. **Sai Electric Works (₹21,500)**:
   > *"Namaste Prakash bhai, Rajesh Hardware se. Aapka ₹21,500 ka ledger balance baki hai. Kripya payment update karein: https://pay.vyapar.ai/inv-sai"*

3. **Om Enterprises (₹19,000)**:
   > *"Respected Sunil ji, Om Enterprises account shows ₹19,000 overdue for 21 days at Rajesh Hardware. Kindly clear today: https://pay.vyapar.ai/inv-om"*

Vyapar AI is actively monitoring your BharatPe/Bank account for incoming settlements and will notify you when payment lands!`;

    keyDataPoints = [
      { label: "Reminders Sent", value: "3 Customers" },
      { label: "Target Recovery", value: "₹72,500" },
      { label: "Expected Today", value: "₹32,000 (Sharma)" }
    ];

    suggestedActions = [
      { label: "Business improve kaise kar sakte hai?", actionType: "query", payload: { query: "Business improve kaise kar sakte hai?" } }
    ];

    return {
      id: `msg-${Date.now()}`,
      sender: 'coo',
      queryText: query,
      fileName: 'whatsapp-reminders-dispatched.md',
      participatingAgents,
      reasoningSteps,
      finalAnswer,
      keyDataPoints,
      suggestedActions,
      timestamp: nowStr
    };
  }

  // 4. Strategic Profit & Shelf Space: "Business improve kaise kar sakte hai?"
  if (
    normalized.includes('improve') ||
    normalized.includes('shelf') ||
    normalized.includes('business improve') ||
    (normalized.includes('profit') && (normalized.includes('increase') || normalized.includes('more') || normalized.includes('kaise')))
  ) {
    participatingAgents = ['finance', 'sales', 'inventory', 'orchestrator'];

    reasoningSteps.push({
      agentId: 'finance',
      agentName: 'Finance Agent',
      phase: 'data_ingestion',
      thought: 'Audited 6 months of historical SKU turnover and product category gross margins. Comparing shelf space allocation vs profit contribution.',
      dataCited: ['Data Period: 6 Months', 'Categories: LED vs Pumps vs Wire'],
      timestamp: nowStr
    });

    reasoningSteps.push({
      agentId: 'sales',
      agentName: 'Sales Agent',
      phase: 'domain_analysis',
      thought: 'Found critical product mix asymmetry: LED products generate 32% net margin but occupy only 12% of shelf space. Water pumps generate only 8% margin while hogging 30% of prime shop floor.',
      dataCited: ['LED Margin: 32% (12% space)', 'Pump Margin: 8% (30% space)'],
      timestamp: nowStr
    });

    reasoningSteps.push({
      agentId: 'orchestrator',
      agentName: 'Vyapar AI (Decision Manager)',
      phase: 'final_synthesis',
      thought: 'Formulated 3-point business optimization plan: Increase LED inventory display, reduce showroom pump space to on-demand catalog, and introduce contractor bundles for local Thane electricians.',
      dataCited: ['Additional Profit: ₹18,000–₹24,000/month'],
      timestamp: nowStr
    });

    finalAnswer = `Vyapar AI analyzed **six months of your business data**, and found something you might not have noticed:

### 📊 Shelf Space vs Profit Margin Analysis:
| Product Category | Profit Margin (%) | Shelf Space Occupied (%) | Monthly Sales | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| **💡 LED Lighting & Battens** | **32%** | **12%** | ₹78,000 | **High Profit, Low Space** (Under-indexed) |
| **🚰 Submersible Water Pumps** | **8%** | **30%** | ₹42,000 | **Low Profit, High Space** (Over-indexed) |

---

### 🚀 3 Clear Strategic Recommendations:
1. **Increase LED Inventory & Frontage**: Give LEDs more visible counter display to drive high-margin impulse sales.
2. **Reduce Slow-Moving Pumps**: Keep 2 display units only and sell the rest on-demand from distributor, freeing up 18% floor space.
3. **Create Combo Packages for Electricians**: Bundle 20W LED batten + switch box + insulation tape for Thane contractors at ₹499 combo.

💰 **Estimated Potential Additional Monthly Profit**: **₹18,000 – ₹24,000 / month**

> *That's not a dashboard. That's a business decision.*`;

    keyDataPoints = [
      { label: "LED Profit Margin", value: "32% (12% space)" },
      { label: "Water Pump Margin", value: "8% (30% space)" },
      { label: "Added Monthly Profit", value: "+₹18k – ₹24k" }
    ];

    suggestedActions = [
      { label: "Reallocate Shelf Space & Order LED Combos", actionType: "vyapar_reallocate_shelf", payload: { profitTarget: 24000 } },
      { label: "Check Proactive Wire Alerts", actionType: "query", payload: { query: "Copper wire stock status batao." } }
    ];

    return {
      id: `msg-${Date.now()}`,
      sender: 'coo',
      queryText: query,
      fileName: 'strategic-shelf-space-profit.md',
      participatingAgents,
      reasoningSteps,
      finalAnswer,
      keyDataPoints,
      suggestedActions,
      timestamp: nowStr
    };
  }

  // 5b. Confirm Copper Wire PO: "Order 150 rolls copper wire"
  if (
    (normalized.includes('150') && (normalized.includes('wire') || normalized.includes('copper') || normalized.includes('roll'))) ||
    (normalized.includes('order') && (normalized.includes('copper') || normalized.includes('wire')))
  ) {
    participatingAgents = ['procurement', 'inventory', 'orchestrator'];

    reasoningSteps.push({
      agentId: 'procurement',
      agentName: 'Procurement Agent',
      phase: 'domain_analysis',
      thought: 'Created Purchase Order PO-2026-WIRE-150 for Finolex Wholesale Distributor. 150 rolls of 2.5 sq mm FR Copper Wire at distributor wholesale rate (₹1,420/roll). Total PO: ₹2,13,000.',
      dataCited: ['PO: PO-2026-WIRE-150', 'Qty: 150 Rolls', 'Total: ₹2,13,000', 'Margin: ₹430/roll'],
      timestamp: nowStr
    });

    reasoningSteps.push({
      agentId: 'orchestrator',
      agentName: 'Vyapar AI (Decision Manager)',
      phase: 'final_synthesis',
      thought: 'Proactive purchase order successfully dispatched. Prevents stockout during peak Thane electrical renovation rush and secures ₹45,000+ in at-risk sales.',
      dataCited: ['Sales Protected: ₹45,000+', 'Delivery: Tomorrow 2:00 PM'],
      timestamp: nowStr
    });

    finalAnswer = `### ⚡ Purchase Order Created: 150 Rolls Finolex Copper Wire

| PO Number | Supplier / Distributor | Item & Qty | Total Cost | Protected Revenue | Expected Arrival |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PO-2026-WIRE-150** | **Finolex Wholesale Distributor** | **150 Rolls (2.5 sq mm FR)** | **₹2,13,000** | **₹45,000+ Lost Sales Prevented** | **Tomorrow 2:00 PM** |

---

- 📦 **Order Dispatched**: PO-2026-WIRE-150 sent directly to Finolex Wholesale Distributor.
- 🚚 **Delivery Expected**: Tomorrow 2:00 PM at Rajesh Hardware (Thane West).
- 💼 **Business Protection**: Prevents stockout during local renovation rush and secures **₹45,000+** counter sales.`;

    keyDataPoints = [
      { label: "Purchase Order", value: "PO-2026-WIRE-150" },
      { label: "Item", value: "Finolex 2.5mm Wire" },
      { label: "Quantity", value: "150 Rolls" },
      { label: "Protected Sales", value: "₹45,000+" }
    ];

    suggestedActions = [
      { label: "Aaj shop ka status batao", actionType: "query", payload: { query: "Good morning. Aaj shop ka status batao." } },
      { label: "Check Other Low-Stock Items", actionType: "query", payload: { query: "Inventory may kya kya stocks khali hay?" } }
    ];

    return {
      id: `msg-${Date.now()}`,
      sender: 'coo',
      queryText: query,
      fileName: 'wire-purchase-order-executed.md',
      participatingAgents,
      reasoningSteps,
      finalAnswer,
      keyDataPoints,
      suggestedActions,
      timestamp: nowStr
    };
  }

  // 5. Proactive Wire Spike Prediction: "Copper wire stock status" / "predictive alert"
  else if (
    normalized.includes('copper') ||
    normalized.includes('wire') ||
    normalized.includes('predict') ||
    (normalized.includes('stock') && normalized.includes('finish'))
  ) {
    participatingAgents = ['sales', 'inventory', 'orchestrator'];

    reasoningSteps.push({
      agentId: 'sales',
      agentName: 'Sales Agent',
      phase: 'data_ingestion',
      thought: 'Detected rapid acceleration in copper wire sales: +38% increase in unit velocity over last 10 days driven by Thane pre-monsoon renovation projects.',
      dataCited: ['Copper Wire Velocity: +38%', 'Window: Last 10 Days'],
      timestamp: nowStr
    });

    reasoningSteps.push({
      agentId: 'inventory',
      agentName: 'Inventory Agent',
      phase: 'domain_analysis',
      thought: 'At current depletion rate of 3.0 rolls/day, remaining 12 rolls of Finolex 2.5 sq mm copper wire will completely exhaust in 4 days.',
      dataCited: ['Current Stock: 12 rolls', 'Days Remaining: 4', 'Recommended Reorder: 150 rolls'],
      timestamp: nowStr
    });

    reasoningSteps.push({
      agentId: 'orchestrator',
      agentName: 'Vyapar AI (Decision Manager)',
      phase: 'final_synthesis',
      thought: 'Quantified at-risk commercial revenue: A stockout will cause forfeit of ₹45,000+ in sales to nearby competitors on Gokhale Road.',
      dataCited: ['At-Risk Sales: ₹45,000+', 'Action: Order 150 rolls'],
      timestamp: nowStr
    });

    finalAnswer = `### 📦 Copper Wire Stock Status: Finolex 2.5 sq mm FR

| Metric | Current Status | Details |
| :--- | :--- | :--- |
| **Current Stock** | **12 Rolls Remaining** | Finolex 2.5 sq mm FR Red/Black |
| **Depletion Velocity** | **3.0 Rolls / Day** | Sales surged **+38%** over last 10 days |
| **Stock Exhaustion** | **In 4 Days** | Urgent reorder required before weekend |
| **Recommended Reorder** | **150 Rolls** | Prevents **₹45,000+** in lost customer sales |

---

- **Current Balance**: Only **12 rolls** left at Rajesh Hardware counter.
- **Runway**: At current sales velocity, stock will be **exhausted in 4 days**.
- **Recommended Action**: Order **150 rolls** now to maintain supply and secure **₹45,000+ revenue**.`;

    keyDataPoints = [
      { label: "Current Stock", value: "12 Rolls" },
      { label: "Sales Spike", value: "+38% (10 days)" },
      { label: "Stock Exhaustion", value: "In 4 Days" },
      { label: "Recommended Order", value: "150 Rolls" }
    ];

    suggestedActions = [
      { label: "Order 150 Rolls Copper Wire", actionType: "query", payload: { query: "Order 150 rolls copper wire." } }
    ];

    return {
      id: `msg-${Date.now()}`,
      sender: 'coo',
      queryText: query,
      fileName: 'predictive-wire-surge-alert.md',
      participatingAgents,
      reasoningSteps,
      finalAnswer,
      keyDataPoints,
      suggestedActions,
      timestamp: nowStr
    };
  }

  // ============================================================================
  // RAJESH HARDWARE & ELECTRICALS (THANE WEST) - DEDICATED DOMAIN HANDLERS
  // ============================================================================

  // 6. Comprehensive Stock & Inventory Query (Hindi, Hinglish, English)
  if (
    normalized.includes('inventory') ||
    normalized.includes('stock') ||
    normalized.includes('khali') ||
    normalized.includes('khatam') ||
    normalized.includes('kam') ||
    normalized.includes('baki') ||
    normalized.includes('saman') ||
    normalized.includes('maal') ||
    normalized.includes('exhaust') ||
    normalized.includes('pvc') ||
    normalized.includes('pipe') ||
    normalized.includes('pump')
  ) {
    participatingAgents = ['inventory', 'procurement', 'orchestrator'];

    reasoningSteps.push({
      agentId: 'inventory',
      agentName: 'Inventory Agent',
      phase: 'data_ingestion',
      thought: 'Audited current inventory levels across all electrical and hardware categories at Rajesh Hardware & Electricals (Thane West).',
      dataCited: ['1-inch PVC: 4 bundles', '2.5mm Copper Wire: 12 rolls', 'LED Battens: 85 units', 'Water Pumps: 14 units'],
      timestamp: nowStr
    });

    reasoningSteps.push({
      agentId: 'inventory',
      agentName: 'Inventory Agent',
      phase: 'domain_analysis',
      thought: 'Critical stockout alert: 1-inch Heavy PVC Conduit Pipe has only 4 bundles remaining (burn rate 1.3 bundles/day) and will exhaust in 3 days. Finolex Copper Wire is running low with 4 days stock remaining after a +38% demand spike.',
      dataCited: ['PVC Days Left: 3 Days (Critical)', 'Copper Wire Days Left: 4 Days (Low)', 'Pumps: 140 Days (Dead Stock)'],
      timestamp: nowStr
    });

    reasoningSteps.push({
      agentId: 'procurement',
      agentName: 'Procurement Agent',
      phase: 'domain_analysis',
      thought: 'Compared wholesale supplier quotes for 50 bundles 1-inch PVC pipe. Mahesh Traders (Bhiwandi) offers best rate at ₹12,450 (saves ₹670 vs Patel ₹13,120).',
      dataCited: ['Best Vendor: Mahesh Traders (₹12,450)', 'Saving: ₹670', 'Delivery: Tomorrow 10 AM'],
      timestamp: nowStr
    });

    reasoningSteps.push({
      agentId: 'orchestrator',
      agentName: 'Vyapar AI (Decision Manager)',
      phase: 'final_synthesis',
      thought: 'Synthesized inventory report for Rajesh Bhai. Recommending immediate reorder of PVC pipes from Mahesh Traders and 150 rolls Copper wire to protect ₹45,000+ counter revenue.',
      dataCited: ['Actionable POs Ready', 'Thane West Shop Operational'],
      timestamp: nowStr
    });

    finalAnswer = `Here is the live stock & inventory status for **Rajesh Hardware & Electricals (Thane West)**:

| Item Name | Category | Current Stock | Daily Usage | Days Remaining | Stock Status | Action Required |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **🚨 1-inch Heavy PVC Conduit Pipe (25m)** | Pipes & Fittings | **4 Bundles** | 1.3 / day | **3 Days** | **CRITICAL** | **Reorder 50 bundles now** (Mahesh Traders ₹12,450) |
| **⚠️ Finolex 2.5 sq mm FR Copper Wire (90m)** | Electricals & Wiring | **12 Rolls** | 3.0 / day | **4 Days** | **LOW STOCK** | **Reorder 150 rolls** (Demand spiked +38%) |
| **✅ Philips & Havells 20W LED Batten & Bulbs** | Lighting | **85 Units** | 8.5 / day | **10 Days** | **OPTIMAL** | Healthy stock (32% high margin) |
| **📦 Crompton 1.0 HP Submersible Water Pump** | Heavy Machinery | **14 Units** | 0.1 / day | **140 Days** | **DEAD STOCK** | Slow moving (8% margin, blocking 30% floor) |

---

### ⚡ Summary for Rajesh Bhai:
1. **Khali Hone Wala Stock (Urgent)**:
   - **1-inch PVC Pipe** sirf **3 din** mein khatam ho jayega (4 bundles baki).
   - **2.5 sq mm Copper Wire** **4 din** mein khatam ho jayega (12 rolls baki, +38% demand spike).
2. **Recommended Action**:
   - **Mahesh Traders (Bhiwandi)** se 50 bundles PVC pipe ka order confirm karein (₹12,450 — **₹670 ki bachat**).
   - Finolex distributor se **150 rolls copper wire** mangwa lein taaki **₹45,000+ ki bikri miss na ho**.`;

    keyDataPoints = [
      { label: "1-inch PVC Pipe", value: "4 Bundles (3 Days Left)" },
      { label: "Copper Wire", value: "12 Rolls (4 Days Left)" },
      { label: "Best Supplier (PVC)", value: "Mahesh Traders (₹12,450)" },
      { label: "Potential Saving", value: "₹670" }
    ];

    suggestedActions = [
      { label: "Haan, low-stock item order kar do", actionType: "vyapar_supplier_modal", payload: { item: "1-inch PVC Pipe" } },
      { label: "Order 150 Rolls Copper Wire", actionType: "vyapar_reorder_copper", payload: { qty: 150, item: "Finolex Copper Wire" } },
      { label: "Aaj shop ka status batao", actionType: "query", payload: { query: "Aaj shop ka status batao" } }
    ];
  }
  // 7. Sales, Revenue & Bikri
  else if (
    normalized.includes('sales') ||
    normalized.includes('revenue') ||
    normalized.includes('bikri') ||
    normalized.includes('kamai') ||
    normalized.includes('dhanda')
  ) {
    participatingAgents = ['sales', 'finance', 'orchestrator'];

    reasoningSteps.push({
      agentId: 'sales',
      agentName: 'Sales Agent',
      phase: 'data_ingestion',
      thought: 'Aggregated counter billing ledger for Rajesh Hardware & Electricals (Thane West). Yesterday recorded 38 customer bills across counter cash and BharatPe QR.',
      dataCited: ['Yesterday Sales: ₹48,750', 'Gross Profit: ₹14,625', 'Net Profit: ₹11,430'],
      timestamp: nowStr
    });

    reasoningSteps.push({
      agentId: 'finance',
      agentName: 'Finance Agent',
      phase: 'domain_analysis',
      thought: 'Net profit closed at ₹11,430 (23.4% margin) after accounting for helper wages and daily operational overheads. Projected today revenue is ₹52,000–₹58,000.',
      dataCited: ['Net Margin: 23.4%', 'Today Forecast: ₹52,000–₹58,000'],
      timestamp: nowStr
    });

    reasoningSteps.push({
      agentId: 'orchestrator',
      agentName: 'Vyapar AI (Decision Manager)',
      phase: 'final_synthesis',
      thought: 'Sales velocity is strong in electricals (+38% copper wire). Recommending focus on contractor combo kits to push counter ticket size above ₹1,800.',
      dataCited: ['Electrician Combos Recommended'],
      timestamp: nowStr
    });

    finalAnswer = `Here is the sales performance report for **Rajesh Hardware & Electricals (Thane West)**:

| Metric | Amount (₹) | Details |
| :--- | :--- | :--- |
| **Yesterday's Counter Sales** | **₹48,750** | 38 customer transactions (Cash + BharatPe UPI) |
| **Estimated Net Profit** | **₹11,430** | 23.4% net profit margin |
| **Average Order Value (AOV)** | **₹1,282** | Counter sales + contractor credit bills |
| **Today's Expected Revenue** | **₹52,000 – ₹58,000** | Based on Thane local construction projects |

---

### 📈 Key Highlights:
- **Top Velocity Product**: Finolex 2.5 sq mm copper wire sales surged **+38%** in the last 10 days.
- **Payment Method Split**: 58% BharatPe UPI QR, 42% Counter Cash.
- **Growth Opportunity**: Introducing contractor bundles (LED batten + switch box + wire) can boost daily sales by an extra ₹6,000–₹8,000.`;

    keyDataPoints = [
      { label: "Yesterday Sales", value: "₹48,750" },
      { label: "Net Profit", value: "₹11,430 (23.4%)" },
      { label: "Today Forecast", value: "₹52k–₹58k" },
      { label: "Transactions", value: "38 Bills" }
    ];

    suggestedActions = [
      { label: "Kaunse customers ne payment nahi kiya?", actionType: "query", payload: { query: "Kaunse customers ne payment nahi kiya?" } },
      { label: "Check low-stock items", actionType: "query", payload: { query: "Kaunse products low stock par hai?" } }
    ];
  }
  // 8. General Vyapar AI Fallback (100% Rajesh Hardware & Electricals)
  else {
    participatingAgents = ['orchestrator', 'sales', 'inventory', 'crm'];

    reasoningSteps.push({
      agentId: 'orchestrator',
      agentName: 'Vyapar AI (Decision Manager)',
      phase: 'data_ingestion',
      thought: `Processing query: "${query}" for Rajesh Hardware & Electricals (Thane West). Cross-referencing shop telemetry, stock levels, and khata records.`,
      dataCited: ['Store: Rajesh Hardware (Thane West)', 'Owner: Rajesh Bhai', 'Status: Active'],
      timestamp: nowStr
    });

    reasoningSteps.push({
      agentId: 'sales',
      agentName: 'Sales Agent',
      phase: 'domain_analysis',
      thought: 'Yesterday counter sales stood at ₹48,750 with net profit of ₹11,430 (23.4% margin). Projected today forecast is ₹52,000–₹58,000.',
      dataCited: ['Sales: ₹48,750', 'Net Profit: ₹11,430'],
      timestamp: nowStr
    });

    reasoningSteps.push({
      agentId: 'inventory',
      agentName: 'Inventory Agent',
      phase: 'domain_analysis',
      thought: 'Inventory health: 1-inch PVC Pipe is critical (4 bundles left, 3 days). Copper wire is low (12 rolls left, 4 days). Recommending replenishment.',
      dataCited: ['1-inch PVC: 3 days left', 'Copper wire: 4 days left'],
      timestamp: nowStr
    });

    reasoningSteps.push({
      agentId: 'crm',
      agentName: 'CRM & Khata Agent',
      phase: 'final_synthesis',
      thought: 'Uncollected customer khata stands at ₹72,500 across 3 accounts (Sharma Construction ₹32k, Sai Electric ₹21.5k, Om Enterprises ₹19k).',
      dataCited: ['Pending Khata: ₹72,500'],
      timestamp: nowStr
    });

    finalAnswer = `Here is the current business status for **Rajesh Hardware & Electricals (Thane West)**:

| Business Area | Current Status | Key Action Required |
| :--- | :--- | :--- |
| **💰 Counter Sales & Profit** | **₹48,750 Sales** / **₹11,430 Profit** | Today's expected revenue: **₹52,000 – ₹58,000** |
| **📦 Inventory & Stockout** | **1-inch PVC Pipe (3 days left)** | Reorder 50 bundles from **Mahesh Traders** (save ₹670) |
| **⚡ Demand Surge** | **Copper Wire (+38% sales)** | Only 12 rolls left (reorder 150 rolls to prevent stockout) |
| **💸 Pending Khata (Udhar)** | **₹72,500 across 3 accounts** | Sharma Construction ₹32,000 (92% recovery prob) |

---

### 💡 What would you like to do, Rajesh Bhai?
- Click **"Low-stock item order kar do"** to restock PVC pipe at best supplier rate.
- Click **"Kaunse customers ne payment nahi kiya?"** to send polite WhatsApp payment reminders with UPI links.
- Click **"Business improve kaise kar sakte hai?"** to review 32% margin LED vs water pump space reallocation.`;

    keyDataPoints = [
      { label: "Yesterday Sales", value: "₹48,750" },
      { label: "Net Profit", value: "₹11,430" },
      { label: "Pending Udhar", value: "₹72,500" },
      { label: "Stock Alert", value: "PVC Pipe (3 Days)" }
    ];

    suggestedActions = [
      { label: "Haan, low-stock item order kar do", actionType: "vyapar_supplier_modal", payload: { item: "1-inch PVC Pipe" } },
      { label: "Kaunse customers ne payment nahi kiya?", actionType: "query", payload: { query: "Kaunse customers ne payment nahi kiya?" } },
      { label: "Business improve kaise kar sakte hai?", actionType: "query", payload: { query: "Business improve kaise kar sakte hai?" } }
    ];
  }

  return {
    id: `msg-${Date.now()}`,
    sender: 'coo',
    queryText: query,
    fileName: query ? `${query.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32)}.md` : 'executive-forecast.md',
    reasoningSteps,
    finalAnswer,
    participatingAgents,
    keyDataPoints,
    suggestedActions,
    timestamp: nowStr
  };
}
