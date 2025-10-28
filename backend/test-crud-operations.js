/**
 * Complete CRUD Operations Test
 *
 * This script tests all CRUD operations for ChromaDB:
 * - Create collection
 * - Add document
 * - Read/List documents
 * - Update document
 * - Query documents
 * - Delete document
 * - Delete collection
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const chromaService = require('./services/customChroma.service');

// Test data
const TEST_COLLECTION = 'crud_test_collection';
const TEST_DOC_1 = {
  id: 'doc_001',
  text: 'The quick brown fox jumps over the lazy dog',
  category: 'animals',
  priority: 'high'
};
const TEST_DOC_2 = {
  id: 'doc_002',
  text: 'A journey of a thousand miles begins with a single step',
  category: 'wisdom',
  priority: 'medium'
};

let testsPassed = 0;
let testsFailed = 0;

function logTest(testName, success, details = '') {
  if (success) {
    console.log(`✅ ${testName}`);
    if (details) console.log(`   ${details}`);
    testsPassed++;
  } else {
    console.log(`❌ ${testName}`);
    if (details) console.log(`   ${details}`);
    testsFailed++;
  }
}

async function cleanupTest() {
  console.log('\n🧹 Cleaning up test data...');
  try {
    await chromaService.deleteCollection(TEST_COLLECTION);
    console.log(`   Deleted ${TEST_COLLECTION}`);
  } catch (error) {
    // Collection might not exist, that's okay
  }
}

async function runCRUDTests() {
  console.log('🧪 ChromaDB CRUD Operations Test Suite\n');
  console.log(`API URL: ${process.env.CHROMA_API_URL}`);
  console.log('─'.repeat(60));

  // Cleanup before starting
  await cleanupTest();

  // TEST 1: CREATE - Create Collection
  console.log('\n[1] Testing CREATE Collection...');
  try {
    const result = await chromaService.createCollection(TEST_COLLECTION);
    logTest('Create Collection', result.success, `Collection: ${TEST_COLLECTION}`);
  } catch (error) {
    logTest('Create Collection', false, error.message);
  }

  // TEST 2: CREATE - Add Document 1
  console.log('\n[2] Testing CREATE Document (Add Document 1)...');
  try {
    const result = await chromaService.addOrUpdateDocument(
      TEST_COLLECTION,
      TEST_DOC_1,
      'id',
      ['category', 'priority']
    );
    logTest('Add Document 1', result.success, `ID: ${TEST_DOC_1.id}`);
  } catch (error) {
    logTest('Add Document 1', false, error.message);
  }

  // TEST 3: CREATE - Add Document 2
  console.log('\n[3] Testing CREATE Document (Add Document 2)...');
  try {
    const result = await chromaService.addOrUpdateDocument(
      TEST_COLLECTION,
      TEST_DOC_2,
      'id',
      ['category', 'priority']
    );
    logTest('Add Document 2', result.success, `ID: ${TEST_DOC_2.id}`);
  } catch (error) {
    logTest('Add Document 2', false, error.message);
  }

  // TEST 4: READ - List Collections
  console.log('\n[4] Testing READ Collections (List All)...');
  try {
    const result = await chromaService.listCollections();
    const collections = result.data?.collections || result.data || [];
    const found = collections.includes(TEST_COLLECTION);
    logTest('List Collections', result.success && found, `Found ${collections.length} collections, test collection present: ${found}`);
  } catch (error) {
    logTest('List Collections', false, error.message);
  }

  // TEST 5: READ - List Documents
  console.log('\n[5] Testing READ Documents (List in Collection)...');
  try {
    const result = await chromaService.listDocuments(TEST_COLLECTION);
    const documents = result.data?.documents || result.data || [];
    const count = Array.isArray(documents) ? documents.length : 0;
    logTest('List Documents', result.success && count >= 2, `Found ${count} documents`);

    if (count > 0) {
      console.log(`   Documents: ${documents.map(d => d.id || d).slice(0, 5).join(', ')}`);
    }
  } catch (error) {
    logTest('List Documents', false, error.message);
  }

  // TEST 6: UPDATE - Update Document 1
  console.log('\n[6] Testing UPDATE Document...');
  try {
    const updatedDoc = {
      ...TEST_DOC_1,
      text: 'The quick brown fox jumps over the lazy dog - UPDATED',
      priority: 'critical' // Changed from 'high'
    };
    const result = await chromaService.addOrUpdateDocument(
      TEST_COLLECTION,
      updatedDoc,
      'id',
      ['category', 'priority']
    );
    logTest('Update Document', result.success, `Updated ${TEST_DOC_1.id}`);
  } catch (error) {
    logTest('Update Document', false, error.message);
  }

  // TEST 7: QUERY - Query/Search Documents
  console.log('\n[7] Testing QUERY Documents (Similarity Search)...');
  try {
    const result = await chromaService.query(
      TEST_COLLECTION,
      'fox and dog',
      5
    );
    logTest('Query Documents', result.success, `Query returned results`);

    if (result.success) {
      const ids = result.data?.ids?.[0] || [];
      console.log(`   Found ${ids.length} results: ${ids.join(', ')}`);
    }
  } catch (error) {
    logTest('Query Documents', false, error.message);
  }

  // TEST 8: DELETE - Delete Document 1
  console.log('\n[8] Testing DELETE Document...');
  try {
    const result = await chromaService.deleteDocument(TEST_COLLECTION, TEST_DOC_1.id);
    logTest('Delete Document', result.success, `Deleted ${TEST_DOC_1.id}`);
  } catch (error) {
    logTest('Delete Document', false, error.message);
  }

  // TEST 9: READ - Verify document was deleted
  console.log('\n[9] Testing READ after DELETE (Verification)...');
  try {
    const result = await chromaService.listDocuments(TEST_COLLECTION);
    const documents = result.data?.documents || result.data || [];
    const count = Array.isArray(documents) ? documents.length : 0;
    const doc1Found = documents.some(d => (d.id || d) === TEST_DOC_1.id);

    logTest('Verify Delete', result.success && !doc1Found, `${count} documents remaining, doc_001 absent: ${!doc1Found}`);
  } catch (error) {
    logTest('Verify Delete', false, error.message);
  }

  // TEST 10: DELETE - Delete Collection
  console.log('\n[10] Testing DELETE Collection...');
  try {
    const result = await chromaService.deleteCollection(TEST_COLLECTION);
    logTest('Delete Collection', result.success, `Deleted ${TEST_COLLECTION}`);
  } catch (error) {
    logTest('Delete Collection', false, error.message);
  }

  // Final Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('═'.repeat(60));
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
  console.log('═'.repeat(60) + '\n');

  if (testsFailed === 0) {
    console.log('🎉 ALL TESTS PASSED! CRUD operations are fully functional.\n');
  } else {
    console.log('⚠️  Some tests failed. Review the errors above.\n');
  }
}

// Run the test suite
runCRUDTests().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
