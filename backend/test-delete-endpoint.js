/**
 * Test Delete Endpoint
 *
 * This script tests different HTTP methods for the delete endpoint
 * to figure out which one your ChromaDB API expects.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const axios = require('axios');

const baseURL = process.env.CHROMA_API_URL;
const apiKey = process.env.CHROMA_API_KEY;
const apiKeyHeader = process.env.CHROMA_API_KEY_HEADER;

// Test collection and document
const TEST_COLLECTION = 'test_delete_collection';
const TEST_DOC_ID = 'test_doc_to_delete';

async function setupTestData() {
  console.log('\n🔧 Setting up test data...');

  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
      [apiKeyHeader]: apiKey,
    },
  });

  // Create test collection
  try {
    await client.post('/create_collection', { name: TEST_COLLECTION });
    console.log(`✅ Created collection: ${TEST_COLLECTION}`);
  } catch (error) {
    console.log(`⚠️  Collection may already exist: ${error.response?.data?.message || error.message}`);
  }

  // Add a test document to delete
  try {
    await client.post('/add_update', {
      collection_name: TEST_COLLECTION,
      id_field: 'id',
      document: { id: TEST_DOC_ID, text: 'This is a test document for deletion' },
      metadata: [],
      additional_params: {}
    });
    console.log(`✅ Added test document: ${TEST_DOC_ID}`);
  } catch (error) {
    console.log(`❌ Failed to add document: ${error.message}`);
  }
}

async function testDeleteMethod(method, useQueryParams = false) {
  console.log(`\n[TEST] Trying ${method} ${useQueryParams ? 'with query params' : 'with body'}...`);

  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
      [apiKeyHeader]: apiKey,
    },
  });

  try {
    let response;
    const payload = {
      collection_name: TEST_COLLECTION,
      id: TEST_DOC_ID,
    };

    if (useQueryParams) {
      // Use query parameters
      const params = new URLSearchParams(payload);
      response = await client.request({
        method,
        url: `/delete?${params.toString()}`,
      });
    } else {
      // Use request body
      response = await client.request({
        method,
        url: '/delete',
        data: payload,
      });
    }

    console.log(`✅ SUCCESS with ${method} ${useQueryParams ? '(query params)' : '(body)'}`);
    console.log('   Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    if (error.response) {
      console.log(`❌ ${error.response.status} ${error.response.statusText}`);
      console.log('   Error:', error.response.data?.message || error.response.data);
    } else {
      console.log(`❌ ${error.message}`);
    }
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing ChromaDB Delete Endpoint\n');
  console.log(`API URL: ${baseURL}`);
  console.log('─'.repeat(60));

  await setupTestData();

  console.log('\n' + '─'.repeat(60));
  console.log('Testing different HTTP methods...\n');

  // Test different combinations
  const tests = [
    { method: 'DELETE', queryParams: false },
    { method: 'DELETE', queryParams: true },
    { method: 'POST', queryParams: false },
    { method: 'POST', queryParams: true },
    { method: 'GET', queryParams: true },
  ];

  let successMethod = null;

  for (const test of tests) {
    const success = await testDeleteMethod(test.method, test.queryParams);
    if (success && !successMethod) {
      successMethod = test;
      break; // Stop after first success
    }
  }

  console.log('\n' + '─'.repeat(60));
  if (successMethod) {
    console.log('✅ SOLUTION FOUND!');
    console.log(`   Method: ${successMethod.method}`);
    console.log(`   Format: ${successMethod.queryParams ? 'Query Parameters' : 'Request Body'}`);
    console.log('\n💡 Update the deleteDocument method in customChroma.service.js accordingly.');
  } else {
    console.log('❌ No working method found. Please check your API documentation.');
  }
  console.log('─'.repeat(60) + '\n');
}

// Run the tests
runTests().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
