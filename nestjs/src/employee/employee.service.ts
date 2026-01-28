import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './employee.entity';
import { CreateEmployeeDto } from '../dto/create-employee.dto';
import { UpdateEmployeeDto } from '../dto/update-employee.dto';
import { JwtPayload } from 'src/auth/jwt-payload.type';
import { RoleEnum } from 'src/users/role.enum';
import { UpdateResult } from 'typeorm/browser';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  async create(dto: CreateEmployeeDto): Promise<Employee> {
    const employee = this.employeeRepository.create(dto);

    return this.employeeRepository.save(employee);
  }

  async findAll(user: JwtPayload): Promise<Employee[]> {
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

  async findAllClientEmp(
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

  async findOne(user: JwtPayload, id: string): Promise<Employee> {
    if (!user?.role) {
      throw new UnauthorizedException();
    }

    const where =
      user.role === RoleEnum.ADMIN
        ? { id }
        : {
            id,
            user: { id: user.sub },
          };

    const employee = await this.employeeRepository.findOne({
      where,
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }

  async update(
    user: JwtPayload,
    id: string,
    dto: UpdateEmployeeDto,
  ): Promise<Employee> {
    const employee = await this.findOne(user, id);
    Object.assign(employee, dto);
    return this.employeeRepository.save(employee);
  }

  async remove(user: JwtPayload, id: string): Promise<void> {
    const employee = await this.findOne(user, id);
    await this.update(user, id, {
      ...employee,
      userId: null,
      position: null,
    });

    await this.employeeRepository.softDelete(id);
  }

  async setActive(
    user: JwtPayload,
    id: string,
    isActive: boolean,
  ): Promise<Employee> {
    const employee = await this.findOne(user, id);
    employee.isActive = !isActive;
    return this.employeeRepository.save(employee);
  }

  async assignJob(employeeId: string, userId: string): Promise<UpdateResult> {
    return await this.employeeRepository.update(employeeId, {
      userId,
    });
  }

  async unAssignJob(employeeId: string): Promise<UpdateResult> {
    return await this.employeeRepository.update(employeeId, {
      userId: null,
    });
  }
}
