import { Employee } from 'src/employee/employee.entity';
import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
  PrimaryColumn,
} from 'typeorm';
import { Survey } from '../survey.entity';
import { User } from 'src/users/user.entity';
import { Exclude, Expose } from 'class-transformer';

@Entity('entry')
export class Entry {
  @Expose()
  @PrimaryColumn({ type: 'uuid' })
  employeeId: string;

  @Exclude()
  @ManyToOne(() => Employee, (employee) => employee.entry, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Expose()
  @PrimaryColumn({ type: 'uuid' })
  surveyId: string;

  @Exclude()
  @ManyToOne(() => Survey, (survey) => survey.entry, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'surveyId' })
  survey: Survey;

  @Expose()
  @PrimaryColumn({ type: 'uuid' })
  userId: string;

  @Exclude()
  @ManyToOne(() => User, (user) => user.entry, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Expose()
  @PrimaryColumn({ type: 'date' })
  periodMonth: string;

  @Expose()
  @Column({ type: 'varchar', nullable: true })
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
