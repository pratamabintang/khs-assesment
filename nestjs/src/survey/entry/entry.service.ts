import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Entry } from './entry.entity';
import { EmployeesService } from 'src/employee/employee.service';
import { JwtPayload } from 'src/auth/jwt-payload.type';
import { UpdateAnswerByIdDto } from './dto/update-answer-by-id.dto';
import { RoleEnum } from 'src/users/role.enum';
import { AssignSurvey } from './dto/assign-survey.dto';

@Injectable()
export class EntryService {
  constructor(
    @InjectRepository(Entry)
    private readonly entryRepository: Repository<Entry>,
    private readonly employeesService: EmployeesService,
  ) {}

  public async create(user: JwtPayload, dto: AssignSurvey): Promise<void> {
    if (dto.mode === 'all') {
      const employees = await this.employeesService.findAll(user);
      for (const employee of employees) {
        if (!employee.userId) continue;
        try {
          await this.assignOne(user, {
            userId: employee.userId,
            employeeId: employee.id,
            surveyId: dto.surveyId,
          });
        } catch (e) {
          if (e instanceof ConflictException) continue;
          throw e;
        }
      }
    }

    if (dto.mode === 'client') {
      if (!dto.userId) throw new BadRequestException();
      const employees = await this.employeesService.findAllClientEmp(
        user,
        dto.userId,
      );
      for (const employee of employees) {
        try {
          await this.assignOne(user, {
            userId: dto.userId,
            employeeId: employee.id,
            surveyId: dto.surveyId,
          });
        } catch (e) {
          if (e instanceof ConflictException) continue;
          throw e;
        }
      }
    }

    if (dto.mode === 'employee') {
      if (!dto.employeeId) throw new BadRequestException();
      const employee = await this.employeesService.findOne(
        user,
        dto.employeeId,
      );
      if (!employee.userId) return;
      await this.assignOne(user, {
        userId: employee.userId,
        employeeId: dto.employeeId,
        surveyId: dto.surveyId,
      });
    }
  }

  public async assignOne(
    user: JwtPayload,
    data: {
      userId: string;
      employeeId: string;
      surveyId: string;
    },
  ): Promise<void> {
    const employee = await this.employeesService.findOne(user, data.employeeId);
    if (!employee.userId) return;

    const normalized = this.normalizeToMonthStart(this.getCurrentMonth());

    const exists = await this.entryRepository.findOne({
      where: {
        userId: data.userId,
        employeeId: data.employeeId,
        surveyId: data.surveyId,
        periodMonth: normalized,
      },
      select: { id: true },
    });

    if (exists) {
      throw new ConflictException(
        'Submission entry already exists for this employee/survey/month',
      );
    }

    const entity = this.entryRepository.create({
      employeeId: data.employeeId,
      surveyId: data.surveyId,
      userId: employee.userId ?? '',
      periodMonth: normalized,
      nosql: null,
    });

    await this.entryRepository.save(entity);
  }

  public async findOne(entryId: string): Promise<Entry | null> {
    return await this.entryRepository.findOneBy({
      id: entryId,
    });
  }

  public async hardDelete(entryId: string): Promise<void> {
    await this.entryRepository.delete(entryId);
  }

  public async getAll(user: JwtPayload, month: string): Promise<Entry[]> {
    return await this.entryRepository.find({
      where: {
        userId: user.sub,
        periodMonth: month + '-01',
      },
      relations: {
        employee: true,
        survey: false,
      },
    });
  }

  public async getAllAdmin(
    user: JwtPayload,
    from?: string,
    to?: string,
  ): Promise<Entry[]> {
    if (user.role !== RoleEnum.ADMIN) {
      throw new ForbiddenException('forbidden resource access');
    }

    const currentMonth = this.getCurrentMonth();

    if (!from && !to) {
      return this.entryRepository.find({
        where: { periodMonth: currentMonth },
        relations: { employee: true, user: true },
      });
    }

    if (from && !/^\d{4}-\d{2}-01$/.test(from)) {
      throw new ConflictException("Invalid 'from' format. Use YYYY-MM-01");
    }
    if (to && !/^\d{4}-\d{2}-01$/.test(to)) {
      throw new ConflictException("Invalid 'to' format. Use YYYY-MM-01");
    }

    let start = from ?? null;
    let end = to ?? null;
    if (start && end && start > end) {
      [start, end] = [end, start];
    }

    return this.entryRepository
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.employee', 'employee')
      .leftJoinAndSelect('e.user', 'user')
      .where(start ? 'e.periodMonth >= :start' : '1=1', { start: start ?? '' })
      .andWhere(
        end ? 'e.periodMonth < :endExclusive' : '1=1',
        end
          ? { endExclusive: this.addMonthsToMonthStart(end, 1) }
          : { endExclusive: '' },
      )
      .orderBy('e.periodMonth', 'ASC')
      .getMany();
  }

  public async updateAnswerById(
    user: JwtPayload,
    dto: UpdateAnswerByIdDto,
  ): Promise<Entry> {
    const entry = await this.entryRepository.findOne({
      where: { id: dto.entryId },
      select: { id: true, userId: true, nosql: true },
    });

    if (!entry) throw new NotFoundException('Submission entry not found');

    if (entry.userId !== user.sub && user.role !== RoleEnum.ADMIN) {
      throw new ForbiddenException(
        'You are not allowed to update this submission',
      );
    }

    entry.nosql = dto.noSql;
    return this.entryRepository.save(entry);
  }

  public async isUpdate(
    user: JwtPayload,
    employeeId: string,
    surveyId: string,
    periodMonth: string,
  ): Promise<boolean> {
    const normalized = this.normalizeToMonthStart(periodMonth);

    const exists = await this.entryRepository.findOne({
      where: {
        employeeId,
        surveyId,
        periodMonth: normalized,
      },
      select: { userId: true, nosql: true },
    });

    if (user.role === RoleEnum.USER && user.sub !== exists?.userId) {
      throw new ForbiddenException();
    }

    return (
      exists?.nosql != null &&
      (typeof exists.nosql !== 'string' || exists.nosql.trim().length > 0)
    );
  }

  private getCurrentMonth(): string {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    return new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
  }

  private normalizeToMonthStart(periodMonth: string): string {
    const d = new Date(periodMonth);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    return new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
  }

  private addMonthsToMonthStart(
    monthStart: string,
    monthsToAdd: number,
  ): string {
    const d = new Date(monthStart);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    return new Date(Date.UTC(year, month + monthsToAdd, 1))
      .toISOString()
      .slice(0, 10);
  }
}
