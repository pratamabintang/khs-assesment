import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { SurveyQuestion } from './survey-question.entity';

@Entity('options')
export class SurveyQuestionDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  title: string;

  @Column({ type: 'varchar', length: 300 })
  explanation: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  shortQuestion?: string;

  @Column({ type: 'varchar', length: 7 })
  point: string;

  @ManyToOne(() => SurveyQuestion, (survey) => survey.details, {
    onDelete: 'CASCADE',
  })
  survey: SurveyQuestion;
}
