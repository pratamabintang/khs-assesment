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
import { EntryService } from './entry.service';
import { Role } from 'src/decorator/role.decorator';
import { RoleEnum } from 'src/users/role.enum';
import type { AuthRequest } from 'src/request/auth.request';
import { MonthQuery } from './query/month.query';
import { AssignSurvey } from './dto/assign-survey.dto';
import { RangeQuery } from './query/range.query';
import { IsUpdateDto } from './dto/is-update.dto';
import { EntryResponse } from './response/entry.response';

@Controller('submission-entry')
export class EntryController {
  constructor(private readonly entryService: EntryService) {}

  @Post('')
  @Role(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: AuthRequest,
    @Body() body: AssignSurvey,
  ): Promise<void> {
    return await this.entryService.create(req.user, body);
  }

  @Get('')
  async getAll(
    @Req() req: AuthRequest,
    @Query() query: MonthQuery,
  ): Promise<EntryResponse[]> {
    return EntryResponse.fromArray(
      await this.entryService.getAll(req.user, query.month),
    );
  }

  @Get('admin')
  @Role(RoleEnum.ADMIN)
  async getAllAdmin(
    @Req() req: AuthRequest,
    @Query() query: RangeQuery,
  ): Promise<EntryResponse[]> {
    return EntryResponse.fromArray(
      await this.entryService.getAllAdmin(req.user, query.from, query.to),
    );
  }

  @Post('isUpdate')
  async isUpdate(
    @Req() req: AuthRequest,
    @Body() body: IsUpdateDto,
  ): Promise<boolean> {
    return await this.entryService.isUpdate(
      req.user,
      body.employeeId,
      body.surveyId,
      body.periodMonth,
    );
  }
}
