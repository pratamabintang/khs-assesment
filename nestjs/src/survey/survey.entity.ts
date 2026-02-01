import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { SurveyQuestion } from './survey-question.entity';
import { Exclude, Expose } from 'class-transformer';
import { Entry } from './entry/entry.entity';

@Exclude()
@Entity()
export class Survey {
  @Expose()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Expose()
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Expose()
  @Column({ type: 'text', nullable: true })
  description?: string;

  @Expose()
  @OneToMany(
    () => SurveyQuestion,
    (question: SurveyQuestion) => question.survey,
    {
      cascade: true,
      eager: false,
    },
  )
  questions?: SurveyQuestion[];

  @Exclude()
  @OneToMany(() => Entry, (entry: Entry) => entry.survey, {
    nullable: true,
    cascade: true,
    eager: false,
  })
  entry?: Entry[];

  @Expose()
  @CreateDateColumn()
  createdAt: Date;

  @Expose()
  @UpdateDateColumn()
  updatedAt: Date;

  @Exclude()
  @DeleteDateColumn()
  deletedAt: Date;
}
