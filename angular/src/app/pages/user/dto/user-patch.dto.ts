import { UserExposeDto } from './user-expose.dto';

export type PatchUserPayload = Partial<Pick<UserExposeDto, 'nama' | 'email' | 'phoneNumber'>> & {
  province: string;
  regency: string;
  district: string;
  village: string;
  fullAddress: string;
};
