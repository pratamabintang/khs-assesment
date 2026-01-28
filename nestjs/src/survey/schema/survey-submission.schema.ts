import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { SurveyAnswer, SurveyAnswerSchema } from './survey-answer.schema';

export type SurveySubmissionDocument = HydratedDocument<SurveySubmission>;

@Schema({
  timestamps: true,
  collection: 'survey_submissions',
})
export class SurveySubmission {
  @Prop({ required: true, index: true })
  surveyId!: string;

  @Prop({ required: true, index: true })
  employeeId!: string;

  @Prop({ type: [SurveyAnswerSchema], required: true, default: [] })
  answers!: SurveyAnswer[];

  @Prop({ default: 0 })
  totalPoint!: number;
}

export const SurveySubmissionSchema =
  SchemaFactory.createForClass(SurveySubmission);

SurveySubmissionSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: (
    _doc,
    ret: SurveySubmission & { _id: Types.ObjectId; __v?: number },
  ) => {
    const { _id, ...rest } = ret;
    return { ...rest, id: _id.toString() };
  },
});

SurveySubmissionSchema.index({ employeeId: 'hashed' });
