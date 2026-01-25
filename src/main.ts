import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import basicAuth from 'express-basic-auth';
import cookieParser from 'cookie-parser';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    '/docs',
    basicAuth({
      challenge: true,
      users: {
        admin: process.env.SWAGGER_PASSWORD || 'secret',
      },
    }),
  );

  app.use(cookieParser());

  const config = new DocumentBuilder()
    .setTitle('Api Documentation')
    .setVersion('1.0')
    .build();

  const documentFactory = () => {
    return SwaggerModule.createDocument(app, config);
  };
  SwaggerModule.setup('docs', app, documentFactory);

  app.setGlobalPrefix('api');

  // Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap().catch(() => console.log('failed to boostrap application'));
