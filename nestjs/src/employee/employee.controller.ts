import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { EmployeesService } from './employee.service';
import { CreateEmployeeDto } from '../dto/create-employee.dto';
import { UpdateEmployeeDto } from '../dto/update-employee.dto';
import type { AuthRequest } from '../request/auth.request';
import { RoleEnum } from '../users/role.enum';
import { Role } from '../decorator/role.decorator';
import { Employee } from './employee.entity';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post('')
  @Role(RoleEnum.ADMIN)
  create(@Body() dto: CreateEmployeeDto): Promise<Employee> {
    return this.employeesService.create(dto);
  }

  @Get('')
  findAll(@Req() req: AuthRequest) {
    return this.employeesService.findAll(req.user);
  }

  @Get(':id')
  findOne(
    @Req() req: AuthRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.employeesService.findOne(req.user, id);
  }

  @Patch(':id')
  @Role(RoleEnum.ADMIN)
  update(
    @Req() req: AuthRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateEmployeeDto,
  ): Promise<Employee> {
    return this.employeesService.update(req.user, id, dto);
  }

  @Patch(':id/active')
  @Role(RoleEnum.ADMIN)
  setActive(
    @Req() req: AuthRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: { isActive: boolean },
  ) {
    return this.employeesService.setActive(req.user, id, body.isActive);
  }

  @Delete(':id')
  @Role(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Req() req: AuthRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.employeesService.remove(req.user, id);
  }

  @Patch('assign/:id')
  @Role(RoleEnum.ADMIN)
  async assignJob(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: { userId: string | null },
  ): Promise<boolean> {
    console.log('masuk');
    if (body.userId) {
      const res = await this.employeesService.assignJob(id, body.userId);
      return res.affected !== 0;
    }

    const res = await this.employeesService.unAssignJob(id);
    return res.affected !== 0;
  }
}
