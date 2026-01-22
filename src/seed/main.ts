import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';
import { SeedService } from './seed/seed.service';
import chalk from 'chalk';

async function bootstrap() {
  const app = await NestFactory.create(SeedModule);
  const seedService = app.get(SeedService);
  await seedService.run();
  console.log(chalk.green.bold('Seed completed'));
  await app.close();
}

bootstrap().catch((error) => console.log('failed to run seeder', error));
