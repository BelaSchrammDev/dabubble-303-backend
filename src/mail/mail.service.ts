import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    const mailHost = process.env.MAIL_HOST;
    if (mailHost) {
      const transportConfig: any = {
        host: mailHost,
        port: parseInt(process.env.MAIL_PORT || '587'),
        secure: false,
      };
      if (process.env.MAIL_USER && process.env.MAIL_PASS) {
        transportConfig.auth = {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        };
      }
      this.transporter = nodemailer.createTransport(transportConfig);
    } else {
      this.logger.warn('MAIL_HOST nicht gesetzt — E-Mails werden nur geloggt.');
    }
  }

  private async sendMail(options: nodemailer.SendMailOptions): Promise<void> {
    if (!this.transporter) {
      this.logger.log(`[MAIL-SIMULATION] To: ${options.to} | Subject: ${options.subject}`);
      this.logger.log(`[MAIL-SIMULATION] Body: ${options.text || options.html}`);
      return;
    }
    try {
      await this.transporter.sendMail({
        from: process.env.MAIL_FROM || 'noreply@dabubble.de',
        ...options,
      });
    } catch (err) {
      this.logger.error('Fehler beim E-Mail-Versand', err);
    }
  }

  async sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const link = `${frontendUrl}/verify-email?token=${token}`;
    await this.sendMail({
      to: email,
      subject: 'Dabubble – E-Mail bestätigen',
      html: `
        <h2>Hallo ${name}!</h2>
        <p>Bitte bestätige deine E-Mail-Adresse:</p>
        <a href="${link}" style="
          display:inline-block;padding:12px 24px;background:#428BFF;
          color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
          E-Mail bestätigen
        </a>
        <p>Der Link ist 24 Stunden gültig.</p>
        <p>Falls du dich nicht registriert hast, kannst du diese E-Mail ignorieren.</p>
      `,
      text: `Hallo ${name}! Bitte bestätige deine E-Mail: ${link}`,
    });
  }

  async sendPasswordResetEmail(email: string, name: string, token: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const link = `${frontendUrl}/reset-password?token=${token}`;
    await this.sendMail({
      to: email,
      subject: 'Dabubble – Passwort zurücksetzen',
      html: `
        <h2>Hallo ${name}!</h2>
        <p>Du hast eine Passwort-Zurücksetzung angefordert:</p>
        <a href="${link}" style="
          display:inline-block;padding:12px 24px;background:#428BFF;
          color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
          Passwort zurücksetzen
        </a>
        <p>Der Link ist 2 Stunden gültig.</p>
        <p>Falls du kein neues Passwort angefordert hast, kannst du diese E-Mail ignorieren.</p>
      `,
      text: `Hallo ${name}! Passwort zurücksetzen: ${link}`,
    });
  }
}
