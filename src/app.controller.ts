import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('')
  healthCheck(): string {
    return 'Welcome to API!';
  }
}
