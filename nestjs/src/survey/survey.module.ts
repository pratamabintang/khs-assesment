import { Module } from '@nestjs/common';
import { SurveyService } from './survey.service';
import { SurveyController } from './survey.controller';
import { SurveyQuestion } from './survey-question.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveyQuestionDetail } from './survey-question-detail.entity';
import { Survey } from './survey.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { Data, DataSchema } from './data/data.schema';
import { DataService } from './data/data.service';
import { EmployeeModule } from '../employee/employee.module';
import { UsersModule } from '../users/users.module';
import { DataController } from './data/data.controller';
import { AutoFillSubmission } from './scheduler/auto-fill.service';
import { Entry } from './entry/entry.entity';
import { EntryController } from './entry/entry.controller';
import { EntryService } from './entry/entry.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SurveyQuestionDetail,
      SurveyQuestion,
      Survey,
      Entry,
    ]),
    MongooseModule.forFeature([{ name: Data.name, schema: DataSchema }]),
    EmployeeModule,
    UsersModule,
  ],
  controllers: [SurveyController, DataController, EntryController],
  providers: [SurveyService, DataService, EntryService, AutoFillSubmission],
  exports: [DataService],
})
export class SurveyModule {}
