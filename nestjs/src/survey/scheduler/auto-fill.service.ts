import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { SurveySubmissionEntry } from '../survey-submission/survey-submission.entity';
import { IsNull, Repository } from 'typeorm';
import { SurveyQuestion } from '../survey-question.entity';
import { SurveyType } from '../survey.type';
import { SurveyQuestionDetail } from '../survey-question-detail.entity';
import { SurveySubmission } from '../schema/survey-submission.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SurveyAnswer } from '../schema/survey-answer.schema';

@Injectable()
export class AutoFillSubmission {
  constructor(
    @InjectRepository(SurveySubmissionEntry)
    private readonly entryRepo: Repository<SurveySubmissionEntry>,
    @InjectModel(SurveySubmission.name)
    private readonly submissionModel: Model<SurveySubmission>,
  ) {}

  @Cron('10 0 1 * *', { timeZone: 'Asia/Jakarta' })
  async handleAutoFill(): Promise<void> {
    try {
      const previousMonth = this.previousMonth().toISOString().slice(0, 10);

      const emptyEntries = await this.getAllEmptyPreviousMonth(previousMonth);

      for (const entry of emptyEntries) {
        const survey = entry.survey;
        const questions: SurveyQuestion[] = survey?.questions ?? [];

        if (!survey || questions.length === 0) {
          continue;
        }

        const answers: SurveySubmission = {
          surveyId: entry.surveyId,
          employeeId: entry.employeeId,
          answers: [],
          totalPoint: 0,
        };

        let total = 0;

        for (const question of questions) {
          const item: SurveyAnswer = {
            questionId: question.id,
            type: question.type,
            value: null,
          };

          if (question.type === SurveyType.TEXTAREA) {
            item.value = 'AUTO-FILLED';
            answers.answers.push(item);
            continue;
          }

          if (question.type === SurveyType.RANGE) {
            const maximum: number = question.max ?? 0;
            item.value = maximum;
            total += maximum;
            answers.answers.push(item);
            continue;
          }

          const options: SurveyQuestionDetail[] = question.details ?? [];

          let valueMax: number = 0;
          for (const opt of options) {
            if (+opt.point > valueMax) valueMax = +opt.point;
          }
          item.value = valueMax;
          total += valueMax;
          answers.answers.push(item);
        }

        answers.totalPoint = total;

        const doc = await this.submissionModel.create(answers);

        entry.nosql = doc.id;
        await this.entryRepo.save(entry);
      }
    } catch (err) {
      console.log(err);
    }
  }

  private async getAllEmptyPreviousMonth(
    previousMonth: string,
  ): Promise<SurveySubmissionEntry[]> {
    return await this.entryRepo.find({
      where: {
        periodMonth: previousMonth,
        nosql: IsNull(),
      },
      relations: {
        survey: {
          questions: {
            details: true,
          },
        },
      },
    });
  }

  private previousMonth(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  }
}
