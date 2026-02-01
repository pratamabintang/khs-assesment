import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { EmployeesService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import type { AuthRequest } from '../request/auth.request';
import { RoleEnum } from '../users/role.enum';
import { Role } from '../decorator/role.decorator';
import { EmployeeResponse } from './response/employee.response';
import { EmployeeIdParam } from './param/employee-id.param';
import { AssignJobDto } from './dto/assign-job.dto';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post('')
  @Role(RoleEnum.ADMIN)
  async create(@Body() body: CreateEmployeeDto): Promise<EmployeeResponse> {
    return new EmployeeResponse(await this.employeesService.create(body));
  }

  @Get('')
  async findAll(@Req() req: AuthRequest): Promise<EmployeeResponse[]> {
    return EmployeeResponse.fromArray(
      await this.employeesService.findAll(req.user),
    );
  }

  @Get(':employeeId')
  async findOne(
    @Req() req: AuthRequest,
    @Param() param: EmployeeIdParam,
  ): Promise<EmployeeResponse> {
    return new EmployeeResponse(
      await this.employeesService.findOne(req.user, param.employeeId),
    );
  }

  @Patch(':employeeId')
  @Role(RoleEnum.ADMIN)
  async update(
    @Req() req: AuthRequest,
    @Param() param: EmployeeIdParam,
    @Body() dto: UpdateEmployeeDto,
  ): Promise<EmployeeResponse> {
    return new EmployeeResponse(
      await this.employeesService.update(req.user, param.employeeId, dto),
    );
  }

  @Delete(':employeeId')
  @Role(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Req() req: AuthRequest,
    @Param() param: EmployeeIdParam,
  ): Promise<void> {
    return this.employeesService.remove(req.user, param.employeeId);
  }

  @Patch('assign/:employeeId')
  @Role(RoleEnum.ADMIN)
  async assignJob(
    @Param() param: EmployeeIdParam,
    @Body() body: AssignJobDto,
  ): Promise<boolean> {
    if (body.userId) {
      const res = await this.employeesService.assignJob(
        param.employeeId,
        body.userId,
      );
      return res.affected !== 0;
    }

    const res = await this.employeesService.unAssignJob(param.employeeId);
    return res.affected !== 0;
  }
}
