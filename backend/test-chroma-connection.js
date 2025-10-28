/**
 * Test ChromaDB Connection
 *
 * This script tests the connection to your custom ChromaDB API
 * Run with: node backend/test-chroma-connection.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const chromaService = require('./services/customChroma.service');

async function testConnection() {
  console.log('🚀 Testing ChromaDB Connection...\n');
  console.log(`API URL: ${process.env.CHROMA_API_URL}`);
  console.log(`API Key Header: ${process.env.CHROMA_API_KEY_HEADER}`);
  console.log('─'.repeat(60));

  // Test 1: Health Check
  console.log('\n[1] Testing Health Check...');
  try {
    const healthResult = await chromaService.health();
    if (healthResult.success) {
      console.log('✅ Health check passed');
      console.log('   Response:', JSON.stringify(healthResult.data, null, 2));
    } else {
      console.log('❌ Health check failed');
      console.log('   Error:', healthResult.error);
      return; // Exit if health check fails
    }
  } catch (error) {
    console.log('❌ Health check error:', error.message);
    return;
  }

  // Test 2: List Collections
  console.log('\n[2] Testing List Collections...');
  try {
    const collectionsResult = await chromaService.listCollections();
    if (collectionsResult.success) {
      console.log('✅ List collections passed');
      console.log('   Raw response:', JSON.stringify(collectionsResult.data, null, 2));

      // Handle both {collections: [...]} and [...] formats
      const collections = collectionsResult.data.collections || collectionsResult.data;

      console.log(`   Found ${Array.isArray(collections) ? collections.length : 'unknown'} collections`);
      if (Array.isArray(collections) && collections.length > 0) {
        console.log('   Collections:', collections.slice(0, 5).join(', '));
      }
    } else {
      console.log('❌ List collections failed');
      console.log('   Error:', collectionsResult.error);
    }
  } catch (error) {
    console.log('❌ List collections error:', error.message);
  }

  // Test 3: Test with a specific collection (if exists)
  console.log('\n[3] Testing List Documents (for first collection)...');
  try {
    const collectionsResult = await chromaService.listCollections();
    if (collectionsResult.success) {
      // Handle both {collections: [...]} and [...] formats
      const collections = collectionsResult.data.collections || collectionsResult.data;

      if (Array.isArray(collections) && collections.length > 0) {
        const firstCollection = collections[0];
        console.log(`   Testing with collection: ${firstCollection}`);

        const documentsResult = await chromaService.listDocuments(firstCollection);
        if (documentsResult.success) {
          console.log('✅ List documents passed');
          console.log('   Raw response:', JSON.stringify(documentsResult.data, null, 2).substring(0, 200) + '...');
          const documents = documentsResult.data.documents || documentsResult.data || [];
          console.log(`   Found ${Array.isArray(documents) ? documents.length : 'unknown'} documents`);
        } else {
          console.log('❌ List documents failed');
          console.log('   Error:', documentsResult.error);
        }
      } else {
        console.log('⚠️  No collections found to test documents');
      }
    }
  } catch (error) {
    console.log('❌ List documents error:', error.message);
  }

  console.log('\n' + '─'.repeat(60));
  console.log('✅ Connection test complete!\n');
}

// Run the test
testConnection().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
