import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  console.log('==========================================');
  console.log('BOOTSTRAP STARTING');
  console.log('==========================================');
  console.log('Node version: ' + process.version);
  console.log('Environment: ' + process.env.NODE_ENV);
  console.log('PORT from env: ' + process.env.PORT);
  console.log('FRONTEND_ORIGIN: ' + process.env.FRONTEND_ORIGIN);
  console.log('==========================================');

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  console.log('NestJS app created');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  console.log('Global pipes configured');

  app.setGlobalPrefix('api');
  console.log('API prefix set to /api');

  const frontendOrigin = configService.get<string>('FRONTEND_ORIGIN');
  console.log('Frontend origin: ' + frontendOrigin);
  
  const allowedOrigins = frontendOrigin
    ? frontendOrigin.split(',').map(origin => origin.trim())
    : ['http://localhost:5173', 'http://localhost:3001', 'http://localhost:3000'];

  console.log('Allowed origins: ' + allowedOrigins.join(', '));

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
    credentials: true,
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 3600,
  });

  console.log('CORS enabled');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('NeighborGuard API')
    .setDescription('Community Safety Reporting API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  console.log('Swagger configured at /api/docs');

  const port = process.env.PORT || 8080;
  console.log('==========================================');
  console.log('PORT: ' + port);
  console.log('PORT TYPE: ' + typeof port);
  console.log('==========================================');
  
  console.log('Binding to 0.0.0.0:' + port);
  await app.listen(port, '0.0.0.0');
  console.log('Successfully listening on 0.0.0.0:' + port);
  
  console.log('==========================================');
  console.log('SERVER RUNNING');
  console.log('==========================================');
  console.log('Local: http://0.0.0.0:' + port);
  console.log('API: http://0.0.0.0:' + port + '/api');
  console.log('Docs: http://0.0.0.0:' + port + '/api/docs');
  console.log('CORS: ' + allowedOrigins.join(', '));
  console.log('==========================================');
  console.log('PUBLIC: https://neighborguard-production.up.railway.app');
  console.log('==========================================');
}

bootstrap().catch(err => {
  console.error('BOOTSTRAP FAILED:');
  console.error(err);
  process.exit(1);
});
