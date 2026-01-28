import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { SurveyQuestion } from './survey-question.entity';

@Entity()
export class SurveyQuestionDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  explanation: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  shortQuestion?: string;

  @Column({ type: 'varchar', length: 100 })
  point: string;

  @ManyToOne(() => SurveyQuestion, (survey) => survey.details, {
    onDelete: 'CASCADE',
  })
  survey: SurveyQuestion;
}
