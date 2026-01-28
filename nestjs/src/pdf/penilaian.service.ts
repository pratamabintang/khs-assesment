import { Injectable } from '@nestjs/common';
import { JwtPayload } from 'src/auth/jwt-payload.type';
import { EmployeesService } from 'src/employee/employee.service';
import { SurveySubmissionService } from 'src/survey/schema/survey-submission.service';
import { SurveyType } from 'src/survey/survey.type';
import { UsersService } from 'src/users/users.service';
import { BulkDownloadDto } from './dto/bulk-download.dto';

type SubmissionQuestionTextarea = {
  questionId: string;
  questionTitle: string;
  questionType: SurveyType.TEXTAREA;
  answer: string | null;
  renderAs: 'TEXTAREA';
  textareaRows: number;
};

type SubmissionQuestionScoreDetail = {
  explanation: string;
  point: number | string;
};

type SubmissionQuestionScore = {
  no: number;
  questionId: string;
  questionTitle: string;
  questionType: Exclude<SurveyType, SurveyType.TEXTAREA>;
  answer: number | null;
  renderAs: 'SCORE';
  details: SubmissionQuestionScoreDetail[];
};

type SubmissionQuestion = SubmissionQuestionTextarea | SubmissionQuestionScore;

export type SubmissionData = {
  nama: string;
  posisi: string;
  perusahaan: string | undefined;
  totalPoin: number;
  questions: SubmissionQuestion[];
};

type AnswerValue = string | number | null;

@Injectable()
export class PenilaianService {
  constructor(
    private readonly surveySubmissionService: SurveySubmissionService,
    private readonly employeeService: EmployeesService,
    private readonly usersService: UsersService,
  ) {}

  async getData(
    user: JwtPayload,
    submissionId: string,
  ): Promise<SubmissionData> {
    const { survey, submission } =
      await this.surveySubmissionService.findOneSubmission(user, submissionId);

    const answerMap = new Map<string, AnswerValue>(
      (submission.answers ?? []).map((a) => [
        a.questionId,
        a.value as AnswerValue,
      ]),
    );

    let idxCounter = 0;

    const questions: SubmissionQuestion[] = (survey.questions ?? []).map(
      (q) => {
        const rawAnswer = answerMap.get(q.id) ?? null;

        if (q.type === SurveyType.TEXTAREA) {
          const answer: string | null =
            rawAnswer == null
              ? null
              : typeof rawAnswer === 'string'
                ? rawAnswer
                : String(rawAnswer);

          return {
            questionId: q.id,
            questionTitle: q.title,
            questionType: SurveyType.TEXTAREA,
            answer,
            renderAs: 'TEXTAREA',
            textareaRows: 4,
          };
        }

        idxCounter += 1;

        const answer: number | null =
          rawAnswer == null
            ? null
            : typeof rawAnswer === 'number'
              ? rawAnswer
              : Number.isFinite(Number(rawAnswer))
                ? Number(rawAnswer)
                : null;

        const details: SubmissionQuestionScoreDetail[] = (q.details ?? []).map(
          (d) => {
            return {
              explanation: d.explanation,
              point: d.point,
            };
          },
        );

        return {
          no: idxCounter,
          questionId: q.id,
          questionTitle: q.title,
          questionType: q.type,
          answer,
          renderAs: 'SCORE',
          details,
        };
      },
    );

    const employee = await this.employeeService.findOne(
      user,
      submission.employeeId,
    );

    const companyUser = await this.usersService.findOne(employee.userId ?? '');

    return {
      nama: employee.fullName,
      posisi: employee.position ?? '-',
      perusahaan: companyUser?.name,
      totalPoin: submission.totalPoint,
      questions,
    };
  }

  async getBulkData(
    user: JwtPayload,
    dto: BulkDownloadDto,
  ): Promise<SubmissionData[]> {
    return Promise.all(dto.submissionIds.map((id) => this.getData(user, id)));
  }
}
