import { Body, Controller, Get, Param, Post, Req, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PdfService } from './pdf.service';
import { PenilaianService } from './penilaian.service';
import type { AuthRequest } from 'src/request/auth.request';
import { BulkDownloadDto } from './dto/bulk-download.dto';
import archiver from 'archiver';
import { Role } from 'src/decorator/role.decorator';
import { RoleEnum } from 'src/users/role.enum';

@Controller('pdf')
export class PdfController {
  constructor(
    private readonly pdfService: PdfService,
    private readonly penilaianService: PenilaianService,
  ) {}

  @Get(':id')
  async download(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const data = await this.penilaianService.getData(req.user, id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="penilaian_${id}.pdf"`,
    );
    res.send(await this.pdfService.renderPenilaianPdf(data));
  }

  @Post('')
  @Role(RoleEnum.ADMIN)
  async downloadBulkZip(
    @Req() req: AuthRequest,
    @Body() dto: BulkDownloadDto,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="penilaian_bulk.zip"',
    );

    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('error', (err) => {
      res.status(500).send({ message: err.message });
    });

    archive.pipe(res);

    for (const submissionId of dto.submissionIds) {
      const data = await this.penilaianService.getData(req.user, submissionId);
      const pdfBuffer = await this.pdfService.renderPenilaianPdf(data);

      archive.append(pdfBuffer, {
        name: `penilaian_${submissionId}.pdf`,
      });
    }

    await archive.finalize();
  }
}
