
const axios = require('axios');

const API_URL = 'http://localhost:5000';

const TEST_URLS = [
  'https://vnexpress.net/10-quoc-gia-dung-dau-the-gioi-ve-suc-manh-tinh-toan-4837520.html',
  'https://vvnm.vietbao.com/',
  'https://ngoisao.vnexpress.net/',
  'https://afamily.vn/'
];

async function testScrapeUrl(url) {
  console.log('\n' + '='.repeat(80));
  console.log(`🧪 Testing: POST /scrape-url`);
  console.log(`📍 URL: ${url}`);
  console.log('='.repeat(80));

  try {
    const startTime = Date.now();
    
    const response = await axios.post(`${API_URL}/scrape-url`, {
      url: url
    }, {
      timeout: 90000 // 90 seconds
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n✅ SUCCESS!');
    console.log(`⏱️  Duration: ${duration}s`);
    console.log('\n📦 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));

    const article = response.data.data;
    console.log('\n🔍 Data Validation:');
    console.log(`  ✓ Title: ${article.title ? '✅' : '❌'} (${article.title?.length || 0} chars)`);
    console.log(`  ✓ Summary: ${article.summary ? '✅' : '❌'} (${article.summary?.length || 0} chars)`);
    console.log(`  ✓ Content: ${article.content ? '✅' : '❌'} (${article.content?.length || 0} chars)`);
    console.log(`  ✓ Authors: ${article.authors ? '✅' : '❌'}`);
    console.log(`  ✓ Image URL: ${article.image?.url ? '✅' : '❌'}`);
    console.log(`  ✓ Tags: ${article.tags?.length > 0 ? '✅' : '❌'} (${article.tags?.length || 0} tags)`);
    console.log(`  ✓ Slug: ${article.slug ? '✅' : '❌'}`);
    console.log(`  ✓ Created At: ${article.created_at ? '✅' : '❌'}`);

    return true;
  } catch (error) {
    console.log('\n❌ FAILED!');
    console.log(`Error: ${error.message}`);
    if (error.response) {
      console.log('\nResponse Data:');
      console.log(JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

async function testBatchScrape(urls) {
  console.log('\n' + '='.repeat(80));
  console.log(`🧪 Testing: POST /batch-scrape`);
  console.log(`📍 URLs: ${urls.length} items`);
  console.log('='.repeat(80));

  try {
    const startTime = Date.now();
    
    const response = await axios.post(`${API_URL}/batch-scrape`, {
      urls: urls
    }, {
      timeout: 300000 // 5 minutes
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n✅ SUCCESS!');
    console.log(`⏱️  Duration: ${duration}s`);
    console.log('\n📦 Results:');
    console.log(`  Total: ${response.data.data.total}`);
    console.log(`  Success: ${response.data.data.success}`);
    console.log(`  Failed: ${response.data.data.failed}`);

    return true;
  } catch (error) {
    console.log('\n❌ FAILED!');
    console.log(`Error: ${error.message}`);
    if (error.response) {
      console.log('\nResponse Data:');
      console.log(JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

async function main() {
  console.log('\n🚀 Universal Scraper API Test Suite');
  console.log(`🌐 API URL: ${API_URL}`);
  
  const testUrl = process.argv[2] || TEST_URLS[0];

  await testScrapeUrl(testUrl);

  console.log('\n' + '='.repeat(80));
  console.log('✅ Test completed!');
  console.log('='.repeat(80) + '\n');
}

async function checkServer() {
  try {
    await axios.get(API_URL);
    return true;
  } catch (error) {
    console.error('\n❌ Server is not running!');
    console.error(`   Please start the server first: npm start`);
    console.error(`   Server should be running at: ${API_URL}\n`);
    return false;
  }
}

(async () => {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await main();
  }
  process.exit(0);
})();