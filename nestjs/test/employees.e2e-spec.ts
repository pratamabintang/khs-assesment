// // test/employees.e2e-spec.ts
// import { Test, TestingModule } from '@nestjs/testing';
// import { INestApplication, ValidationPipe } from '@nestjs/common';
// import request from 'supertest';
// import cookieParser from 'cookie-parser';

// import { AppModule } from '../src/app.module';

// interface TokenResponseBody {
//   accessToken: string;
// }

// interface EmployeeResponseBody {
//   id: string;
//   fullName: string;
//   position?: string | null;
//   isActive: boolean;
//   userId: string;
//   createdAt: string;
//   updatedAt: string;
// }

// describe('Employees (e2e)', () => {
//   let app: INestApplication;
//   let agent: ReturnType<typeof request.agent>;
//   // let accessToken = '';

//   // user A (company A)
//   const emailA = `e2e_empA_${Date.now()}@test.com`;
//   const phoneA = `08${Math.floor(Math.random() * 1e10)}`.slice(0, 12);
//   const passwordA = 'Password123!';

//   // user B (company B) untuk test authorization boundary
//   const emailB = `e2e_empB_${Date.now()}@test.com`;
//   const phoneB = `08${Math.floor(Math.random() * 1e10)}`.slice(0, 12);
//   const passwordB = 'Password123!';

//   let accessTokenA = '';
//   let accessTokenB = '';

//   let employeeIdA = '';

//   beforeAll(async () => {
//     const moduleFixture: TestingModule = await Test.createTestingModule({
//       imports: [AppModule],
//     }).compile();

//     app = moduleFixture.createNestApplication();

//     app.useGlobalPipes(
//       new ValidationPipe({
//         whitelist: true,
//         transform: true,
//       }),
//     );

//     app.use(cookieParser());

//     await app.init();

//     const httpServer = app.getHttpServer() as unknown as Parameters<
//       typeof request.agent
//     >[0];

//     agent = request.agent(httpServer);
//   });

//   afterAll(async () => {
//     await app.close();
//   });

//   async function registerAndLogin(
//     email: string,
//     phoneNumber: string,
//     password: string,
//   ) {
//     await agent
//       .post('/auth/register')
//       .send({
//         nama: 'E2E Company',
//         email,
//         phoneNumber,
//         password,
//         province: 'DKI Jakarta',
//         regency: 'Jakarta Selatan',
//         district: 'Kebayoran Baru',
//         village: 'Gandaria Utara',
//         fullAddress: 'Jl. Contoh No. 1',
//       })
//       .expect(201);

//     const loginRes = await agent
//       .post('/auth/login')
//       .send({ email, password })
//       .expect(201);

//     const body = loginRes.body as TokenResponseBody;
//     expect(typeof body.accessToken).toBe('string');
//     expect(body.accessToken.length).toBeGreaterThan(10);

//     return body.accessToken;
//   }

//   it('setup: register/login company A & B', async () => {
//     accessTokenA = await registerAndLogin(emailA, phoneA, passwordA);
//     accessTokenB = await registerAndLogin(emailB, phoneB, passwordB);

//     // // keep one as default if needed
//     // accessToken = accessTokenA;
//   });

//   it('company A: create employee -> list contains it -> get by id', async () => {
//     // CREATE
//     const createRes = await agent
//       .post('/employees')
//       .set('Authorization', `Bearer ${accessTokenA}`)
//       .send({
//         fullName: 'Budi Santoso',
//         position: 'Staff',
//         isActive: true,
//         // userId tidak dikirim karena diambil dari payload.sub
//       })
//       .expect(201);

//     const created = createRes.body as EmployeeResponseBody;
//     expect(typeof created.id).toBe('string');
//     expect(created.fullName).toBe('Budi Santoso');
//     expect(created.position).toBe('Staff');
//     expect(created.isActive).toBe(true);
//     expect(typeof created.userId).toBe('string');

//     employeeIdA = created.id;

//     // LIST (harus berisi employee tsb)
//     const listRes = await agent
//       .get('/employees')
//       .set('Authorization', `Bearer ${accessTokenA}`)
//       .expect(200);

//     expect(Array.isArray(listRes.body)).toBe(true);

//     const list = listRes.body as EmployeeResponseBody[];
//     const found = list.find((e) => e.id === employeeIdA);
//     expect(found).toBeDefined();
//     expect(found?.fullName).toBe('Budi Santoso');

//     // GET BY ID
//     const getRes = await agent
//       .get(`/employees/${employeeIdA}`)
//       .set('Authorization', `Bearer ${accessTokenA}`)
//       .expect(200);

//     const got = getRes.body as EmployeeResponseBody;
//     expect(got.id).toBe(employeeIdA);
//     expect(got.fullName).toBe('Budi Santoso');
//   });

//   it('company A: update employee', async () => {
//     const updateRes = await agent
//       .patch(`/employees/${employeeIdA}`)
//       .set('Authorization', `Bearer ${accessTokenA}`)
//       .send({
//         position: 'Supervisor',
//         isActive: false,
//       })
//       .expect(200);

//     const updated = updateRes.body as EmployeeResponseBody;
//     expect(updated.id).toBe(employeeIdA);
//     expect(updated.position).toBe('Supervisor');
//     expect(updated.isActive).toBe(false);
//   });

//   it('company A: setActive endpoint works', async () => {
//     const res = await agent
//       .patch(`/employees/${employeeIdA}/active`)
//       .set('Authorization', `Bearer ${accessTokenA}`)
//       .send({ isActive: true })
//       .expect(200);

//     const updated = res.body as EmployeeResponseBody;
//     expect(updated.id).toBe(employeeIdA);
//     expect(updated.isActive).toBe(true);
//   });

//   it('company B cannot access company A employee', async () => {
//     // GET should not find (NotFound by our service design)
//     await agent
//       .get(`/employees/${employeeIdA}`)
//       .set('Authorization', `Bearer ${accessTokenB}`)
//       .expect(404);

//     // UPDATE should also fail
//     await agent
//       .patch(`/employees/${employeeIdA}`)
//       .set('Authorization', `Bearer ${accessTokenB}`)
//       .send({ position: 'Hacker' })
//       .expect(404);

//     // DELETE should also fail
//     await agent
//       .delete(`/employees/${employeeIdA}`)
//       .set('Authorization', `Bearer ${accessTokenB}`)
//       .expect(404);
//   });

//   it('company A: delete employee -> get returns 404', async () => {
//     await agent
//       .delete(`/employees/${employeeIdA}`)
//       .set('Authorization', `Bearer ${accessTokenA}`)
//       .expect(200);

//     await agent
//       .get(`/employees/${employeeIdA}`)
//       .set('Authorization', `Bearer ${accessTokenA}`)
//       .expect(404);
//   });

//   it('unauthorized cannot access employees', async () => {
//     await agent.get('/employees').expect(401);
//   });
// });
