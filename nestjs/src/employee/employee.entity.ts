import { SurveySubmissionEntry } from 'src/survey/survey-submission/survey-submission.entity';
import { User } from '../users/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  DeleteDateColumn,
  JoinColumn,
} from 'typeorm';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
@Entity('employees')
export class Employee {
  @Expose()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Expose()
  @Column()
  fullName: string;

  @Expose()
  @Column({ type: 'varchar', nullable: true })
  position?: string | null;

  @Expose()
  @Column({ default: true })
  isActive: boolean;

  @Expose()
  @Column({
    nullable: true,
  })
  userId?: string | null;

  @Exclude()
  @ManyToOne(() => User, (user) => user.employees, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'userId' })
  user?: User | null;

  @Exclude()
  @OneToMany(
    () => SurveySubmissionEntry,
    (entry: SurveySubmissionEntry) => entry.employee,
    {
      nullable: true,
      cascade: true,
      eager: false,
    },
  )
  entry?: SurveySubmissionEntry[];

  @Exclude()
  @CreateDateColumn()
  createdAt: Date;

  @Exclude()
  @UpdateDateColumn()
  updatedAt: Date;

  @Exclude()
  @DeleteDateColumn()
  deletedAt: Date;
}
