import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { DataAnswer, DataAnswerSchema } from './data-answer.schema';

export type DataDocument = HydratedDocument<Data>;

@Schema({
  timestamps: true,
  collection: 'survey_submissions',
})
export class Data {
  @Prop({ required: true, index: true })
  surveyId!: string;

  @Prop({ required: true, index: true })
  employeeId!: string;

  @Prop({ type: [DataAnswerSchema], required: true, default: [] })
  answers!: DataAnswer[];

  @Prop({ default: 0 })
  totalPoint!: number;
}

export const DataSchema = SchemaFactory.createForClass(Data);

DataSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret: Data & { _id: Types.ObjectId; __v?: number }) => {
    const { _id, ...rest } = ret;
    return { ...rest, id: _id.toString() };
  },
});

DataSchema.index({ employeeId: 'hashed' });
