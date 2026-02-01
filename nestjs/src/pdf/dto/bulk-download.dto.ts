import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsMongoId, IsNotEmpty } from 'class-validator';

export class BulkDownloadDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'ids array must not empty ' })
  @IsMongoId({ each: true })
  @IsNotEmpty({ each: true })
  @Type(() => String)
  dataIds: string[];
}
