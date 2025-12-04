import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  // CORS configuration
  const frontendOrigin = configService.get<string>('FRONTEND_ORIGIN');
  const allowedOrigins = frontendOrigin
    ? frontendOrigin.split(',').map(origin => origin.trim())
    : ['http://localhost:5173', 'http://localhost:3001', 'http://localhost:3000'];

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
    credentials: true,
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 3600,
  });

  // Swagger docs
  const config = new DocumentBuilder()
    .setTitle('NeighborGuard API')
    .setDescription('Community Safety Reporting API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 8080;
  await app.listen(port, '0.0.0.0');
  
  // Fixed console.log statements - note the parenthesis placement!
  console.log(`🚀 Application is running on: http://0.0.0.0:${port}`);
  console.log(`📚 API available at: http://0.0.0.0:${port}/api`);
  console.log(`📖 Swagger docs: http://0.0.0.0:${port}/api/docs`);
  console.log(`🌍 Allowing CORS from: ${allowedOrigins.join(', ')}`);
}
bootstrap();
```

## 🚀 Steps to Fix:

1. **Edit main.ts on GitHub** (fix the console.log syntax)
2. **Add FRONTEND_ORIGIN in Railway Variables:**
```
   FRONTEND_ORIGIN=https://neighborguard-production.up.railway.app,http://localhost:3000
