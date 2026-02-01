import { IsDateString, IsOptional, Matches } from 'class-validator';

export class RangeQuery {
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date harus berformat YYYY-MM-DD',
  })
  from?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date harus berformat YYYY-MM-DD',
  })
  to?: string;
}
