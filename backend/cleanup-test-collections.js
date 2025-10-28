/**
 * Cleanup Test Collections
 *
 * Deletes unwanted test collections from ChromaDB
 * Future testing will use test_collection only
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const chromaService = require('./services/customChroma.service');

const COLLECTIONS_TO_DELETE = [
  'test_delete_collection',
  'demo_test_collection'
];

async function cleanupCollections() {
  console.log('🧹 Cleaning up test collections...\n');
  console.log(`API URL: ${process.env.CHROMA_API_URL}`);
  console.log('─'.repeat(60));

  // First, list all collections to see what exists
  console.log('\n[1] Listing current collections...');
  const listResult = await chromaService.listCollections();

  if (listResult.success) {
    const collections = listResult.data?.collections || listResult.data || [];
    console.log(`✅ Found ${collections.length} total collections`);
    console.log(`   Collections: ${collections.join(', ')}\n`);
  } else {
    console.log(`❌ Failed to list collections: ${listResult.error}\n`);
    return;
  }

  // Delete each test collection
  console.log('[2] Deleting test collections...\n');

  for (const collectionName of COLLECTIONS_TO_DELETE) {
    console.log(`   🗑️  Deleting: ${collectionName}`);

    const result = await chromaService.deleteCollection(collectionName);

    if (result.success) {
      console.log(`   ✅ Successfully deleted: ${collectionName}`);
    } else {
      console.log(`   ⚠️  Could not delete ${collectionName}: ${result.error}`);
      console.log(`      (Collection may not exist - that's okay)`);
    }
  }

  // List collections again to verify
  console.log('\n[3] Verifying cleanup...');
  const verifyResult = await chromaService.listCollections();

  if (verifyResult.success) {
    const collections = verifyResult.data?.collections || verifyResult.data || [];
    console.log(`✅ Current collection count: ${collections.length}`);

    // Check if test collections still exist
    const remainingTestCollections = collections.filter(c =>
      COLLECTIONS_TO_DELETE.includes(c)
    );

    if (remainingTestCollections.length === 0) {
      console.log(`✅ All test collections cleaned up successfully!`);
    } else {
      console.log(`⚠️  Some collections still exist: ${remainingTestCollections.join(', ')}`);
    }

    console.log(`\n   Current collections: ${collections.join(', ')}`);
  }

  console.log('\n' + '═'.repeat(60));
  console.log('✅ CLEANUP COMPLETE');
  console.log('═'.repeat(60));
  console.log('\n📝 Note: Future testing will use "test_collection" only.');
  console.log('─'.repeat(60) + '\n');
}

// Run cleanup
cleanupCollections().catch(error => {
  console.error('\n❌ Cleanup error:', error.message);
  process.exit(1);
});
