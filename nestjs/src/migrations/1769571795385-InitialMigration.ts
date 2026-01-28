import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1769571795385 implements MigrationInterface {
  name = 'InitialMigration1769571795385';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Pastikan extension uuid-ossp ada (kalau belum)
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // 1) ENUM untuk survey_question.type
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE t.typname = 'survey_question_type_enum'
            AND n.nspname = 'public'
        ) THEN
          CREATE TYPE "public"."survey_question_type_enum" AS ENUM ('range', 'radio', 'textarea');
        END IF;
      END$$;
    `);

    // 2) ENUM untuk user.role (karena dipakai di table user)
    //    Default di table: DEFAULT 'user'
    //    Kalau role kamu cuma "user" dan "admin", ini aman.
    //    Kalau ada role lain di entity, tambahkan di list ENUM ini.
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

    // ===== Tabel-tabel =====
    await queryRunner.query(
      `CREATE TABLE "forget_password" ("userId" uuid NOT NULL, "tokenHash" character varying NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "UQ_a4ef405453b324f19da15235866" UNIQUE ("tokenHash"), CONSTRAINT "PK_3a624e1f40a7285b1566e35717e" PRIMARY KEY ("userId"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "survey_question_detail" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(255) NOT NULL, "explanation" text NOT NULL, "shortQuestion" character varying(255), "point" character varying(100) NOT NULL, "surveyId" uuid, CONSTRAINT "PK_596c5e90c23e37f5a8b13d31435" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "survey_question" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "required" boolean NOT NULL, "title" character varying(255) NOT NULL, "description" text NOT NULL, "type" "public"."survey_question_type_enum" NOT NULL, "min" integer, "max" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "surveyId" uuid, CONSTRAINT "PK_ec6d65e83fd7217202178b79907" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "survey" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(255) NOT NULL, "description" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_f0da32b9181e9c02ecf0be11ed3" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "survey_submissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "employeeId" uuid NOT NULL, "surveyId" uuid NOT NULL, "userId" uuid NOT NULL, "periodMonth" date NOT NULL, "nosql" text, CONSTRAINT "PK_8c44889594bc576b9a407e8361a" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_948c4bd418a0eb3d092aab5f84" ON "survey_submissions" ("employeeId", "surveyId", "periodMonth") `,
    );

    await queryRunner.query(
      `CREATE TABLE "employees" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fullName" character varying NOT NULL, "position" character varying, "isActive" boolean NOT NULL DEFAULT true, "userId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_b9535a98350d5b26e7eb0c26af4" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying NOT NULL, "phoneNumber" character varying NOT NULL, "password" character varying NOT NULL, "refreshToken" text, "province" character varying NOT NULL, "regency" character varying NOT NULL, "district" character varying NOT NULL, "village" character varying NOT NULL, "fullAddress" character varying NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "role" "public"."user_role_enum" NOT NULL DEFAULT 'user', "deletedAt" TIMESTAMP, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "UQ_f2578043e491921209f5dadd080" UNIQUE ("phoneNumber"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );

    // ===== FK =====
    await queryRunner.query(
      `ALTER TABLE "forget_password" ADD CONSTRAINT "FK_3a624e1f40a7285b1566e35717e" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "survey_question_detail" ADD CONSTRAINT "FK_6e973734b9f2df801b773b897a6" FOREIGN KEY ("surveyId") REFERENCES "survey_question"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "survey_question" ADD CONSTRAINT "FK_036a359b4a0884d113f6232e96d" FOREIGN KEY ("surveyId") REFERENCES "survey"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "survey_submissions" ADD CONSTRAINT "FK_1d64d1e5732d1a91cece82457d9" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "survey_submissions" ADD CONSTRAINT "FK_70dd67bf35a64abd6538c8a9e5d" FOREIGN KEY ("surveyId") REFERENCES "survey"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "survey_submissions" ADD CONSTRAINT "FK_04508ff6ba93732289057385dda" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "employees" ADD CONSTRAINT "FK_737991e10350d9626f592894cef" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employees" DROP CONSTRAINT "FK_737991e10350d9626f592894cef"`,
    );
    await queryRunner.query(
      `ALTER TABLE "survey_submissions" DROP CONSTRAINT "FK_04508ff6ba93732289057385dda"`,
    );
    await queryRunner.query(
      `ALTER TABLE "survey_submissions" DROP CONSTRAINT "FK_70dd67bf35a64abd6538c8a9e5d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "survey_submissions" DROP CONSTRAINT "FK_1d64d1e5732d1a91cece82457d9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "survey_question" DROP CONSTRAINT "FK_036a359b4a0884d113f6232e96d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "survey_question_detail" DROP CONSTRAINT "FK_6e973734b9f2df801b773b897a6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "forget_password" DROP CONSTRAINT "FK_3a624e1f40a7285b1566e35717e"`,
    );

    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TABLE "employees"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_948c4bd418a0eb3d092aab5f84"`,
    );
    await queryRunner.query(`DROP TABLE "survey_submissions"`);
    await queryRunner.query(`DROP TABLE "survey"`);
    await queryRunner.query(`DROP TABLE "survey_question"`);
    await queryRunner.query(`DROP TABLE "survey_question_detail"`);
    await queryRunner.query(`DROP TABLE "forget_password"`);

    // Drop ENUM types terakhir (setelah table yang pakai dihapus)
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."survey_question_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."user_role_enum"`);
  }
}

export enum SurveyType {
  RANGE = 'range',
  RADIO = 'radio',
  TEXTAREA = 'textarea',
}
