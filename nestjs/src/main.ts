import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  ClassSerializerInterceptor,
  ValidationPipe,
  Logger,
  INestApplication,
} from '@nestjs/common';
import * as fs from 'fs';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';
  let app: INestApplication;
  let corsOrigin: string[];

  if (isProduction) {
    app = await NestFactory.create(AppModule);
    corsOrigin = process.env.CORS_ORIGIN?.split(',') || [
      'https://localhost:4200',
    ];
  } else {
    const httpsOptions = {
      key: fs.readFileSync('certs/localhost-key.pem'),
      cert: fs.readFileSync('certs/localhost.pem'),
    };
    app = await NestFactory.create(AppModule, { httpsOptions });
    corsOrigin = ['https://localhost:4200'];
  }

  app.use(cookieParser());

  app.enableCors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const port = process.env.API_PORT || 3000;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(
    `✅ Application running in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`,
  );
  logger.log(`✅ Server listening on port ${port}`);
}

void bootstrap();
