import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSurveyMigration1769571795385 implements MigrationInterface {
  name = 'InitialSurveyMigration1769571795385';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // UUID generator
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ENUM for SurveyQuestion.type (must exist before table)
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
          -- IMPORTANT: sesuaikan value enum ini dengan SurveyType di src (survey.type.ts)
          CREATE TYPE "public"."survey_question_type_enum" AS ENUM ('range', 'radio', 'textarea');
        END IF;
      END$$;
    `);

    // ===== Tables =====

    // survey
    await queryRunner.query(`
      CREATE TABLE "survey" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying(255) NOT NULL,
        "description" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "PK_survey_id" PRIMARY KEY ("id")
      )
    `);

    // survey_question
    await queryRunner.query(`
      CREATE TABLE "survey_question" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "required" boolean NOT NULL,
        "title" character varying(255) NOT NULL,
        "description" text NOT NULL,
        "type" "public"."survey_question_type_enum" NOT NULL,
        "min" integer,
        "max" integer,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "surveyId" uuid,
        CONSTRAINT "PK_survey_question_id" PRIMARY KEY ("id")
      )
    `);

    // survey_question_detail
    await queryRunner.query(`
      CREATE TABLE "survey_question_detail" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying(255) NOT NULL,
        "explanation" text NOT NULL,
        "shortQuestion" character varying(255),
        "point" character varying(100) NOT NULL,
        "surveyId" uuid,
        CONSTRAINT "PK_survey_question_detail_id" PRIMARY KEY ("id")
      )
    `);

    // ===== FKs =====
    // SurveyQuestion.survey -> Survey (CASCADE delete)
    await queryRunner.query(`
      ALTER TABLE "survey_question"
      ADD CONSTRAINT "FK_survey_question_survey"
      FOREIGN KEY ("surveyId")
      REFERENCES "survey"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    // SurveyQuestionDetail.survey -> SurveyQuestion (CASCADE delete)
    await queryRunner.query(`
      ALTER TABLE "survey_question_detail"
      ADD CONSTRAINT "FK_survey_question_detail_question"
      FOREIGN KEY ("surveyId")
      REFERENCES "survey_question"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    // (Optional tapi bagus) index untuk FK
    await queryRunner.query(
      `CREATE INDEX "IDX_survey_question_surveyId" ON "survey_question" ("surveyId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_survey_question_detail_surveyId" ON "survey_question_detail" ("surveyId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // drop indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_survey_question_detail_surveyId"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_survey_question_surveyId"`,
    );

    // drop FKs
    await queryRunner.query(`
      ALTER TABLE "survey_question_detail"
      DROP CONSTRAINT IF EXISTS "FK_survey_question_detail_question"
    `);
    await queryRunner.query(`
      ALTER TABLE "survey_question"
      DROP CONSTRAINT IF EXISTS "FK_survey_question_survey"
    `);

    // drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "survey_question_detail"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "survey_question"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "survey"`);

    // drop enum type (after tables)
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."survey_question_type_enum"`,
    );
  }
}
