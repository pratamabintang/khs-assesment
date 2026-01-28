import { Expose } from 'class-transformer';

export class AdminResponse {
  constructor(partial?: Partial<AdminResponse>) {
    Object.assign(this, partial);
  }

  @Expose()
  message: string;
}
