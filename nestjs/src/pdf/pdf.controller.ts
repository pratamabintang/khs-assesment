import { Body, Controller, Get, Param, Post, Req, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PdfService } from './pdf.service';
import { PenilaianService } from './penilaian.service';
import type { AuthRequest } from 'src/request/auth.request';
import { BulkDownloadDto } from './dto/bulk-download.dto';
import archiver from 'archiver';
import { Role } from 'src/decorator/role.decorator';
import { RoleEnum } from 'src/users/role.enum';
import { DataIdParam } from './param/data-id.param';
import { Throttle } from '@nestjs/throttler';

@Controller('pdf')
export class PdfController {
  constructor(
    private readonly pdfService: PdfService,
    private readonly penilaianService: PenilaianService,
  ) {}

  @Throttle({
    default: {
      ttl: 1000,
      limit: 1,
    },
  })
  @Get(':dataId')
  async download(
    @Req() req: AuthRequest,
    @Param() param: DataIdParam,
    @Res() res: Response,
  ): Promise<void> {
    const data = await this.penilaianService.getData(req.user, param.dataId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="penilaian_${param.dataId}.pdf"`,
    );
    res.send(await this.pdfService.renderPenilaianPdf(data));
  }

  @Throttle({
    default: {
      ttl: 5000,
      limit: 1,
    },
  })
  @Post('')
  @Role(RoleEnum.ADMIN)
  async downloadBulkZip(
    @Req() req: AuthRequest,
    @Body() body: BulkDownloadDto,
    @Res() res: Response,
  ): Promise<void> {
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

    for (const dataId of body.dataIds) {
      const data = await this.penilaianService.getData(req.user, dataId);
      const pdfBuffer = await this.pdfService.renderPenilaianPdf(data);

      archive.append(pdfBuffer, {
        name: `penilaian_${dataId}.pdf`,
      });
    }

    await archive.finalize();
  }
}
