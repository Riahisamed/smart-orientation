import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AuthEmailService {
  private readonly logger = new Logger(AuthEmailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly fromEmail: string;
  private readonly frontendBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    const host =
      this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com';
    const port = Number(this.configService.get<string>('SMTP_PORT') || 587);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    this.fromEmail =
      this.configService.get<string>('SMTP_FROM') ||
      this.configService.get<string>('SMTP_USER') ||
      'no-reply@smart-orientation.local';

    this.frontendBaseUrl = this.configService.get<string>('FRONTEND_URL') || '';

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const resetLink = `${this.frontendBaseUrl}/reset-password?token=${encodeURIComponent(token)}`;

    await this.transporter.sendMail({
      from: this.fromEmail,
      to: email,
      subject: 'Reset your password',
      text: `We received a request to reset your password. Use this link to continue: ${resetLink}\n\nThis link expires in 1 hour.`,
      html: `
        <p>We received a request to reset your password.</p>
        <p><a href="${resetLink}">Click here to reset your password</a></p>
        <p>This link expires in <strong>1 hour</strong>.</p>
      `,
    });

    this.logger.log(`Password reset email sent to ${email}`);
  }
}
