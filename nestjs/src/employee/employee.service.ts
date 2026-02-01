import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './employee.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { JwtPayload } from 'src/auth/jwt-payload.type';
import { RoleEnum } from 'src/users/role.enum';
import { UpdateResult } from 'typeorm/browser';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  public async create(dto: CreateEmployeeDto): Promise<Employee> {
    const employee = this.employeeRepository.create(dto);

    return this.employeeRepository.save(employee);
  }

  public async findAll(user: JwtPayload): Promise<Employee[]> {
    if (user.role === RoleEnum.ADMIN) {
      return this.employeeRepository.find();
    } else {
      return await this.employeeRepository.find({
        where: {
          user: { id: user.sub },
        },
      });
    }
  }

  public async findAllClientEmp(
    user: JwtPayload,
    clientId: string,
  ): Promise<Employee[]> {
    if (user.role !== RoleEnum.ADMIN)
      throw new ForbiddenException('forbidden resoure access');
    return await this.employeeRepository.find({
      where: {
        user: { id: clientId },
      },
    });
  }

  public async findOne(
    user: JwtPayload,
    employeeId: string,
  ): Promise<Employee> {
    if (!user?.role) throw new UnauthorizedException();

    const where =
      user.role === RoleEnum.ADMIN
        ? { id: employeeId }
        : {
            id: employeeId,
            user: { id: user.sub },
          };

    const employee = await this.employeeRepository.findOne({
      where,
    });

    if (!employee) throw new NotFoundException('Employee not found');

    return employee;
  }

  public async update(
    user: JwtPayload,
    employeeId: string,
    dto: UpdateEmployeeDto,
  ): Promise<Employee> {
    const employee = await this.findOne(user, employeeId);
    Object.assign(employee, dto);
    return this.employeeRepository.save(employee);
  }

  public async remove(user: JwtPayload, employeeId: string): Promise<void> {
    const employee = await this.findOne(user, employeeId);
    await this.update(user, employeeId, {
      ...employee,
      userId: null,
      position: null,
    });

    await this.employeeRepository.softDelete(employeeId);
  }

  public async assignJob(
    employeeId: string,
    userId: string,
  ): Promise<UpdateResult> {
    return await this.employeeRepository.update(employeeId, {
      userId,
    });
  }

  public async unAssignJob(employeeId: string): Promise<UpdateResult> {
    return await this.employeeRepository.update(employeeId, {
      userId: null,
    });
  }
}
