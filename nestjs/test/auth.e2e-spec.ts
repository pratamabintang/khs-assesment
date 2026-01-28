// import { Test, TestingModule } from '@nestjs/testing';
// import { INestApplication, ValidationPipe } from '@nestjs/common';
// import request from 'supertest';
// import cookieParser from 'cookie-parser';

// import { AppModule } from '../src/app.module';

// interface TokenResponseBody {
//   accessToken: string;
// }

// interface ProfileResponseBody {
//   email: string;
// }

// function expectRefreshCookieSet(res: { headers: Record<string, unknown> }) {
//   const setCookie = res.headers['set-cookie'];

//   expect(setCookie).toBeDefined();

//   if (Array.isArray(setCookie)) {
//     expect(setCookie.join(';')).toContain('refresh_token=');
//     return;
//   }

//   if (typeof setCookie === 'string') {
//     expect(setCookie).toContain('refresh_token=');
//     return;
//   }

//   throw new Error('set-cookie header is not a string or string[]');
// }

// describe('Auth (e2e)', () => {
//   let app: INestApplication;
//   let agent: ReturnType<typeof request.agent>;
//   let accessToken = '';

//   const email = `e2e_${Date.now()}@test.com`;
//   const phoneNumber = `08${Math.floor(Math.random() * 1e10)}`.slice(0, 12);
//   const password = 'Password123!';

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

//   it('register -> login -> profile', async () => {
//     await agent
//       .post('/auth/register')
//       .send({
//         nama: 'E2E User',
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

//     const loginBody = loginRes.body as TokenResponseBody;
//     expect(typeof loginBody.accessToken).toBe('string');
//     expect(loginBody.accessToken.length).toBeGreaterThan(10);
//     accessToken = loginBody.accessToken;

//     expectRefreshCookieSet(loginRes);

//     const profileRes = await agent
//       .get('/auth/profile')
//       .set('Authorization', `Bearer ${accessToken}`)
//       .expect(200);

//     const profileBody = profileRes.body as ProfileResponseBody;
//     expect(profileBody.email).toBe(email);
//   });

//   it('refresh rotates refresh_token and returns new accessToken', async () => {
//     const refreshRes = await agent.post('/auth/refresh').expect(201);

//     const refreshBody = refreshRes.body as TokenResponseBody;
//     expect(typeof refreshBody.accessToken).toBe('string');
//     expect(refreshBody.accessToken.length).toBeGreaterThan(10);

//     const newAccessToken = refreshBody.accessToken;

//     // cookie rotation (set-cookie harus ada lagi)
//     expectRefreshCookieSet(refreshRes);

//     await agent
//       .get('/auth/profile')
//       .set('Authorization', `Bearer ${newAccessToken}`)
//       .expect(200);

//     accessToken = newAccessToken;
//   });

//   it('logout invalidates refresh token', async () => {
//     await agent
//       .post('/auth/logout')
//       .set('Authorization', `Bearer ${accessToken}`)
//       .expect(201);

//     await agent.post('/auth/refresh').expect(401);
//   });

//   it('USER cannot access admin endpoint', async () => {
//     await agent
//       .get('/auth/admin')
//       .set('Authorization', `Bearer ${accessToken}`)
//       .expect(403);
//   });
// });
