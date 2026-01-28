import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString } from 'class-validator';

export class BulkDownloadDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'ids array must not empty ' })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @Type(() => String)
  submissionIds: string[];
}
