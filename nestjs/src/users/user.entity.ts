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
import { Employee } from '../employee/employee.entity';
import { Entry } from 'src/survey/entry/entry.entity';
import { ForgetPassword } from './forget-password/forget-password.entity';

@Entity()
@Exclude()
export class User {
  @Expose()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Expose()
  @Column({ type: 'varchar', length: 64 })
  name: string;

  @Expose()
  @Column({ type: 'varchar', length: 254, unique: true })
  email: string;

  @Expose()
  @Column({ type: 'varchar', length: 16, unique: true })
  phoneNumber: string;

  @Exclude()
  @Column({ type: 'char', length: 60 })
  password: string;

  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  refreshToken: string | null;

  @Exclude()
  @Column({ type: 'varchar', length: 64 })
  province: string;

  @Exclude()
  @Column({ type: 'varchar', length: 64 })
  regency: string;

  @Exclude()
  @Column({ type: 'varchar', length: 64 })
  district: string;

  @Exclude()
  @Column({ type: 'varchar', length: 64 })
  village: string;

  @Exclude()
  @Column({ type: 'varchar', length: 64 })
  fullAddress: string;

  @Exclude()
  @OneToMany(() => Employee, (employee) => employee.user)
  employees: Employee[];

  @Exclude()
  @OneToMany(() => Entry, (entry: Entry) => entry.user, {
    nullable: true,
    cascade: true,
    eager: false,
  })
  entry?: Entry[];

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
