import { IsNotEmpty, IsUUID } from 'class-validator';

export class EntryIdParam {
  @IsNotEmpty()
  @IsUUID()
  entryId: string;
}
