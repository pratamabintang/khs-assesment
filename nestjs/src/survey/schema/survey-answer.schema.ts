import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { SurveyType } from '../../survey/survey.type';

@Schema({ _id: false })
export class SurveyAnswer {
  @Prop({ required: true, type: String })
  questionId: string;

  @Prop({ required: true, type: String, enum: Object.values(SurveyType) })
  type: SurveyType;

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  value: string | number | null;
}

export const SurveyAnswerSchema = SchemaFactory.createForClass(SurveyAnswer);
