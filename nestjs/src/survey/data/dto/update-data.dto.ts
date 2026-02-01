import { PartialType } from '@nestjs/mapped-types';
import { DataDto } from './data.dto';

export class UpdateDataDto extends PartialType(DataDto) {}
