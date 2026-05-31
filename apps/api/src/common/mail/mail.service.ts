import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

@Injectable()
export class MailService implements OnModuleInit {
  private readonly log = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private from: string = "DawoLink <noreply@dawolink.com>";

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const host = this.config.get<string>("SMTP_HOST");
    if (!host) {
      this.log.warn("SMTP_HOST not configured — email sending disabled");
      return;
    }
    this.transporter = nodemailer.createTransport({
      host,
      port: this.config.get<number>("SMTP_PORT", 587),
      secure: this.config.get<boolean>("SMTP_SECURE", false),
      auth: {
        user: this.config.get<string>("SMTP_USER"),
        pass: this.config.get<string>("SMTP_PASS"),
      },
    });
    this.from = this.config.get<string>("SMTP_FROM", "DawoLink <noreply@dawolink.com>");
    this.log.log(`Email configured via ${host}`);
  }

  get isEnabled() {
    return !!this.transporter;
  }

  async sendStaffInvite(opts: {
    to: string;
    pharmacyName: string;
    invitedByName: string;
    role: string;
    inviteUrl: string;
    expiresAt: Date;
  }) {
    if (!this.transporter) return;

    const roleLabel = opts.role.replace(/_/g, " ").toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());

    const expiryStr = opts.expiresAt.toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric",
    });

    await this.transporter.sendMail({
      from: this.from,
      to: opts.to,
      subject: `You've been invited to join ${opts.pharmacyName} on DawoLink`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff">
          <div style="text-align:center;margin-bottom:32px">
            <h1 style="font-size:24px;font-weight:800;color:#180D62;margin:0">
              Dawo<span style="color:#00C897">Link</span>
            </h1>
          </div>

          <h2 style="font-size:20px;color:#180D62;margin:0 0 8px">
            You've been invited!
          </h2>
          <p style="color:#6B6B9A;margin:0 0 24px">
            <strong style="color:#180D62">${opts.invitedByName}</strong> has invited you to join
            <strong style="color:#180D62">${opts.pharmacyName}</strong> as a
            <strong style="color:#180D62">${roleLabel}</strong>.
          </p>

          <div style="text-align:center;margin:32px 0">
            <a href="${opts.inviteUrl}"
               style="display:inline-block;padding:14px 32px;background:linear-gradient(90deg,#00C897,#009E78);color:#fff;font-weight:700;font-size:15px;border-radius:12px;text-decoration:none">
              Accept Invitation
            </a>
          </div>

          <p style="color:#9B9BC0;font-size:13px;text-align:center">
            This invitation expires on <strong>${expiryStr}</strong>.<br/>
            If you didn't expect this, you can safely ignore this email.
          </p>

          <hr style="border:none;border-top:1px solid #EDE9FF;margin:24px 0"/>
          <p style="color:#C4B5FD;font-size:12px;text-align:center">
            DawoLink · Pharmacy Management Platform · Somalia
          </p>
        </div>
      `,
    }).catch(err => this.log.error(`Failed to send invite email to ${opts.to}: ${err.message}`));
  }

  async sendTrialExpiring(opts: {
    to: string;
    pharmacyName: string;
    daysLeft: number;
    upgradeUrl: string;
  }) {
    if (!this.transporter) return;

    const urgency = opts.daysLeft <= 1 ? "🚨 Last day" : `⏳ ${opts.daysLeft} days left`;

    await this.transporter.sendMail({
      from: this.from,
      to: opts.to,
      subject: `${urgency} — Your DawoLink trial is ending soon`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff">
          <div style="text-align:center;margin-bottom:32px">
            <h1 style="font-size:24px;font-weight:800;color:#180D62;margin:0">
              Dawo<span style="color:#00C897">Link</span>
            </h1>
          </div>

          <div style="background:linear-gradient(135deg,#FFF7ED,#FEF3C7);border:1px solid #FCD34D;border-radius:16px;padding:24px;margin-bottom:24px;text-align:center">
            <p style="font-size:32px;margin:0 0 8px">${opts.daysLeft <= 1 ? "🚨" : "⏳"}</p>
            <h2 style="font-size:22px;color:#92400E;margin:0 0 6px">
              ${opts.daysLeft <= 1 ? "Your trial ends today" : `${opts.daysLeft} days left in your trial`}
            </h2>
            <p style="color:#B45309;margin:0;font-size:14px">
              ${opts.pharmacyName} · DawoLink Free Trial
            </p>
          </div>

          <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px">
            Hi <strong>${opts.pharmacyName}</strong>,<br/><br/>
            Your 14-day free trial is ending in <strong>${opts.daysLeft} day${opts.daysLeft !== 1 ? "s" : ""}</strong>.
            After it expires, your account will be suspended and your staff won't be able to access the system.
          </p>

          <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px">
            Upgrade now to keep your pharmacy running — inventory, POS, expiry tracking, and your full team stay active.
          </p>

          <div style="text-align:center;margin:32px 0">
            <a href="${opts.upgradeUrl}"
               style="display:inline-block;padding:16px 36px;background:linear-gradient(90deg,#00C897,#009E78);color:#fff;font-weight:700;font-size:16px;border-radius:12px;text-decoration:none">
              Upgrade Now — Keep Access
            </a>
          </div>

          <div style="background:#F4F2FF;border-radius:12px;padding:16px 20px;margin-bottom:24px">
            <p style="font-size:13px;font-weight:700;color:#180D62;margin:0 0 10px">Plans start at $29/month:</p>
            <ul style="margin:0;padding-left:18px;color:#4B5563;font-size:13px;line-height:1.8">
              <li><strong>Starter</strong> — $29/mo · 1 branch · 5 staff · Full POS + inventory</li>
              <li><strong>Professional</strong> — $79/mo · 5 branches · 50 staff · All features</li>
            </ul>
          </div>

          <hr style="border:none;border-top:1px solid #EDE9FF;margin:24px 0"/>
          <p style="color:#C4B5FD;font-size:12px;text-align:center">
            DawoLink · Pharmacy Management Platform · Somalia
          </p>
        </div>
      `,
    }).catch(err => this.log.error(`Failed to send trial expiry email to ${opts.to}: ${err.message}`));
  }

  async sendSubscriptionExpiring(opts: {
    to: string;
    pharmacyName: string;
    daysLeft: number;
    plan: string;
    billingCycle: string;
    upgradeUrl: string;
  }) {
    if (!this.transporter) return;

    const isUrgent = opts.daysLeft <= 3;
    const cycleLabel = opts.billingCycle === "ANNUAL" ? "annual" : "monthly";
    const emoji = opts.daysLeft === 1 ? "🚨" : isUrgent ? "⚠️" : "📅";
    const subject = opts.daysLeft === 1
      ? `🚨 Your DawoLink subscription expires tomorrow`
      : `${emoji} Your DawoLink subscription expires in ${opts.daysLeft} days`;

    await this.transporter.sendMail({
      from: this.from,
      to: opts.to,
      subject,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff">
          <div style="text-align:center;margin-bottom:32px">
            <h1 style="font-size:24px;font-weight:800;color:#180D62;margin:0">
              Dawo<span style="color:#00C897">Link</span>
            </h1>
          </div>

          <div style="background:${isUrgent ? "linear-gradient(135deg,#FEF2F2,#FEE2E2);border:1px solid #FECACA" : "linear-gradient(135deg,#FFF7ED,#FEF3C7);border:1px solid #FCD34D"};border-radius:16px;padding:24px;margin-bottom:24px;text-align:center">
            <p style="font-size:36px;margin:0 0 8px">${emoji}</p>
            <h2 style="font-size:22px;color:${isUrgent ? "#991B1B" : "#92400E"};margin:0 0 6px">
              ${opts.daysLeft === 1 ? "Your subscription expires tomorrow" : `${opts.daysLeft} days until renewal`}
            </h2>
            <p style="color:${isUrgent ? "#B91C1C" : "#B45309"};margin:0;font-size:14px">
              ${opts.pharmacyName} · ${opts.plan} Plan · ${cycleLabel} billing
            </p>
          </div>

          <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px">
            Hi <strong>${opts.pharmacyName}</strong>,<br/><br/>
            Your <strong>${opts.plan}</strong> subscription (${cycleLabel} billing) expires in
            <strong>${opts.daysLeft} day${opts.daysLeft !== 1 ? "s" : ""}</strong>.
            Renew before it expires to avoid any interruption to your pharmacy operations.
          </p>

          <div style="background:#F4F2FF;border-radius:12px;padding:16px 20px;margin-bottom:24px">
            <p style="font-size:13px;color:#180D62;margin:0 0 8px;font-weight:700">What happens if you don't renew:</p>
            <ul style="margin:0;padding-left:18px;color:#4B5563;font-size:13px;line-height:1.8">
              <li>You can still log in and view your data</li>
              <li>New sales, orders, and inventory changes will be blocked</li>
              <li>Your data is safe — just renew to restore full access</li>
            </ul>
          </div>

          <div style="text-align:center;margin:32px 0">
            <a href="${opts.upgradeUrl}"
               style="display:inline-block;padding:16px 36px;background:${isUrgent ? "linear-gradient(90deg,#DC2626,#B91C1C)" : "linear-gradient(90deg,#00C897,#009E78)"};color:#fff;font-weight:700;font-size:16px;border-radius:12px;text-decoration:none">
              Renew My Subscription
            </a>
          </div>

          <hr style="border:none;border-top:1px solid #EDE9FF;margin:24px 0"/>
          <p style="color:#C4B5FD;font-size:12px;text-align:center">
            DawoLink · Pharmacy Management Platform · Somalia
          </p>
        </div>
      `,
    }).catch(err => this.log.error(`Failed to send renewal reminder to ${opts.to}: ${err.message}`));
  }

  async sendSubscriptionExpired(opts: {
    to: string;
    pharmacyName: string;
    upgradeUrl: string;
  }) {
    if (!this.transporter) return;

    await this.transporter.sendMail({
      from: this.from,
      to: opts.to,
      subject: `Your DawoLink account has been suspended — reactivate now`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff">
          <div style="text-align:center;margin-bottom:32px">
            <h1 style="font-size:24px;font-weight:800;color:#180D62;margin:0">
              Dawo<span style="color:#00C897">Link</span>
            </h1>
          </div>

          <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:16px;padding:24px;margin-bottom:24px;text-align:center">
            <p style="font-size:32px;margin:0 0 8px">🔒</p>
            <h2 style="font-size:22px;color:#991B1B;margin:0 0 6px">Subscription Expired — Read-Only Mode</h2>
            <p style="color:#B91C1C;margin:0;font-size:14px">${opts.pharmacyName}</p>
          </div>

          <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px">
            Your DawoLink subscription has expired. Your account is in <strong>read-only mode</strong> —
            you can still log in and view all your data, but new sales, orders, and inventory changes are paused
            until you renew. Your data is completely safe.
          </p>

          <div style="text-align:center;margin:32px 0">
            <a href="${opts.upgradeUrl}"
               style="display:inline-block;padding:16px 36px;background:linear-gradient(90deg,#180D62,#2D1B8E);color:#fff;font-weight:700;font-size:16px;border-radius:12px;text-decoration:none">
              Renew My Subscription
            </a>
          </div>

          <p style="color:#6B7280;font-size:13px;text-align:center">
            Need help? Reply to this email or contact support.
          </p>

          <hr style="border:none;border-top:1px solid #EDE9FF;margin:24px 0"/>
          <p style="color:#C4B5FD;font-size:12px;text-align:center">
            DawoLink · Pharmacy Management Platform · Somalia
          </p>
        </div>
      `,
    }).catch(err => this.log.error(`Failed to send suspension email to ${opts.to}: ${err.message}`));
  }

  async sendNewOrderNotification(opts: {
    to: string;
    pharmacyName: string;
    orderNo: string;
    customerName: string;
    total: number;
    itemCount: number;
    deliveryType: string;
    dashboardUrl: string;
  }) {
    if (!this.transporter) return;

    const deliveryLabel = opts.deliveryType === "PICKUP" ? "Pickup" : "Delivery";

    await this.transporter.sendMail({
      from: this.from,
      to: opts.to,
      subject: `New Order ${opts.orderNo} — ${opts.pharmacyName}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff">
          <div style="text-align:center;margin-bottom:24px">
            <h1 style="font-size:24px;font-weight:800;color:#180D62;margin:0">
              Dawo<span style="color:#00C897">Link</span>
            </h1>
          </div>

          <div style="background:linear-gradient(135deg,#F0FDF4,#DCFCE7);border:1px solid #86EFAC;border-radius:16px;padding:20px 24px;margin-bottom:24px">
            <p style="font-size:13px;color:#166534;font-weight:600;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em">New Order Received</p>
            <p style="font-size:28px;font-weight:800;color:#15803D;margin:0">${opts.orderNo}</p>
          </div>

          <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #F3F4F6;color:#6B7280;font-size:14px">Customer</td>
              <td style="padding:10px 0;border-bottom:1px solid #F3F4F6;color:#111827;font-size:14px;font-weight:600;text-align:right">${opts.customerName}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #F3F4F6;color:#6B7280;font-size:14px">Items</td>
              <td style="padding:10px 0;border-bottom:1px solid #F3F4F6;color:#111827;font-size:14px;font-weight:600;text-align:right">${opts.itemCount} item${opts.itemCount !== 1 ? "s" : ""}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #F3F4F6;color:#6B7280;font-size:14px">Type</td>
              <td style="padding:10px 0;border-bottom:1px solid #F3F4F6;color:#111827;font-size:14px;font-weight:600;text-align:right">${deliveryLabel}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#6B7280;font-size:14px">Total</td>
              <td style="padding:10px 0;color:#180D62;font-size:18px;font-weight:800;text-align:right">$${opts.total.toFixed(2)}</td>
            </tr>
          </table>

          <div style="text-align:center;margin:28px 0">
            <a href="${opts.dashboardUrl}"
               style="display:inline-block;padding:14px 32px;background:linear-gradient(90deg,#180D62,#2D1B8E);color:#fff;font-weight:700;font-size:15px;border-radius:12px;text-decoration:none">
              View &amp; Confirm Order
            </a>
          </div>

          <p style="color:#9CA3AF;font-size:12px;text-align:center">
            Confirm promptly to keep your customers happy.
          </p>

          <hr style="border:none;border-top:1px solid #EDE9FF;margin:24px 0"/>
          <p style="color:#C4B5FD;font-size:12px;text-align:center">
            DawoLink · Pharmacy Management Platform · Somalia
          </p>
        </div>
      `,
    }).catch(err => this.log.error(`Failed to send order notification to ${opts.to}: ${err.message}`));
  }

  async sendOtp(opts: { to: string; name: string; otp: string; expiresInMinutes: number }) {
    if (!this.isEnabled || !this.transporter) return;
    await this.transporter.sendMail({
      from: this.from,
      to: opts.to,
      subject: `${opts.otp} — Your DawoLink verification code`,
      html: `
        <div style="font-family:'Segoe UI',sans-serif;max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #EDE9FF">
          <div style="background:linear-gradient(135deg,#180D62,#2D1B8E);padding:28px 32px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800">Dawo<span style="color:#00C897">Link</span></h1>
            <p style="color:#C4B5FD;margin:6px 0 0;font-size:13px">Verification Code</p>
          </div>
          <div style="padding:32px">
            <p style="color:#180D62;font-size:15px;margin:0 0 8px">Hi ${opts.name},</p>
            <p style="color:#6B6B9A;font-size:14px;margin:0 0 28px">
              Use the code below to complete your sign-in. It expires in <strong>${opts.expiresInMinutes} minutes</strong>.
            </p>
            <div style="background:#F4F2FF;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
              <p style="font-size:40px;font-weight:900;letter-spacing:12px;color:#180D62;margin:0;font-family:monospace">
                ${opts.otp}
              </p>
            </div>
            <p style="color:#9B9BC0;font-size:12px;text-align:center;margin:0">
              If you did not request this code, you can safely ignore this email.
            </p>
            <hr style="border:none;border-top:1px solid #EDE9FF;margin:24px 0"/>
            <p style="color:#C4B5FD;font-size:12px;text-align:center">
              DawoLink · Pharmacy Management Platform · Somalia
            </p>
          </div>
        </div>
      `,
    }).catch(err => this.log.error(`Failed to send OTP to ${opts.to}: ${err.message}`));
  }

  async sendEmail(opts: { to: string; subject: string; html: string }) {
    if (!this.transporter) return;
    await this.transporter.sendMail({ from: this.from, ...opts })
      .catch(err => this.log.error(`Failed to send email to ${opts.to}: ${err.message}`));
  }
}
