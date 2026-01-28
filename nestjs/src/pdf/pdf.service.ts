import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import puppeteer, { Browser } from 'puppeteer';
import { SubmissionData } from './penilaian.service';

interface QuestionForRowspan {
  details?: unknown[];
}

@Injectable()
export class PdfService {
  private readonly templatePath = path.join(
    process.cwd(),
    'src',
    'pdf',
    'templates',
    'penilaian.hbs',
  );

  private browser: Browser | null = null;

  constructor() {
    this.registerHandlebarsHelpers();
  }

  private readFileUtf8(filePath: string): string {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (e) {
      throw new InternalServerErrorException(
        `Gagal membaca file: ${filePath} ${e}`,
      );
    }
  }

  private registerHandlebarsHelpers() {
    Handlebars.registerHelper('eq', (a: any, b: any) => a === b);

    Handlebars.registerHelper('inc', (value: number) => (value ?? 0) + 1);

    Handlebars.registerHelper('rowspanQuestion', (q: QuestionForRowspan) => {
      return 1 + (q?.details?.length ?? 0);
    });
  }

  private async getBrowser(): Promise<Browser> {
    if (this.browser) return this.browser;

    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    return this.browser;
  }

  async renderPenilaianPdf(data: SubmissionData): Promise<Buffer> {
    const templateRaw = this.readFileUtf8(this.templatePath);

    const html = Handlebars.compile(templateRaw, {
      strict: false,
      noEscape: true,
    })(data);

    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBytes = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
      });

      return Buffer.from(pdfBytes);
    } catch (e) {
      throw new InternalServerErrorException(`Gagal generate PDF: ${e}`);
    } finally {
      await page.close();
    }
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
