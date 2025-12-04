// src/main.ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Global validation/transforms for DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  // CORS configuration with support for multiple origins
  const frontendOrigin = config.get<string>('FRONTEND_ORIGIN');
  
  // Parse multiple origins if comma-separated, or use defaults
  const allowedOrigins = frontendOrigin
    ? frontendOrigin.split(',').map(origin => origin.trim())
    : [
        'http://localhost:5173',  // Vite default port
        'http://localhost:3001',  // Alternative port
        'http://localhost:3000',  // Development
      ];

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
    credentials: true,
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 3600,
  });

  const port = Number(process.env.PORT ?? 8080);
  await app.listen(port, '0.0.0.0');
  
  console.log({ PORT: process.env.PORT, APP_PORT: process.env.APP_PORT, chosenPort: port });
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API available at: http://localhost:${port}/api`);
  console.log(`🌍 Allowing CORS from: ${allowedOrigins.join(', ')}`);


console.log({ PORT: process.env.PORT, chosenPort: port });
console.log(`Listening on ${await app.getUrl()}`);  
}

bootstrap();
