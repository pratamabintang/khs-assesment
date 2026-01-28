import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { SurveyType } from './survey.type';
import { SurveyQuestionDetail } from './survey-question-detail.entity';
import { Survey } from './survey.entity';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
@Entity()
export class SurveyQuestion {
  @Expose()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Expose()
  @Column({ type: 'boolean' })
  required: boolean;

  @Expose()
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Expose()
  @Column({ type: 'text' })
  description: string;

  @Expose()
  @Column({
    type: 'enum',
    enum: SurveyType,
  })
  type: SurveyType;

  @Expose()
  @Column({ type: 'int', nullable: true })
  min?: number | null;

  @Expose()
  @Column({ type: 'int', nullable: true })
  max?: number | null;

  @Expose()
  @ManyToOne(() => Survey, (survey) => survey.questions, {
    onDelete: 'CASCADE',
  })
  survey: Survey;

  @Expose()
  @OneToMany(() => SurveyQuestionDetail, (question) => question.survey, {
    cascade: true, // insert/update otomatis
    eager: false,
  })
  details?: SurveyQuestionDetail[];

  @Exclude()
  @CreateDateColumn()
  createdAt: Date;

  @Exclude()
  @UpdateDateColumn()
  updatedAt: Date;
}
