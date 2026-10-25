import { Injectable, Logger } from '@nestjs/common';

/**
 * Sends SMS messages. This implementation only logs the message; to go live,
 * replace `send` with a call to an Iranian SMS provider (e.g. Kavenegar,
 * SMS.ir, Melipayamak) — nothing else in the app needs to change.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  async send(phone: string, message: string): Promise<void> {
    this.logger.log(`SMS to ${phone}: ${message}`);
  }
}
