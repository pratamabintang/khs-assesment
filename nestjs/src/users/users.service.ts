import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Not, Repository } from 'typeorm';
import { PasswordService } from './password/password.service';
import { CreateUserDto } from './dto/create-user.dto';
import { RoleEnum } from './role.enum';
import { EmployeesService } from 'src/employee/employee.service';
import { JwtPayload } from 'src/auth/jwt-payload.type';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly passwordService: PasswordService,
    private readonly employeeService: EmployeesService,
  ) {}

  public async createUser(createUserDto: CreateUserDto): Promise<User> {
    const hashed_password = await this.passwordService.hash(
      createUserDto.password,
    );

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashed_password,
    });

    return await this.userRepository.save(user);
  }

  public async saveUser(user: User): Promise<User> {
    return await this.userRepository.save(user);
  }

  public async findAll(): Promise<User[] | null> {
    return await this.userRepository.find({
      where: {
        role: Not(RoleEnum.ADMIN),
      },
    });
  }

  public async findOne(id: string): Promise<User | null> {
    return await this.userRepository.findOneBy({ id });
  }

  public async findOneByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOneBy({ email });
  }

  public async findOneByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return await this.userRepository.findOneBy({ phoneNumber });
  }

  public async updatePassword(newPassword: string, user: User): Promise<void> {
    user.password = newPassword;
    await this.userRepository.save(user);
  }

  public async setRefreshTokenHash(
    id: string,
    refreshToken: string,
  ): Promise<void> {
    const user = await this.findOne(id);
    const hash = await this.passwordService.hash(refreshToken);

    if (!user) return;

    user.refreshToken = hash;
    await this.userRepository.save(user);
  }

  public async getRefreshTokenHash(id: string): Promise<string | null> {
    const user = await this.findOne(id);

    if (!user) return null;

    return user.refreshToken;
  }

  public async removeRefreshTokenHash(id: string): Promise<void> {
    const user = await this.findOne(id);

    if (!user) return;
    user.refreshToken = null;
    await this.userRepository.save(user);
  }

  public async removeUser(user: JwtPayload, id: string): Promise<void> {
    const deleteUser = await this.userRepository.findOne({
      where: { id },
      relations: {
        employees: true,
      },
    });

    if (!user) throw new NotFoundException('user not found');

    const employees = deleteUser?.employees ?? [];
    for (const employee of employees) {
      await this.employeeService.update(user, employee.id, {
        ...employee,
        userId: null,
      });
    }

    await this.userRepository.softDelete(id);
  }
}
