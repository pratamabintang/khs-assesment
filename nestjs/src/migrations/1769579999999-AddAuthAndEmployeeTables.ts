import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthAndEmployeeTables1769579999999 implements MigrationInterface {
  name = 'AddAuthAndEmployeeTables1769579999999';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE t.typname = 'user_role_enum'
            AND n.nspname = 'public'
        ) THEN
          CREATE TYPE "public"."user_role_enum" AS ENUM ('user', 'admin');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "email" character varying NOT NULL,
        "phoneNumber" character varying NOT NULL,
        "password" character varying NOT NULL,
        "refreshToken" text,
        "province" character varying NOT NULL,
        "regency" character varying NOT NULL,
        "district" character varying NOT NULL,
        "village" character varying NOT NULL,
        "fullAddress" character varying NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "role" "public"."user_role_enum" NOT NULL DEFAULT 'user',
        "deletedAt" TIMESTAMP,
        CONSTRAINT "PK_user_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_email" UNIQUE ("email"),
        CONSTRAINT "UQ_user_phone" UNIQUE ("phoneNumber")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "employees" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "fullName" character varying NOT NULL,
        "position" character varying,
        "isActive" boolean NOT NULL DEFAULT true,
        "userId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "PK_employees_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "forget_password" (
        "userId" uuid NOT NULL,
        "tokenHash" character varying NOT NULL,
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "PK_forget_password_userId" PRIMARY KEY ("userId"),
        CONSTRAINT "UQ_forget_password_tokenHash" UNIQUE ("tokenHash")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "survey_submissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "employeeId" uuid NOT NULL,
        "surveyId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "periodMonth" date NOT NULL,
        "nosql" text,
        CONSTRAINT "PK_survey_submissions_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_survey_submissions_unique_period"
      ON "survey_submissions" ("employeeId", "surveyId", "periodMonth")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_employees_user'
        ) THEN
          ALTER TABLE "employees"
          ADD CONSTRAINT "FK_employees_user"
          FOREIGN KEY ("userId") REFERENCES "user"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_forget_password_user'
        ) THEN
          ALTER TABLE "forget_password"
          ADD CONSTRAINT "FK_forget_password_user"
          FOREIGN KEY ("userId") REFERENCES "user"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_survey_submissions_employee'
        ) THEN
          ALTER TABLE "survey_submissions"
          ADD CONSTRAINT "FK_survey_submissions_employee"
          FOREIGN KEY ("employeeId") REFERENCES "employees"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_survey_submissions_survey'
        ) THEN
          ALTER TABLE "survey_submissions"
          ADD CONSTRAINT "FK_survey_submissions_survey"
          FOREIGN KEY ("surveyId") REFERENCES "survey"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_survey_submissions_user'
        ) THEN
          ALTER TABLE "survey_submissions"
          ADD CONSTRAINT "FK_survey_submissions_user"
          FOREIGN KEY ("userId") REFERENCES "user"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END$$;
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_employees_userId" ON "employees" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_forget_password_userId" ON "forget_password" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_survey_submissions_employeeId" ON "survey_submissions" ("employeeId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_survey_submissions_surveyId" ON "survey_submissions" ("surveyId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_survey_submissions_userId" ON "survey_submissions" ("userId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_survey_submissions_userId"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_survey_submissions_surveyId"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_survey_submissions_employeeId"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_forget_password_userId"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_employees_userId"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_survey_submissions_unique_period"`,
    );

    await queryRunner.query(
      `ALTER TABLE "survey_submissions" DROP CONSTRAINT IF EXISTS "FK_survey_submissions_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "survey_submissions" DROP CONSTRAINT IF EXISTS "FK_survey_submissions_survey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "survey_submissions" DROP CONSTRAINT IF EXISTS "FK_survey_submissions_employee"`,
    );
    await queryRunner.query(
      `ALTER TABLE "forget_password" DROP CONSTRAINT IF EXISTS "FK_forget_password_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employees" DROP CONSTRAINT IF EXISTS "FK_employees_user"`,
    );

    await queryRunner.query(`DROP TABLE IF EXISTS "survey_submissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "forget_password"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "employees"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "public"."user_role_enum"`);
  }
}
