import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { databaseConfig } from './config/database.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { appConfigSchema } from './config/config.types';
import { authConfig } from './config/auth.config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SurveyModule } from './survey/survey.module';
import { MongooseModule } from '@nestjs/mongoose';
import { PdfModule } from './pdf/pdf.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: 1000,
          limit: 10,
        },
      ],
    }),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, authConfig],
      validationSchema: appConfigSchema,
      validationOptions: {
        abortEarly: true,
      },
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions =>
        config.get<TypeOrmModuleOptions>('database')!,
    }),
    MongooseModule.forRoot(process.env.MONGO_URI!),
    AuthModule,
    SurveyModule,
    PdfModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
