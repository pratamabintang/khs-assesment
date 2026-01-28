import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

export interface Region {
  id: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class RegionService {
  private readonly baseUrl = 'https://www.emsifa.com/api-wilayah-indonesia/api';

  constructor(private http: HttpClient) {}

  getProvinces(): Observable<Region[]> {
    return this.http.get<Region[]>(`${this.baseUrl}/provinces.json`).pipe(catchError(() => of([])));
  }

  getRegencies(provinceId: string): Observable<Region[]> {
    return this.http
      .get<Region[]>(`${this.baseUrl}/regencies/${provinceId}.json`)
      .pipe(catchError(() => of([])));
  }

  getDistricts(regencyId: string): Observable<Region[]> {
    return this.http
      .get<Region[]>(`${this.baseUrl}/districts/${regencyId}.json`)
      .pipe(catchError(() => of([])));
  }

  getVillages(districtId: string): Observable<Region[]> {
    return this.http
      .get<Region[]>(`${this.baseUrl}/villages/${districtId}.json`)
      .pipe(catchError(() => of([])));
  }
}
