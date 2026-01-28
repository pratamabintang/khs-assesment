import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { AuthRequest } from 'src/request/auth.request';
import { SurveySubmission } from './survey-submission.schema';
import { SurveySubmissionDto } from '../dto/survey-submission.dto';
import { SurveySubmissionService } from './survey-submission.service';
import { UpdateSurveySubmissionDto } from '../dto/update-survey-submission.dto';
import { Role } from 'src/decorator/role.decorator';
import { RoleEnum } from 'src/users/role.enum';
import { Survey } from '../survey.entity';

@Controller('submission')
export class SurveySubmissionController {
  constructor(
    private readonly surveySubmissionService: SurveySubmissionService,
  ) {}

  @Post('')
  async createSubmission(
    @Req() request: AuthRequest,
    @Body() data: SurveySubmissionDto,
  ): Promise<SurveySubmission> {
    return await this.surveySubmissionService.create(request.user, data);
  }

  @Get('')
  async findAllSubmission(
    @Req() request: AuthRequest,
    @Query('surveyId') surveyId?: string,
    @Query('employeeId') employeeId?: string,
  ): Promise<SurveySubmission[]> {
    return this.surveySubmissionService.findAllSubmission(
      request.user,
      surveyId,
      employeeId,
    );
  }

  @Get(':id')
  async findOneSubmission(
    @Req() request: AuthRequest,
    @Param('id') id: string,
  ): Promise<{ survey: Survey; submission: SurveySubmission }> {
    return this.surveySubmissionService.findOneSubmission(request.user, id);
  }

  @Patch(':id')
  async updateSubmission(
    @Req() request: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateSurveySubmissionDto,
  ): Promise<SurveySubmission> {
    return this.surveySubmissionService.update(request.user, id, dto);
  }

  @Delete(':id')
  @Role(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSubmission(@Param('id') entryId: string) {
    return this.surveySubmissionService.remove(entryId);
  }
}
