import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class AdminResponse {
  constructor(partial?: Partial<AdminResponse>) {
    Object.assign(this, partial);
  }

  @Expose()
  message: string;
}
