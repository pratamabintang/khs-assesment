import { Exclude } from 'class-transformer';
import { User } from '../../users/user.entity';
import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';

@Entity()
@Exclude()
export class ForgetPassword {
  @PrimaryColumn('uuid')
  userId: string;

  @Column({ unique: true })
  tokenHash: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @OneToOne(() => User, (user) => user.forgetPassword, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: User;
}
