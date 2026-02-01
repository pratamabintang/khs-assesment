import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Not, Repository } from 'typeorm';
import { PasswordService } from './password/password.service';
import { CreateUserDto } from './dto/create-user.dto';
import { RoleEnum } from './role.enum';
import { EmployeesService } from 'src/employee/employee.service';
import { JwtPayload } from 'src/auth/jwt-payload.type';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly passwordService: PasswordService,
    private readonly employeeService: EmployeesService,
  ) {}

  public async createUser(createUserDto: CreateUserDto): Promise<User> {
    const emailCheck = await this.findOneByEmail(createUserDto.email);

    if (emailCheck) {
      throw new ConflictException('email already exists');
    }

    const phoneNumberCheck = await this.findOneByPhoneNumber(
      createUserDto.phoneNumber,
    );

    if (phoneNumberCheck) {
      throw new ConflictException('phone number already exists');
    }

    const hashed_password = await this.passwordService.hash(
      createUserDto.password,
    );

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashed_password,
    });

    return await this.userRepository.save(user);
  }

  async updateUser(userId: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(userId);
    if (!user) throw new NotFoundException('User not found');

    const forbiddenKeys = [
      'email',
      'password',
      'refreshToken',
      'role',
      'employees',
      'entry',
      'forgetPassword',
    ];
    for (const k of forbiddenKeys) {
      if (dto[k] !== undefined) {
        throw new BadRequestException(`Field "${k}" is not allowed`);
      }
    }

    if (dto.phoneNumber && dto.phoneNumber !== user.phoneNumber) {
      const exists = await this.findOneByPhoneNumber(dto.phoneNumber);
      if (exists) throw new BadRequestException('Phone number already in use');
    }

    Object.assign(user, dto);

    return await this.saveUser(user);
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
