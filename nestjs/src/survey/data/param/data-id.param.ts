import { IsMongoId, IsNotEmpty } from 'class-validator';

export class DataIdParam {
  @IsNotEmpty()
  @IsMongoId()
  dataId: string;
}
