import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class MonthQuery {
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'month must be in format YYYY-MM',
  })
  month: string;
}
