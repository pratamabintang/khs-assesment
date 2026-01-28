import { Module } from '@nestjs/common';
import { PdfController } from './pdf.controller';
import { PdfService } from './pdf.service';
import { PenilaianService } from './penilaian.service';
import { SurveyModule } from 'src/survey/survey.module';
import { EmployeeModule } from 'src/employee/employee.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [SurveyModule, EmployeeModule, UsersModule],
  controllers: [PdfController],
  providers: [PdfService, PenilaianService],
  exports: [PdfService],
})
export class PdfModule {}
