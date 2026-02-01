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
import { DataDto } from './dto/data.dto';
import { DataService } from './data.service';
import { UpdateDataDto } from './dto/update-data.dto';
import { Role } from 'src/decorator/role.decorator';
import { RoleEnum } from 'src/users/role.enum';
import { FindAllQuery } from './query/find-all.query';
import { DataIdParam } from './param/data-id.param';
import { DataResponse } from './response/data.response';
import { SubmissionResponse } from './response/submission.response';
import { EntryIdParam } from './param/entry-id.param';

@Controller('submission')
export class DataController {
  constructor(private readonly dataService: DataService) {}

  @Post('')
  async createData(
    @Req() request: AuthRequest,
    @Body() body: DataDto,
  ): Promise<DataResponse> {
    return new DataResponse(await this.dataService.create(request.user, body));
  }

  @Get('')
  async findAllData(
    @Req() request: AuthRequest,
    @Query() query: FindAllQuery,
  ): Promise<DataResponse[]> {
    return DataResponse.fromArray(
      await this.dataService.findAllData(
        request.user,
        query.surveyId,
        query.employeeId,
      ),
    );
  }

  @Get(':dataId')
  async findOneData(
    @Req() request: AuthRequest,
    @Param() param: DataIdParam,
  ): Promise<SubmissionResponse> {
    return new SubmissionResponse(
      await this.dataService.findOneData(request.user, param.dataId),
    );
  }

  @Patch(':dataId')
  async updateData(
    @Req() request: AuthRequest,
    @Param() param: DataIdParam,
    @Body() body: UpdateDataDto,
  ): Promise<DataResponse> {
    return new DataResponse(
      await this.dataService.update(request.user, param.dataId, body),
    );
  }

  @Delete(':entryId')
  @Role(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteData(@Param() param: EntryIdParam): Promise<void> {
    return this.dataService.remove(param.entryId);
  }
}
