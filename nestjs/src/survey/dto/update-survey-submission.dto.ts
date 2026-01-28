import { PartialType } from '@nestjs/mapped-types';
import { SurveySubmissionDto } from './survey-submission.dto';

export class UpdateSurveySubmissionDto extends PartialType(
  SurveySubmissionDto,
) {}
