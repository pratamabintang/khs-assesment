import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { SurveyService } from './survey.service';

import { CreateSurveyDto } from '../dto/create-survey.dto';
import { UpdateSurveyDto } from '../dto/update-survey.dto';
import { Public } from '../decorator/public.decorator';
import { Role } from 'src/decorator/role.decorator';
import { RoleEnum } from 'src/users/role.enum';

@Controller('survey')
export class SurveyController {
  constructor(private readonly surveyService: SurveyService) {}

  @Post()
  @Role(RoleEnum.ADMIN)
  create(@Body() dto: CreateSurveyDto) {
    return this.surveyService.create(dto);
  }

  @Get()
  findAll() {
    return this.surveyService.findAll();
  }

  @Get(':id')
  @Public()
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.surveyService.findOne(id);
  }

  @Patch(':id')
  @Role(RoleEnum.ADMIN)
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateSurveyDto,
  ) {
    return this.surveyService.updateSurvey(id, dto);
  }

  @Delete(':id')
  @Role(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    await this.surveyService.deleteSurvey(id);
  }
}
