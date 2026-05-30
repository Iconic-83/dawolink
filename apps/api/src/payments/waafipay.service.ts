import { Injectable, Logger, BadRequestException, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";

export type WaafiPayMethod = "EVC_PLUS" | "ZAAD" | "SAHAL" | "PREMIER_WALLET";

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  requestId: string;
  state: string;
  message: string;
}

const METHOD_LABELS: Record<WaafiPayMethod, string> = {
  EVC_PLUS:       "EVC Plus",
  ZAAD:           "Zaad",
  SAHAL:          "Sahal",
  PREMIER_WALLET: "Premier Wallet",
};

@Injectable()
export class WaafiPayService {
  private readonly log = new Logger(WaafiPayService.name);
  private readonly isEnabled: boolean;
  private readonly baseUrl: string;
  private readonly merchantUid: string;
  private readonly apiUserId: string;
  private readonly apiKey: string;

  constructor(private config: ConfigService) {
    this.merchantUid = config.get("WAAFI_MERCHANT_UID", "");
    this.apiUserId   = config.get("WAAFI_API_USER_ID",  "");
    this.apiKey      = config.get("WAAFI_API_KEY",       "");
    this.baseUrl     = config.get("WAAFI_BASE_URL",      "https://api.waafipay.net/asm");
    this.isEnabled   = !!(this.merchantUid && this.apiUserId && this.apiKey);

    if (!this.isEnabled) {
      this.log.warn("WaafiPay not configured — WAAFI_MERCHANT_UID, WAAFI_API_USER_ID, WAAFI_API_KEY required");
    } else {
      this.log.log("WaafiPay gateway enabled");
    }
  }

  get enabled() { return this.isEnabled; }

  /**
   * Initiates a push payment (sends USSD prompt to customer phone).
   * Phone must be in international format: 252615xxxxxx (no +)
   */
  async initiate(opts: {
    phone: string;
    amount: number;
    currency?: string;
    description: string;
    referenceId: string;
    invoiceId?: string;
    method?: WaafiPayMethod;
  }): Promise<PaymentResult> {
    if (!this.isEnabled) {
      throw new ServiceUnavailableException(
        "Payment gateway not configured. Please contact support or use manual reference payment.",
      );
    }

    const phone = opts.phone.replace(/\D/g, "").replace(/^0/, "252").replace(/^\+/, "");
    if (!phone.startsWith("252") || phone.length < 12) {
      throw new BadRequestException("Enter a valid Somali phone number (e.g. 0615000000)");
    }

    const requestId = randomUUID();
    const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);

    const body = {
      schemaVersion: "1.0",
      requestId,
      timestamp,
      channelName: "WEB",
      serviceName: "API_PURCHASE",
      serviceParams: {
        merchantUid: this.merchantUid,
        apiUserId: this.apiUserId,
        apiKey: this.apiKey,
        paymentMethod: "MWALLET_ACCOUNT",
        payerInfo: { accountNo: phone },
        transactionInfo: {
          referenceId: opts.referenceId,
          invoiceId: opts.invoiceId ?? opts.referenceId,
          amount: opts.amount,
          currency: opts.currency ?? "USD",
          description: opts.description,
        },
      },
    };

    this.log.log(`Initiating ${opts.method ?? "EVC_PLUS"} payment: ${phone} $${opts.amount} ref=${opts.referenceId}`);

    let raw: any;
    try {
      const res = await fetch(this.baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30_000),
      });
      raw = await res.json();
    } catch (err: any) {
      this.log.error(`WaafiPay network error: ${err.message}`);
      throw new ServiceUnavailableException("Payment gateway unreachable. Please try again.");
    }

    this.log.log(`WaafiPay response: ${JSON.stringify(raw?.params ?? raw)}`);

    const params = raw?.params ?? {};
    const state: string = params.state ?? raw?.state ?? "UNKNOWN";
    const txId: string | undefined = params.transactionId ?? params.issuerTransactionId;

    const success = state === "APPROVED" || params.responseCode === "RCS_0" || params.responseCode === "2001";

    return {
      success,
      requestId,
      state,
      transactionId: txId,
      message: this.humanMessage(state, params),
    };
  }

  private humanMessage(state: string, params: any): string {
    const map: Record<string, string> = {
      APPROVED:           "Payment successful",
      DECLINED:           "Payment declined by network",
      INSUFFICIENT_FUNDS: "Insufficient balance. Please top up and try again.",
      INVALID_ACCOUNT:    "Phone number not registered with EVC Plus / Zaad",
      PENDING:            "Payment initiated. Please confirm on your phone.",
      TIMEOUT:            "Payment timed out. Please try again.",
    };
    return map[state] ?? params?.description ?? `Payment ${state.toLowerCase()}`;
  }
}
