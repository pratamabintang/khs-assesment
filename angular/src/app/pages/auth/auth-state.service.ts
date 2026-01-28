import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { RoleEnum } from '../../shared/type/role.enum';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private accessTokenSubject = new BehaviorSubject<string | null>(null);
  private roleSubject = new BehaviorSubject<RoleEnum | null>(null);

  setAccessToken(token: string) {
    this.accessTokenSubject.next(token);
  }

  setRole(role: RoleEnum) {
    this.roleSubject.next(role);
  }

  getAccessToken(): string | null {
    return this.accessTokenSubject.value;
  }

  getRole(): RoleEnum | null {
    return this.roleSubject.value;
  }

  clear() {
    this.accessTokenSubject.next(null);
    this.roleSubject.next(null);
  }
}
