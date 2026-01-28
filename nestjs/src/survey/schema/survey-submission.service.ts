import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SurveySubmission } from './survey-submission.schema';
import { SurveyType } from '../../survey/survey.type';
import { SurveySubmissionDto } from '../dto/survey-submission.dto';
import { SurveyService } from '../survey.service';
import { Survey } from '../survey.entity';
import { SurveyQuestion } from '../survey-question.entity';
import { Employee } from '../../employee/employee.entity';
import { EmployeesService } from '../../employee/employee.service';
import { UsersService } from '../../users/users.service';
import { SurveyAnswer } from './survey-answer.schema';
import { RoleEnum } from '../../users/role.enum';
import { JwtPayload } from '../../auth/jwt-payload.type';
import { UpdateSurveySubmissionDto } from '../dto/update-survey-submission.dto';
import { SurveySubmissionEntryService } from '../survey-submission/survey-submission-entry.service';

@Injectable()
export class SurveySubmissionService {
  constructor(
    @InjectModel(SurveySubmission.name)
    private readonly submissionModel: Model<SurveySubmission>,
    private readonly surveyService: SurveyService,
    private readonly employeesService: EmployeesService,
    private readonly usersService: UsersService,
    private readonly surveySubmissionEntryService: SurveySubmissionEntryService,
  ) {}

  public async create(
    user: JwtPayload,
    data: SurveySubmissionDto,
  ): Promise<SurveySubmission> {
    const survey: Survey = await this.surveyService.findOne(data.surveyId);
    if (!survey) throw new NotFoundException('Survey Not Found');

    if (!(await this.usersService.findOne(user.sub)))
      throw new NotFoundException('User Not Found');

    const employee: Employee = await this.employeesService.findOne(
      user,
      data.employeeId,
    );
    if (!employee) throw new NotFoundException('Employee Not Found');

    const questions: SurveyQuestion[] = survey.questions ?? [];

    const requiredQuestions = questions.filter((q) => q.required === true);

    const answerByQuestionId = new Map<string, number | string | null>();
    for (const ans of data.answers ?? []) {
      answerByQuestionId.set(ans.questionId, ans.value);
    }

    const missing = requiredQuestions
      .filter((q) => {
        const v = answerByQuestionId.get(q.id);
        return !this.isFilled(v);
      })
      .map((q) => ({
        questionId: q.id,
        label: q.title ?? undefined,
      }));

    if (missing.length > 0) {
      throw new BadRequestException({
        message: 'Ada pertanyaan wajib yang belum diisi',
        missing,
      });
    }

    const doc = await this.submissionModel.create({
      ...data,
      totalPoint: this.sum(data.answers),
    });

    await this.surveySubmissionEntryService.updateAnswerById(user, {
      entryId: data.entryId,
      noSql: doc.id,
    });

    return doc.toObject();
  }

  public async findAllSubmission(
    user: JwtPayload,
    surveyId?: string,
    employeeId?: string,
  ): Promise<SurveySubmission[]> {
    const filter: Record<string, any> = {};
    if (surveyId) filter.surveyId = surveyId;

    if (user.role === RoleEnum.ADMIN) {
      if (employeeId) filter.employeeId = employeeId;
      const docs = this.submissionModel.find(filter).exec();

      return (await docs).map((d) => d.toObject());
    }

    const employees = await this.employeesService.findAll(user);

    if (!employees || employees.length === 0) {
      throw new NotFoundException('User tidak terhubung ke pegawai');
    }

    const allowedEmployeeIds = employees.map((e) => String(e.id));
    if (employeeId) {
      if (!allowedEmployeeIds.includes(String(employeeId))) {
        throw new NotFoundException(
          'Tidak boleh mengakses data perusahaan lain',
        );
      }
      filter.employeeId = String(employeeId);
    } else {
      filter.employeeId = { $in: allowedEmployeeIds };
    }

    const docs = await this.submissionModel.find(filter).exec();
    return docs.map((d) => d.toObject());
  }

  public async findOneSubmission(
    user: JwtPayload,
    submissionId: string,
  ): Promise<{ survey: Survey; submission: SurveySubmission }> {
    const doc = await this.submissionModel.findById(submissionId);
    if (!doc) throw new NotFoundException('SurveySubmission Not Found');

    const survey: Survey = await this.surveyService.findOne(doc.surveyId);

    if (user.role === RoleEnum.USER)
      await this.employeesService.findOne(user, doc.employeeId);

    return { survey, submission: doc.toObject() };
  }

  async update(
    user: JwtPayload,
    submissionId: string,
    dto: UpdateSurveySubmissionDto,
  ): Promise<SurveySubmission> {
    const doc = await this.submissionModel.findById(submissionId);
    if (!doc) throw new NotFoundException('SurveySubmission Not Found');

    if (user.role === RoleEnum.USER)
      await this.employeesService.findOne(user, doc.employeeId);

    let totalPointUpdate: number | undefined = undefined;
    if (dto.answers) totalPointUpdate = this.sum(dto.answers);

    const updated = await this.submissionModel.findByIdAndUpdate(
      submissionId,
      {
        ...dto,
        ...(totalPointUpdate !== undefined
          ? { totalPoint: totalPointUpdate }
          : {}),
      },
      { new: true },
    );

    if (!updated) throw new NotFoundException('SurveySubmission Not Found');
    return updated.toObject();
  }

  async remove(entryId: string): Promise<void> {
    const entry = await this.surveySubmissionEntryService.findOne(entryId);
    if (!entry) throw new NotFoundException('submision entry not found');
    const noSqlId: string = entry.nosql ?? '';
    await this.surveySubmissionEntryService.hardDelete(entry.id);

    if (noSqlId !== '') {
      const res = await this.submissionModel.findByIdAndDelete(noSqlId);
      if (!res) throw new NotFoundException('SurveySubmission Not Found');
    }
  }

  private sum(data: SurveyAnswer[]): number {
    let totalPoint: number = 0;
    for (const i of data ?? []) {
      if (i.type === SurveyType.TEXTAREA) continue;
      if (typeof i.value === 'number') totalPoint += i.value;
    }
    return totalPoint;
  }

  private isFilled(value: number | string | null | undefined): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    return true;
  }
}
