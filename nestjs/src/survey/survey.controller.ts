import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  // Patch,
  Post,
} from '@nestjs/common';
import { SurveyService } from './survey.service';

import { CreateSurveyDto } from './dto/create-survey.dto';
// import { UpdateSurveyDto } from './dto/update-survey.dto';
import { Public } from '../decorator/public.decorator';
import { Role } from 'src/decorator/role.decorator';
import { RoleEnum } from 'src/users/role.enum';
import { SurveyIdParam } from './param/survey-id.param';
import { SurveyResponse } from './response/survey.response';

@Controller('survey')
export class SurveyController {
  constructor(private readonly surveyService: SurveyService) {}

  @Post()
  @Role(RoleEnum.ADMIN)
  async create(@Body() body: CreateSurveyDto): Promise<SurveyResponse | null> {
    return new SurveyResponse(
      (await this.surveyService.create(body)) ?? undefined,
    );
  }

  @Get()
  async findAll(): Promise<SurveyResponse[]> {
    return SurveyResponse.fromArray(await this.surveyService.findAll());
  }

  @Get(':surveyId')
  @Public()
  async findOne(@Param() param: SurveyIdParam): Promise<SurveyResponse> {
    return new SurveyResponse(await this.surveyService.findOne(param.surveyId));
  }

  // @Patch(':surveyId')
  // @Role(RoleEnum.ADMIN)
  // async update(
  //   @Param() param: SurveyIdParam,
  //   @Body() body: UpdateSurveyDto,
  // ): Promise<SurveyResponse | null> {
  //   const survey = await this.surveyService.updateSurvey(param.surveyId, body);
  //   if (survey) return new SurveyResponse(survey);

  //   return null;
  // }

  @Delete(':surveyId')
  @Role(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param() param: SurveyIdParam): Promise<void> {
    await this.surveyService.deleteSurvey(param.surveyId);
  }
}
