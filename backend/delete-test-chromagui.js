/**
 * Delete test_chromagui collection
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const chromaService = require('./services/customChroma.service');

async function deleteCollection() {
  console.log('🗑️  Deleting test_chromagui collection...\n');

  const result = await chromaService.deleteCollection('test_chromagui');

  if (result.success) {
    console.log('✅ Successfully deleted: test_chromagui\n');
  } else {
    console.log(`❌ Failed to delete: ${result.error}\n`);
  }

  // Verify
  const listResult = await chromaService.listCollections();
  if (listResult.success) {
    const collections = listResult.data?.collections || listResult.data || [];
    console.log(`📊 Total collections now: ${collections.length}`);
    console.log(`   Collections: ${collections.join(', ')}\n`);
  }
}

deleteCollection().catch(console.error);
