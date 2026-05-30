import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Anthropic from "@anthropic-ai/sdk";
import { PrismaService } from "../common/database/prisma.service";

@Injectable()
export class AiService {
  private readonly log = new Logger(AiService.name);
  private client: Anthropic | null = null;
  private readonly model = "claude-sonnet-4-6";

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    const key = config.get<string>("ANTHROPIC_API_KEY");
    if (key) {
      this.client = new Anthropic({ apiKey: key });
      this.log.log("AI (Claude) configured ✓");
    } else {
      this.log.warn("ANTHROPIC_API_KEY not set — AI features disabled");
    }
  }

  get isEnabled() { return !!this.client; }

  private disabled() {
    return "AI assistant is not configured. Set ANTHROPIC_API_KEY in environment variables.";
  }

  private async ask(system: string, user: string, maxTokens = 1024): Promise<string> {
    const msg = await this.client!.messages.create({
      model: this.model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    });
    return (msg.content[0] as Anthropic.TextBlock).text;
  }

  private parseJson(text: string, fallback: any): any {
    try {
      const m = text.match(/\{[\s\S]*\}/);
      return m ? JSON.parse(m[0]) : fallback;
    } catch {
      return fallback;
    }
  }

  // ── 1. AI Pharmacist Assistant ────────────────────────────────────────────
  async pharmacistAssistant(question: string, medicineName?: string): Promise<{ answer: string }> {
    if (!this.isEnabled) return { answer: this.disabled() };

    const answer = await this.ask(
      `You are an expert clinical pharmacist assistant for DawoLink, a pharmacy platform in Somalia.
You help pharmacy staff with: drug interactions, alternative medicines, dosage references, side effects, and prescription guidance.
Always be accurate and evidence-based. Flag dangerous interactions clearly. Be concise and actionable.`,
      medicineName ? `Medicine: ${medicineName}\n\nQuestion: ${question}` : question,
      1024,
    );
    return { answer };
  }

  // ── 2. AI Demand Forecasting ──────────────────────────────────────────────
  async demandForecast(branchId: string) {
    if (!this.isEnabled) return { error: this.disabled() };

    const since = new Date(Date.now() - 90 * 86400000);
    const transactions = await this.prisma.transaction.findMany({
      where: { branchId, createdAt: { gte: since } },
      include: { items: { include: { medicine: true } } },
    });

    const sales = this.aggregateSales(transactions);
    const top = Object.entries(sales)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 25)
      .map(([name, qty]) => `${name}: ${qty} units in 90 days`);

    const text = await this.ask(
      `You are a pharmaceutical demand forecasting AI for pharmacies in Somalia.
Analyze sales data and predict demand considering Somalia's disease patterns (malaria season Mar-Jun & Sep-Nov, respiratory infections in dry season), regional factors, and medicine trends.
Return ONLY valid JSON:
{
  "summary": "brief overview string",
  "forecasts": [
    { "medicine": "name", "trend": "rising|stable|declining", "predictedChange": "+35%", "reason": "why", "recommendation": "what to do" }
  ],
  "seasonalAlerts": ["alert strings"],
  "stockRisks": ["risk strings"]
}`,
      `Sales data (last 90 days):\n${top.join("\n")}\nDate: ${new Date().toISOString().split("T")[0]}`,
      2048,
    );

    return this.parseJson(text, { summary: text, forecasts: [], seasonalAlerts: [], stockRisks: [] });
  }

  // ── 3. AI Inventory Optimization ─────────────────────────────────────────
  async inventoryOptimize(branchId: string) {
    if (!this.isEnabled) return { error: this.disabled() };

    const [inventory, recentTx] = await Promise.all([
      this.prisma.inventoryItem.findMany({
        where: { branchId, deletedAt: null },
        include: { medicine: true },
        take: 60,
      }),
      this.prisma.transaction.findMany({
        where: { branchId, createdAt: { gte: new Date(Date.now() - 30 * 86400000) } },
        include: { items: { include: { medicine: true } } },
      }),
    ]);

    const sales = this.aggregateSales(recentTx);
    const lines = inventory.map(i =>
      `${i.medicine.name}: stock=${i.quantity}, reorderAt=${i.reorderLevel ?? 10}, sold30d=${sales[i.medicine.name] ?? 0}`,
    );

    const text = await this.ask(
      `You are an inventory optimization AI for a Somali pharmacy.
Analyze stock vs. sales velocity and recommend actions.
Return ONLY valid JSON:
{
  "recommendations": [
    { "medicine": "name", "action": "ORDER|REDUCE|TRANSFER|OK", "quantity": 50, "urgency": "HIGH|MEDIUM|LOW", "reason": "why" }
  ],
  "criticalStock": ["medicines nearly out of stock"],
  "overstocked": ["medicines with excess stock"],
  "insight": "one-sentence summary"
}`,
      `Inventory (name: stock, reorderAt, sold last 30 days):\n${lines.join("\n")}`,
      2048,
    );

    return this.parseJson(text, { recommendations: [], criticalStock: [], overstocked: [], insight: text });
  }

  // ── 4. AI Fraud Detection ─────────────────────────────────────────────────
  async fraudDetect(pharmacyId: string, days = 30) {
    if (!this.isEnabled) return { error: this.disabled() };

    const since = new Date(Date.now() - days * 86400000);
    const logs = await this.prisma.auditLog.findMany({
      where: { pharmacyId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 300,
    });

    const relevant = logs
      .filter(l => ["STOCK_ADJUSTED", "SALE", "STOCK_ADDED"].includes(l.action))
      .map(l =>
        `${l.createdAt.toISOString().slice(0, 16)} | ${l.action} | actor:${l.userId?.slice(-6) ?? "?"} | ${JSON.stringify(l.newValue ?? {}).slice(0, 120)}`,
      )
      .join("\n");

    const text = await this.ask(
      `You are a pharmacy fraud detection AI. Analyze audit logs for suspicious patterns:
- Repeated stock adjustments by same employee
- Unusual transaction amounts or voids
- Off-hours activity
- Inventory manipulation
Return ONLY valid JSON:
{
  "riskLevel": "LOW|MEDIUM|HIGH",
  "alerts": [{ "type": "string", "description": "string", "severity": "LOW|MEDIUM|HIGH", "actorHint": "optional actor" }],
  "summary": "overall assessment string"
}`,
      `Audit logs (last ${days} days):\n${relevant || "No relevant audit events found."}`,
      1024,
    );

    return this.parseJson(text, { riskLevel: "LOW", alerts: [], summary: text });
  }

  // ── 5. Customer Health Assistant ─────────────────────────────────────────
  async healthAssistant(question: string): Promise<{ answer: string }> {
    if (!this.isEnabled) return { answer: "AI assistant is temporarily unavailable." };

    const answer = await this.ask(
      `You are a friendly health assistant for DawoLink, a pharmacy marketplace in Somalia.
Help customers find medicines and answer general health questions.
Rules:
- Never diagnose medical conditions
- Always recommend seeing a doctor for serious symptoms
- Suggest relevant medicines for minor ailments (headache, cold, fever, etc.)
- Mention that medicines can be found on DawoLink
- Keep responses concise and friendly
- If asked about serious symptoms, strongly advise seeing a doctor`,
      question,
      512,
    );
    return { answer };
  }

  // ── helpers ───────────────────────────────────────────────────────────────
  private aggregateSales(transactions: any[]): Record<string, number> {
    const map: Record<string, number> = {};
    for (const tx of transactions) {
      for (const item of tx.items ?? []) {
        const name = item.medicine?.name ?? "Unknown";
        map[name] = (map[name] ?? 0) + (item.quantity ?? 1);
      }
    }
    return map;
  }
}
