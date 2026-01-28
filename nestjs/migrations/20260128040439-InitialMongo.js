module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    const collection = db.collection('survey_submissions');

    /**
     * 1. BACKFILL FIELD
     * totalPoint punya default 0 di schema,
     * tapi data lama belum tentu punya field ini
     */
    await collection.updateMany(
      { totalPoint: { $exists: false } },
      { $set: { totalPoint: 0 } },
    );

    /**
     * 2. INDEXES
     * Sesuai schema:
     * - surveyId: index: true
     * - employeeId: index: true
     * - employeeId: hashed index (manual)
     */

    const existingIndexes = await collection.indexes();
    const indexNames = new Set(existingIndexes.map((i) => i.name));

    // surveyId index
    if (!indexNames.has('surveyId_1')) {
      await collection.createIndex({ surveyId: 1 }, { name: 'surveyId_1' });
    }

    // employeeId normal index
    if (!indexNames.has('employeeId_1')) {
      await collection.createIndex({ employeeId: 1 }, { name: 'employeeId_1' });
    }

    // employeeId hashed index (sesuai SurveySubmissionSchema.index)
    if (!indexNames.has('employeeId_hashed')) {
      await collection.createIndex(
        { employeeId: 'hashed' },
        { name: 'employeeId_hashed' },
      );
    }

    /**
     * (OPSIONAL tapi masuk akal)
     * Index compound untuk query umum:
     * findOne({ surveyId, employeeId })
     */
    if (!indexNames.has('surveyId_1_employeeId_1')) {
      await collection.createIndex(
        { surveyId: 1, employeeId: 1 },
        { name: 'surveyId_1_employeeId_1' },
      );
    }
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    const collection = db.collection('survey_submissions');
    const existingIndexes = await collection.indexes();
    const indexNames = new Set(existingIndexes.map((i) => i.name));

    // drop indexes (aman: cek dulu)
    for (const indexName of [
      'surveyId_1',
      'employeeId_1',
      'employeeId_hashed',
      'surveyId_1_employeeId_1',
    ]) {
      if (indexNames.has(indexName)) {
        await collection.dropIndex(indexName);
      }
    }

    // rollback backfill
    await collection.updateMany({}, { $unset: { totalPoint: '' } });
  },
};
