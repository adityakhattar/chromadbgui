#!/bin/bash

# ChromaGUI Backend API Test Script
# Tests all endpoints to verify functionality

BASE_URL="http://localhost:3001"

echo "======================================================"
echo "🧪 Testing ChromaGUI Backend API"
echo "======================================================"
echo ""

# Test 1: Health Check
echo "[1] Testing Health Check..."
curl -s $BASE_URL/health | python3 -m json.tool
echo ""

# Test 2: API Info
echo "[2] Testing API Info..."
curl -s $BASE_URL/api/info | python3 -m json.tool | head -30
echo ""

# Test 3: List Collections
echo "[3] Testing List Collections..."
curl -s $BASE_URL/api/chroma/collections | python3 -m json.tool
echo ""

# Test 4: Get Collection Details
echo "[4] Testing Get Collection Details (hotels_dev)..."
curl -s $BASE_URL/api/chroma/collections/hotels_dev | python3 -m json.tool | head -20
echo ""

# Test 5: List Documents (with limit)
echo "[5] Testing List Documents (hotels_dev, limit=3)..."
curl -s "$BASE_URL/api/chroma/collections/hotels_dev/documents?limit=3" | python3 -m json.tool | head -50
echo ""

echo "======================================================"
echo "✅ API Tests Complete!"
echo "======================================================"
