import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { SurveyType } from '../survey.type';

@Schema({ _id: false })
export class DataAnswer {
  @Prop({ required: true, type: String })
  questionId: string;

  @Prop({ required: true, type: String, enum: Object.values(SurveyType) })
  type: SurveyType;

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  value: string | number | null;
}

export const DataAnswerSchema = SchemaFactory.createForClass(DataAnswer);
