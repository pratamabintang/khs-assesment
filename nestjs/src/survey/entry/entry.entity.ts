import { Employee } from 'src/employee/employee.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Survey } from '../survey.entity';
import { User } from 'src/users/user.entity';
import { Exclude, Expose } from 'class-transformer';

@Entity('survey_submissions')
@Index(['employeeId', 'surveyId', 'periodMonth', 'userId'], { unique: true })
export class Entry {
  @Expose()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Expose()
  @Column({ type: 'uuid' })
  employeeId: string;

  @Exclude()
  @ManyToOne(() => Employee, (employee) => employee.entry, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Expose()
  @Column({ type: 'uuid' })
  surveyId: string;

  @Exclude()
  @ManyToOne(() => Survey, (survey) => survey.entry, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'surveyId' })
  survey: Survey;

  @Expose()
  @Column({ type: 'uuid' })
  userId: string;

  @Exclude()
  @ManyToOne(() => User, (user) => user.entry, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Expose()
  @Column({ type: 'date' })
  periodMonth: string;

  @Expose()
  @Column({ type: 'text', nullable: true })
  nosql?: string | null;

  @BeforeInsert()
  @BeforeUpdate()
  normalizePeriodMonth() {
    if (!this.periodMonth) return;

    const d = new Date(this.periodMonth);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    const normalized = new Date(Date.UTC(year, month, 1));

    this.periodMonth = normalized.toISOString().slice(0, 10);
  }
}
