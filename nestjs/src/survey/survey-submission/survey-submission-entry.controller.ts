import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { SurveySubmissionEntryService } from './survey-submission-entry.service';
import { Role } from 'src/decorator/role.decorator';
import { RoleEnum } from 'src/users/role.enum';
import type { AuthRequest } from 'src/request/auth.request';
import { SurveySubmissionEntry } from './survey-submission.entity';
import { MonthQueryDto } from './dto/month.query';
import { AssignSurvey } from './dto/assign-survey.dto';

@Controller('submission-entry')
export class SurveySubmissionEntryController {
  constructor(
    private readonly surveySubmissionEntryService: SurveySubmissionEntryService,
  ) {}

  @Post('')
  @Role(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: AuthRequest,
    @Body() dto: AssignSurvey,
  ): Promise<void> {
    return await this.surveySubmissionEntryService.create(req.user, dto);
  }

  @Get('')
  async getAll(
    @Req() req: AuthRequest,
    @Query() dto: MonthQueryDto,
  ): Promise<SurveySubmissionEntry[]> {
    return await this.surveySubmissionEntryService.getAll(req.user, dto.month);
  }

  @Get('admin')
  @Role(RoleEnum.ADMIN)
  async getAllAdmin(
    @Req() req: AuthRequest,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return await this.surveySubmissionEntryService.getAllAdmin(
      req.user,
      from,
      to,
    );
  }

  @Post('isUpdate')
  async isUpdate(
    @Req() req: AuthRequest,
    @Body() dto: { employeeId: string; surveyId: string; periodMonth: string },
  ): Promise<boolean> {
    return await this.surveySubmissionEntryService.isUpdate(
      req.user,
      dto.employeeId,
      dto.surveyId,
      dto.periodMonth,
    );
  }
}
