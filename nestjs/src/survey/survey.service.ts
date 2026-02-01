import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
// import { DataSource, In, Repository } from 'typeorm';

import { Survey } from './survey.entity';
import { SurveyQuestion } from './survey-question.entity';
import { SurveyQuestionDetail } from './survey-question-detail.entity';
import { SurveyType } from './survey.type';

import {
  CreateSurveyDto,
  CreateSurveyQuestionDto,
  CreateSurveyQuestionDetailDto,
} from './dto/create-survey.dto';
// import {
//   UpdateSurveyDto,
//   UpdateSurveyQuestionDto,
//   UpdateSurveyQuestionDetailDto,
// } from './dto/update-survey.dto';

@Injectable()
export class SurveyService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Survey)
    private readonly surveyRepo: Repository<Survey>,
    @InjectRepository(SurveyQuestion)
    private readonly questionRepo: Repository<SurveyQuestion>,
    @InjectRepository(SurveyQuestionDetail)
    private readonly detailRepo: Repository<SurveyQuestionDetail>,
  ) {}

  public async create(dto: CreateSurveyDto): Promise<Survey | null> {
    const result = await this.dataSource.transaction(async (manager) => {
      const surveyRepository = manager.getRepository(Survey);
      const questionRepository = manager.getRepository(SurveyQuestion);
      const detailRepository = manager.getRepository(SurveyQuestionDetail);

      const survey = surveyRepository.create({
        title: dto.title,
        description: dto.description,
      });

      const savedSurvey = await surveyRepository.save(survey);

      const questionsInput: CreateSurveyQuestionDto[] | undefined =
        dto.questions;

      if (Array.isArray(questionsInput) && questionsInput.length) {
        for (const qdto of questionsInput) {
          const questionData: CreateSurveyQuestionDto = qdto;

          if (questionData.type === SurveyType.RANGE) {
            this.assertRange(questionData.min, questionData.max);
          }
          const q = questionRepository.create({
            title: questionData.title,
            description: questionData.description || '',
            type: questionData.type,
            min:
              questionData.type === SurveyType.RANGE
                ? questionData.min
                : undefined,
            max:
              questionData.type === SurveyType.RANGE
                ? questionData.max
                : undefined,
            required: questionData.required ?? true,
            survey: savedSurvey,
          });

          const savedQ = await questionRepository.save(q);

          const detailsInput: CreateSurveyQuestionDetailDto[] | undefined =
            questionData.details;
          if (Array.isArray(detailsInput) && detailsInput.length) {
            if (savedQ.type === SurveyType.TEXTAREA) {
              throw new BadRequestException(
                'Details are not allowed for TEXTAREA question',
              );
            }

            const details = detailsInput.map(
              (ddto: CreateSurveyQuestionDetailDto) =>
                detailRepository.create({
                  title: ddto.title,
                  explanation: ddto.explanation,
                  shortQuestion: ddto.shortQuestion,
                  point: ddto.point,
                  survey: savedQ,
                }),
            );

            await detailRepository.save(details);
          }
        }
      }

      return surveyRepository.findOne({
        where: { id: savedSurvey.id },
        relations: { questions: true },
      });
    });
    return result;
  }

  public async findAll(): Promise<Survey[]> {
    return this.surveyRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  public async findOne(surveyId: string): Promise<Survey> {
    const survey = await this.surveyRepo.findOne({
      withDeleted: true,
      where: { id: surveyId },
      relations: {
        questions: true,
      },
    });

    if (!survey) throw new NotFoundException('Survey not found');

    if (survey.questions && survey.questions.length) {
      for (let i = 0; i < survey.questions.length; i++) {
        const details = await this.detailRepo.find({
          where: { survey: { id: survey.questions[i].id } },
        });
        survey.questions[i].details = details;
      }
    }

    return survey;
  }

  // public async updateSurvey(
  //   surveyId: string,
  //   dto: UpdateSurveyDto,
  // ): Promise<Survey | null> {
  //   const result = await this.dataSource.transaction(async (manager) => {
  //     const surveyRepository = manager.getRepository(Survey);
  //     const questionRepository = manager.getRepository(SurveyQuestion);
  //     const detailRepository = manager.getRepository(SurveyQuestionDetail);

  //     const survey = await surveyRepository.findOne({
  //       where: { id: surveyId },
  //       relations: { questions: true },
  //     });
  //     if (!survey) throw new NotFoundException('Survey not found');

  //     if (dto.title !== undefined) survey.title = dto.title;
  //     if (dto.description !== undefined) survey.description = dto.description;

  //     await surveyRepository.save(survey);

  //     const questionsInput: UpdateSurveyQuestionDto[] | undefined =
  //       dto.question;
  //     const removeQuestionIds: string[] | undefined = dto.removeQuestionIds;

  //     if (removeQuestionIds?.length) {
  //       const ownedIds = new Set((survey.questions ?? []).map((q) => q.id));
  //       const invalid = removeQuestionIds.filter((qid) => !ownedIds.has(qid));
  //       if (invalid.length) {
  //         throw new BadRequestException(
  //           `Some questions are not part of this survey: ${invalid.join(', ')}`,
  //         );
  //       }

  //       await questionRepository.delete({ id: In(removeQuestionIds) });
  //       survey.questions = (survey.questions ?? []).filter(
  //         (q) => !removeQuestionIds.includes(q.id),
  //       );
  //     }

  //     if (Array.isArray(questionsInput) && questionsInput.length) {
  //       const existingById = new Map(
  //         (survey.questions ?? []).map((q) => [q.id, q]),
  //       );

  //       for (const qdto of questionsInput) {
  //         const questionData: UpdateSurveyQuestionDto = qdto;
  //         let questionEntity: SurveyQuestion;

  //         if (questionData.id) {
  //           const existing = existingById.get(questionData.id);
  //           if (!existing) {
  //             throw new BadRequestException(
  //               `Question ${questionData.id} not found in this survey`,
  //             );
  //           }

  //           if (questionData.title !== undefined)
  //             existing.title = questionData.title;
  //           if (questionData.description !== undefined)
  //             existing.description = questionData.description;
  //           if (questionData.type !== undefined)
  //             existing.type = questionData.type;
  //           if (questionData.required !== undefined)
  //             existing.required = questionData.required;

  //           if (existing.type === SurveyType.RANGE) {
  //             this.assertRange(questionData.min, questionData.max);
  //             if (existing.min !== undefined && questionData.min === undefined)
  //               throw new BadRequestException('Update range need min value');
  //             if (existing.max !== undefined && questionData.max === undefined)
  //               throw new BadRequestException('Update range need max value');
  //             existing.min = questionData.min;
  //             existing.max = questionData.max;
  //           } else {
  //             existing.min = null;
  //             existing.max = null;
  //           }

  //           if (questionData.type === SurveyType.TEXTAREA) {
  //             await detailRepository.delete({
  //               survey: { id: questionData.id },
  //             });
  //           }

  //           questionEntity = await questionRepository.save(existing);
  //         } else {
  //           const minVal =
  //             questionData.type === SurveyType.RANGE
  //               ? questionData.min
  //               : undefined;
  //           const maxVal =
  //             questionData.type === SurveyType.RANGE
  //               ? questionData.max
  //               : undefined;

  //           questionEntity = questionRepository.create({
  //             title: questionData.title,
  //             description: questionData.description || '',
  //             type: questionData.type,
  //             required: questionData.required ?? true,
  //             min: minVal,
  //             max: maxVal,
  //             survey,
  //           });

  //           questionEntity = await questionRepository.save(questionEntity);
  //           survey.questions = [...(survey.questions ?? []), questionEntity];
  //         }

  //         const detailsInput: UpdateSurveyQuestionDetailDto[] | undefined =
  //           questionData.details;
  //         const removeDetailIds: string[] | undefined =
  //           questionData.removeDetailIds;

  //         const existingDetails = await detailRepository.find({
  //           where: { survey: { id: questionEntity.id } },
  //         });

  //         if (removeDetailIds?.length) {
  //           const ownedIds = new Set(existingDetails.map((d) => d.id));
  //           const invalid = removeDetailIds.filter((did) => !ownedIds.has(did));
  //           if (invalid.length) {
  //             throw new BadRequestException(
  //               `Some details are not part of this question: ${invalid.join(', ')}`,
  //             );
  //           }

  //           await detailRepository.delete({ id: In(removeDetailIds) });
  //         }

  //         if (Array.isArray(detailsInput) && detailsInput.length) {
  //           if (questionEntity.type === SurveyType.TEXTAREA) {
  //             throw new BadRequestException(
  //               'Details are not allowed for TEXTAREA',
  //             );
  //           }

  //           const detailById = new Map(existingDetails.map((d) => [d.id, d]));

  //           for (const ddto of detailsInput) {
  //             const detailData: UpdateSurveyQuestionDetailDto = ddto;
  //             if (detailData.id) {
  //               const existingDetail = detailById.get(detailData.id);
  //               if (!existingDetail) {
  //                 throw new BadRequestException(
  //                   `Detail ${detailData.id} not found`,
  //                 );
  //               }

  //               if (detailData.title !== undefined)
  //                 existingDetail.title = detailData.title;
  //               if (detailData.explanation !== undefined)
  //                 existingDetail.explanation = detailData.explanation;
  //               if (detailData.shortQuestion !== undefined)
  //                 existingDetail.shortQuestion = detailData.shortQuestion;
  //               if (detailData.point !== undefined)
  //                 existingDetail.point = detailData.point;

  //               await detailRepository.save(existingDetail);
  //             } else {
  //               if (
  //                 !detailData.title ||
  //                 !detailData.explanation ||
  //                 !detailData.point
  //               ) {
  //                 throw new BadRequestException(
  //                   'New detail requires title, explanation, and point',
  //                 );
  //               }

  //               const newDetail = detailRepository.create({
  //                 title: detailData.title,
  //                 explanation: detailData.explanation,
  //                 shortQuestion: detailData.shortQuestion,
  //                 point: detailData.point,
  //                 survey: questionEntity,
  //               });

  //               await detailRepository.save(newDetail);
  //             }
  //           }
  //         }
  //       }
  //     }

  //     return surveyRepository.findOne({
  //       where: { id: survey.id },
  //       relations: { questions: true },
  //     });
  //   });
  //   return result;
  // }

  public async deleteSurvey(id: string): Promise<void> {
    await this.surveyRepo.softDelete(id);
  }

  private assertRange(min?: number, max?: number): void {
    if (min === undefined || max === undefined) {
      throw new BadRequestException('min and max are required for RANGE');
    }
    if (min >= max) {
      throw new BadRequestException('min must be less than max');
    }
  }
}
