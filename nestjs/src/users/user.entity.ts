import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RoleEnum } from './role.enum';
import { Exclude, Expose } from 'class-transformer';
import { ForgetPassword } from '../auth/forget-password/forget-password.entity';
import { Employee } from '../employee/employee.entity';
import { SurveySubmissionEntry } from 'src/survey/survey-submission/survey-submission.entity';

@Entity()
@Exclude()
export class User {
  @Expose()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Expose()
  @Column()
  name: string;

  @Expose()
  @Column({ unique: true })
  email: string;

  @Expose()
  @Column({ unique: true })
  phoneNumber: string;

  @Exclude()
  @Column()
  password: string;

  @Exclude()
  @Column({ type: 'text', nullable: true })
  refreshToken: string | null;

  @Exclude()
  @Column()
  province: string;

  @Exclude()
  @Column()
  regency: string;

  @Exclude()
  @Column()
  district: string;

  @Exclude()
  @Column()
  village: string;

  @Exclude()
  @Column()
  fullAddress: string;

  @Exclude()
  @OneToMany(() => Employee, (employee) => employee.user)
  employees: Employee[];

  @Exclude()
  @OneToMany(
    () => SurveySubmissionEntry,
    (entry: SurveySubmissionEntry) => entry.user,
    {
      nullable: true,
      cascade: true,
      eager: false,
    },
  )
  entry?: SurveySubmissionEntry[];

  @Expose()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Expose()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Exclude()
  @Column({
    type: 'enum',
    enum: RoleEnum,
    default: RoleEnum.USER,
  })
  role: RoleEnum;

  @Exclude()
  @OneToOne(() => ForgetPassword, (fp) => fp.user, {
    cascade: true,
  })
  forgetPassword: ForgetPassword;

  @Exclude()
  @DeleteDateColumn()
  deletedAt: Date;
}
