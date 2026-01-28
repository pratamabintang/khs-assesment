// test/survey-submissions.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';

import { AppModule } from '../src/app.module';
import { SurveyType } from '../src/survey/survey.type'; // sesuaikan path kalau beda

interface TokenResponseBody {
  accessToken: string;
}

interface EmployeeResponseBody {
  id: string;
  fullName: string;
  position?: string | null;
  isActive: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface SurveyResponseBody {
  id: string; // UUID v4
  title?: string;
  questions?: Array<{
    id: string;
    title?: string;
    type: SurveyType;
    isRequired?: boolean;
  }>;
}

interface SurveyAnswerBody {
  questionId: string;
  type: SurveyType;
  value: string | number | null;
}

interface SurveySubmissionResponseBody {
  id?: string;
  surveyId: string;
  employeeId: string;
  answers: SurveyAnswerBody[];
  totalPoint: number;
  createdAt?: string;
  updatedAt?: string;
}

interface FindOneSubmissionResponseBody {
  survey: SurveyResponseBody;
  submission: SurveySubmissionResponseBody;
}

describe('Survey Submission (e2e)', () => {
  let app: INestApplication;
  let agent: ReturnType<typeof request.agent>;

  /**
   * Sesuaikan BASE kalau controller kamu:
   * - @Controller('survey') => '/survey'
   * - @Controller('surveys') => '/surveys'
   */
  const BASE = '/survey';

  // user A (company A)
  const emailA = `e2e_suba_${Date.now()}@test.com`;
  const phoneA = `08${Math.floor(Math.random() * 1e10)}`.slice(0, 12);
  const passwordA = 'Password123!';

  // user B (company B)
  const emailB = `e2e_subb_${Date.now()}@test.com`;
  const phoneB = `08${Math.floor(Math.random() * 1e10)}`.slice(0, 12);
  const passwordB = 'Password123!';

  let accessTokenA = '';
  let accessTokenB = '';

  let employeeIdA = '';
  // let employeeIdB = '';

  let surveyId = '';

  // question ids yang dipakai dalam submission
  let qNumericId = '';
  let qTextareaId = '';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    app.use(cookieParser());

    await app.init();

    const httpServer = app.getHttpServer() as unknown as Parameters<
      typeof request.agent
    >[0];

    agent = request.agent(httpServer);
  });

  afterAll(async () => {
    await app.close();
  });

  async function registerAndLogin(
    email: string,
    phoneNumber: string,
    password: string,
  ): Promise<string> {
    await agent
      .post('/auth/register')
      .send({
        nama: 'E2E Company',
        email,
        phoneNumber,
        password,
        province: 'DKI Jakarta',
        regency: 'Jakarta Selatan',
        district: 'Kebayoran Baru',
        village: 'Gandaria Utara',
        fullAddress: 'Jl. Contoh No. 1',
      })
      .expect(201);

    const loginRes = await agent
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    const body = loginRes.body as TokenResponseBody;
    expect(typeof body.accessToken).toBe('string');
    expect(body.accessToken.length).toBeGreaterThan(10);

    return body.accessToken;
  }

  async function createEmployee(
    accessToken: string,
    fullName: string,
  ): Promise<string> {
    const createRes = await agent
      .post('/employees')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        fullName,
        position: 'Staff',
        isActive: true,
      })
      .expect(201);

    const created = createRes.body as EmployeeResponseBody;
    expect(typeof created.id).toBe('string');
    expect(created.fullName).toBe(fullName);

    return created.id;
  }

  /**
   * WAJIB SESUAIKAN jika endpoint/payload create survey di project kamu beda.
   * - Aku asumsikan POST `${BASE}` membuat survey dan return { id, questions[] }
   * - Kalau create survey hanya boleh admin, kamu perlu login admin khusus.
   */
  async function createSurvey(
    accessToken: string,
  ): Promise<SurveyResponseBody> {
    const res = await agent
      .post(`${BASE}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'E2E Survey Submission',
        isActive: true,
        questions: [
          {
            id: 'q1',
            title: 'Nilai Kepuasan',
            type: SurveyType.RADIO,
            isRequired: true,
            options: [
              { label: '1', value: 1 },
              { label: '2', value: 2 },
            ],
          },
          {
            id: 'q2',
            title: 'Komentar',
            type: SurveyType.TEXTAREA,
            isRequired: false,
          },
        ],
      });

    expect([200, 201]).toContain(res.status);

    const body = res.body as SurveyResponseBody;
    expect(typeof body.id).toBe('string');
    expect(body.id.length).toBeGreaterThan(10);

    return body;
  }

  it('setup: register/login A & B, create employees, create survey', async () => {
    accessTokenA = await registerAndLogin(emailA, phoneA, passwordA);
    accessTokenB = await registerAndLogin(emailB, phoneB, passwordB);

    employeeIdA = await createEmployee(accessTokenA, 'Budi A');
    // employeeIdB = await createEmployee(accessTokenB, 'Budi B');

    const survey = await createSurvey(accessTokenA);
    surveyId = survey.id;

    // Tentukan questionId untuk submission.
    // Kalau response createSurvey berisi questions dengan id, pakai itu.
    // Kalau tidak ada, fallback ke hardcode 'q1'/'q2'.
    const questions = survey.questions ?? [];
    qNumericId = questions.find((q) => q.type === SurveyType.RADIO)?.id ?? 'q1';
    qTextareaId =
      questions.find((q) => q.type === SurveyType.TEXTAREA)?.id ?? 'q2';
  });

  it('company A: create submission -> list -> get by surveyId', async () => {
    // CREATE submission
    const createRes = await agent
      .post(`${BASE}/submission`)
      .set('Authorization', `Bearer ${accessTokenA}`)
      .send({
        surveyId,
        employeeId: String(employeeIdA),
        answers: [
          { questionId: qNumericId, type: SurveyType.RADIO, value: 2 },
          {
            questionId: qTextareaId,
            type: SurveyType.TEXTAREA,
            value: 'Mantap',
          },
        ],
      })
      .expect(201);

    const created = createRes.body as SurveySubmissionResponseBody;
    expect(created.surveyId).toBe(surveyId);
    expect(String(created.employeeId)).toBe(String(employeeIdA));
    expect(Array.isArray(created.answers)).toBe(true);
    expect(created.totalPoint).toBe(2);

    // LIST - user A hanya lihat submission employee miliknya
    const listRes = await agent
      .get(`${BASE}/submission`)
      .set('Authorization', `Bearer ${accessTokenA}`)
      .expect(200);

    const list = listRes.body as SurveySubmissionResponseBody[];
    expect(Array.isArray(list)).toBe(true);

    const found = list.find(
      (s) =>
        s.surveyId === surveyId && String(s.employeeId) === String(employeeIdA),
    );
    expect(found).toBeDefined();

    // GET BY surveyId (controller: /submission/:id)
    const getRes = await agent
      .get(`${BASE}/submission/${surveyId}`)
      .set('Authorization', `Bearer ${accessTokenA}`)
      .expect(200);

    // Hindari no-unsafe-member-access: cast body sekali
    const body = getRes.body as FindOneSubmissionResponseBody;

    expect(body).toHaveProperty('survey');
    expect(body).toHaveProperty('submission');

    const submission = body.submission;
    expect(submission.surveyId).toBe(surveyId);
    expect(String(submission.employeeId)).toBe(String(employeeIdA));
  });

  it('company A: update submission by surveyId', async () => {
    const updateRes = await agent
      .patch(`${BASE}/submission/${surveyId}`)
      .set('Authorization', `Bearer ${accessTokenA}`)
      .send({
        answers: [
          { questionId: qNumericId, type: SurveyType.RADIO, value: 1 },
          {
            questionId: qTextareaId,
            type: SurveyType.TEXTAREA,
            value: 'Diupdate',
          },
        ],
      })
      .expect(200);

    const updated = updateRes.body as SurveySubmissionResponseBody;
    expect(updated.surveyId).toBe(surveyId);
    expect(String(updated.employeeId)).toBe(String(employeeIdA));
    expect(updated.totalPoint).toBe(1);
  });

  it('company B cannot access company A submission (RBAC boundary)', async () => {
    // LIST company B tidak boleh ada submission milik employee A
    const listResB = await agent
      .get(`${BASE}/submission`)
      .set('Authorization', `Bearer ${accessTokenB}`)
      .expect(200);

    const listB = listResB.body as SurveySubmissionResponseBody[];
    const foundA = listB.find(
      (s) =>
        s.surveyId === surveyId && String(s.employeeId) === String(employeeIdA),
    );
    expect(foundA).toBeUndefined();

    // GET harus gagal (biasanya 404 atau 403)
    await agent
      .get(`${BASE}/submission/${surveyId}`)
      .set('Authorization', `Bearer ${accessTokenB}`)
      .expect((res) => {
        expect([HttpStatus.NOT_FOUND, HttpStatus.FORBIDDEN]).toContain(
          res.status,
        );
      });

    // UPDATE harus gagal (biasanya 404 atau 403)
    await agent
      .patch(`${BASE}/submission/${surveyId}`)
      .set('Authorization', `Bearer ${accessTokenB}`)
      .send({
        answers: [{ questionId: qNumericId, type: SurveyType.RADIO, value: 2 }],
      })
      .expect((res) => {
        expect([HttpStatus.NOT_FOUND, HttpStatus.FORBIDDEN]).toContain(
          res.status,
        );
      });
  });

  it('non-admin cannot delete submission (Role guard)', async () => {
    // controller: @Role(RoleEnum.ADMIN) + NO_CONTENT
    await agent
      .delete(`${BASE}/submission/${surveyId}`)
      .set('Authorization', `Bearer ${accessTokenA}`)
      .expect((res) => {
        expect([HttpStatus.FORBIDDEN, HttpStatus.UNAUTHORIZED]).toContain(
          res.status,
        );
      });
  });

  it('unauthorized cannot access submission endpoints', async () => {
    await agent.get(`${BASE}/submission`).expect(401);
    await agent.post(`${BASE}/submission`).send({}).expect(401);
  });
});
