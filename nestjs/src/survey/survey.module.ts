import { Module } from '@nestjs/common';
import { SurveyService } from './survey.service';
import { SurveyController } from './survey.controller';
import { SurveyQuestion } from './survey-question.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveyQuestionDetail } from './survey-question-detail.entity';
import { Survey } from './survey.entity';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SurveySubmission,
  SurveySubmissionSchema,
} from './schema/survey-submission.schema';
import { SurveySubmissionService } from './schema/survey-submission.service';
import { EmployeeModule } from '../employee/employee.module';
import { UsersModule } from '../users/users.module';
import { SurveySubmissionController } from './schema/survey-submission.controller';
import { SurveySubmissionEntry } from './survey-submission/survey-submission.entity';
import { SurveySubmissionEntryController } from './survey-submission/survey-submission-entry.controller';
import { SurveySubmissionEntryService } from './survey-submission/survey-submission-entry.service';
import { AutoFillSubmission } from './scheduler/auto-fill.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SurveyQuestionDetail,
      SurveyQuestion,
      Survey,
      SurveySubmissionEntry,
    ]),
    MongooseModule.forFeature([
      { name: SurveySubmission.name, schema: SurveySubmissionSchema },
    ]),
    EmployeeModule,
    UsersModule,
  ],
  controllers: [
    SurveyController,
    SurveySubmissionController,
    SurveySubmissionEntryController,
  ],
  providers: [
    SurveyService,
    SurveySubmissionService,
    SurveySubmissionEntryService,
    AutoFillSubmission,
  ],
  exports: [SurveySubmissionService],
})
export class SurveyModule {}
