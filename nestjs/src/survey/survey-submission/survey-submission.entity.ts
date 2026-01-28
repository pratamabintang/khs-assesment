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

@Entity('survey_submissions')
@Index(['employeeId', 'surveyId', 'periodMonth'], { unique: true })
export class SurveySubmissionEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  employeeId: string;

  @ManyToOne(() => Employee, (employee) => employee.entry, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Column({ type: 'uuid' })
  surveyId: string;

  @ManyToOne(() => Survey, (survey) => survey.entry, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'surveyId' })
  survey: Survey;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.entry, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'date' })
  periodMonth: string;

  @Column({ type: 'text', nullable: true })
  nosql?: string | null; // id di mongodb jadi jawaban akan disimpan disini karena pertanyaan sifatnya dinamis

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
