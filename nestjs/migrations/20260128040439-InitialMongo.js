/**
 * 20260128040439-InitialMongo.js
 *
 * Fix untuk error:
 *   ns does not exist: khs.survey_submissions
 *
 * Penyebab:
 *   collection.indexes() (listIndexes) dipanggil saat collection belum ada.
 *
 * Solusi:
 *   Pastikan collection dibuat dulu (idempotent) sebelum updateMany/indexes.
 */

async function ensureCollection(db, name) {
  const exists = await db.listCollections({ name }).toArray();
  if (exists.length === 0) {
    await db.createCollection(name);
  }
}

async function collectionExists(db, name) {
  const exists = await db.listCollections({ name }).toArray();
  return exists.length > 0;
}

module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    const COLLECTION = 'survey_submissions';

    // ✅ WAJIB: pastikan namespace/collection benar-benar ada
    await ensureCollection(db, COLLECTION);

    const collection = db.collection(COLLECTION);

    /**
     * 1) BACKFILL FIELD
     * totalPoint punya default 0 di schema,
     * tapi data lama belum tentu punya field ini
     */
    await collection.updateMany(
      { totalPoint: { $exists: false } },
      { $set: { totalPoint: 0 } },
    );

    /**
     * 2) INDEXES
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

    // employeeId hashed index
    if (!indexNames.has('employeeId_hashed')) {
      await collection.createIndex(
        { employeeId: 'hashed' },
        { name: 'employeeId_hashed' },
      );
    }

    // compound index untuk query umum
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
    const COLLECTION = 'survey_submissions';

    // ✅ Guard: kalau collection belum ada, tidak usah rollback (biar idempotent)
    if (!(await collectionExists(db, COLLECTION))) {
      return;
    }

    const collection = db.collection(COLLECTION);

    // Ambil index yang ada
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
