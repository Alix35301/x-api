import { Injectable } from '@nestjs/common';
import { UAParser } from 'ua-parser-js';

@Injectable()
export class DeviceServiceService {
  parse(userAgent: string): string {
    const parser = new UAParser(userAgent);
    const device = parser.getDevice();
    const os = parser.getOS();
    const browser = parser.getBrowser();

    return `${device.model || device.type || 'Unknown'} (${os.name || 'Unknown'} ${os.version || ''}) - ${browser.name || 'Unknown'} ${browser.version || ''}`.trim();
  }
}
