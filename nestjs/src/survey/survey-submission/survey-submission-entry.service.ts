import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SurveySubmissionEntry } from './survey-submission.entity';
import { EmployeesService } from 'src/employee/employee.service';
import { JwtPayload } from 'src/auth/jwt-payload.type';
import { UpdateSubmissionAnswerByIdDto } from '../dto/update-survey-submission-entry.dto';
import { RoleEnum } from 'src/users/role.enum';
import { AssignSurvey } from './dto/assign-survey.dto';

@Injectable()
export class SurveySubmissionEntryService {
  constructor(
    @InjectRepository(SurveySubmissionEntry)
    private readonly repo: Repository<SurveySubmissionEntry>,
    private readonly employeesService: EmployeesService,
  ) {}

  async create(user: JwtPayload, dto: AssignSurvey): Promise<void> {
    if (dto.mode === 'all') {
      const employees = await this.employeesService.findAll(user);
      for (const employee of employees) {
        try {
          await this.assignOne(user, {
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
      if (!dto.clientId) throw new BadRequestException();
      const employees = await this.employeesService.findAllClientEmp(
        user,
        dto.clientId,
      );
      for (const employee of employees) {
        try {
          await this.assignOne(user, {
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
      await this.assignOne(user, {
        employeeId: dto.employeeId,
        surveyId: dto.surveyId,
      });
    }
  }

  async assignOne(
    user: JwtPayload,
    data: {
      surveyId: string;
      employeeId: string;
    },
  ): Promise<void> {
    const employee = await this.employeesService.findOne(user, data.employeeId);
    if (!employee.userId) return;

    const normalized = this.normalizeToMonthStart(this.getCurrentMonth());

    const exists = await this.repo.findOne({
      where: {
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

    const entity = this.repo.create({
      employeeId: data.employeeId,
      surveyId: data.surveyId,
      userId: employee.userId ?? '',
      periodMonth: normalized,
      nosql: null,
    });

    await this.repo.save(entity);
  }

  async findOne(entryId: string): Promise<SurveySubmissionEntry | null> {
    return await this.repo.findOneBy({
      id: entryId,
    });
  }

  async hardDelete(entryId: string): Promise<void> {
    await this.repo.delete(entryId);
  }

  async getAll(
    user: JwtPayload,
    month: string,
  ): Promise<SurveySubmissionEntry[]> {
    const employees = await this.employeesService.findAll(user);
    if (employees.length === 0) return [];

    const employeeIds = employees.map((e) => e.id);

    return await this.repo.find({
      where: {
        employeeId: In(employeeIds),
        periodMonth: month + '-01',
      },
      relations: {
        employee: true,
        survey: false,
      },
    });
  }

  async getAllAdmin(
    user: JwtPayload,
    from?: string,
    to?: string,
  ): Promise<SurveySubmissionEntry[]> {
    if (user.role !== RoleEnum.ADMIN) {
      throw new ForbiddenException('forbidden resource access');
    }

    const currentMonth = this.getCurrentMonth();

    if (!from && !to) {
      return this.repo.find({
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

    return this.repo
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

  async updateAnswerById(user: JwtPayload, dto: UpdateSubmissionAnswerByIdDto) {
    const entry = await this.repo.findOne({
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
    return this.repo.save(entry);
  }

  async isUpdate(
    user: JwtPayload,
    employeeId: string,
    surveyId: string,
    periodMonth: string,
  ): Promise<boolean> {
    const normalized = this.normalizeToMonthStart(periodMonth);

    const exists = await this.repo.findOne({
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
