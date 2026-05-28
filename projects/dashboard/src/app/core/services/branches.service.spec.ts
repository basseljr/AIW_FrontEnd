import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { BranchesService } from './branches.service';
import { API_BASE_URL } from '@shared/api';
import { BranchListItem } from '../models/branch.model';

const BASE = 'https://api.test';

const MOCK_BRANCH: BranchListItem = {
  id: '22222222-2222-2222-2222-222222222222',
  tenantId: '11111111-1111-1111-1111-111111111111',
  nameEn: 'Main Branch',
  nameAr: 'الفرع الرئيسي',
  address: 'Kuwait City',
  phone: '+96512345678',
  latitude: 29.37,
  longitude: 47.97,
  isActive: true,
  workingHoursJson: null,
};

function setup() {
  TestBed.configureTestingModule({
    imports: [HttpClientTestingModule],
    providers: [
      BranchesService,
      { provide: API_BASE_URL, useValue: BASE },
    ],
  });

  return {
    service: TestBed.inject(BranchesService),
    http: TestBed.inject(HttpTestingController),
  };
}

describe('BranchesService', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('getAll() calls GET /branches', () => {
    const { service, http } = setup();
    let result: BranchListItem[] | undefined;

    service.getAll().subscribe((r) => (result = r));

    const req = http.expectOne(`${BASE}/branches`);
    expect(req.request.method).toBe('GET');
    req.flush([MOCK_BRANCH]);

    expect(result).toEqual([MOCK_BRANCH]);
  });

  it('getById() calls GET /branches/:id', () => {
    const { service, http } = setup();
    let result: BranchListItem | undefined;

    service.getById(MOCK_BRANCH.id).subscribe((r) => (result = r));

    const req = http.expectOne(`${BASE}/branches/${MOCK_BRANCH.id}`);
    expect(req.request.method).toBe('GET');
    req.flush(MOCK_BRANCH);

    expect(result?.nameEn).toBe(MOCK_BRANCH.nameEn);
  });

  it('create() calls POST /branches', () => {
    const { service, http } = setup();
    const body = { nameEn: 'New', nameAr: 'جديد', isActive: true };

    service.create(body).subscribe();

    const req = http.expectOne(`${BASE}/branches`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(MOCK_BRANCH);
  });

  it('update() calls PUT /branches/:id', () => {
    const { service, http } = setup();
    const body = { nameEn: 'Updated', nameAr: 'محدث', isActive: true };

    service.update(MOCK_BRANCH.id, body).subscribe();

    const req = http.expectOne(`${BASE}/branches/${MOCK_BRANCH.id}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(body);
    req.flush(MOCK_BRANCH);
  });

  it('delete() calls DELETE /branches/:id', () => {
    const { service, http } = setup();

    service.delete(MOCK_BRANCH.id).subscribe();

    const req = http.expectOne(`${BASE}/branches/${MOCK_BRANCH.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
