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
}
