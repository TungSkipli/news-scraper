/**
 * Test script for Full Source Scraping System
 * 
 * Usage:
 *   node test-full-scraper.js <command> [url]
 * 
 * Commands:
 *   detect <url>  - Detect categories from homepage
 *   scrape <url>  - Scrape entire source
 *   sources       - List all sources
 *   articles      - List all articles
 * 
 * Examples:
 *   node test-full-scraper.js detect https://vvnm.vietbao.com/
 *   node test-full-scraper.js scrape https://vvnm.vietbao.com/
 *   node test-full-scraper.js sources
 *   node test-full-scraper.js articles
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000';

const TEST_SOURCES = [
  'https://vvnm.vietbao.com/',
  'https://ngoisao.vnexpress.net/',
  'https://afamily.vn/',
  'https://rangdongatlanta.com/',
  'https://tinnuocmy.asia/',
  'https://www.nguoi-viet.com/',
  'https://saigonnhonews.com/'
];

/**
 * Test detect categories
 */
async function testDetectCategories(url) {
  console.log('\n' + '='.repeat(80));
  console.log(`🔍 Testing: POST /detect-categories`);
  console.log(`📍 URL: ${url}`);
  console.log('='.repeat(80));

  try {
    const startTime = Date.now();
    
    const response = await axios.post(`${API_URL}/detect-categories`, {
      url: url
    }, {
      timeout: 60000
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n✅ SUCCESS!');
    console.log(`⏱️  Duration: ${duration}s`);
    
    const data = response.data.data;
    console.log('\n📦 Source Info:');
    console.log(`  Name: ${data.source.name}`);
    console.log(`  Domain: ${data.source.domain}`);
    console.log(`  Homepage: ${data.source.homepage_url}`);
    
    console.log(`\n📁 Categories Found: ${data.categories.length}`);
    data.categories.forEach((cat, i) => {
      console.log(`  ${i + 1}. ${cat.name}`);
      console.log(`     ${cat.url}`);
    });

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

/**
 * Test scrape entire source
 */
async function testScrapeSource(url) {
  console.log('\n' + '='.repeat(80));
  console.log(`🚀 Testing: POST /scrape-source`);
  console.log(`📍 URL: ${url}`);
  console.log('='.repeat(80));
  console.log('\n⚠️  This will take several minutes...\n');

  try {
    const startTime = Date.now();
    
    const response = await axios.post(`${API_URL}/scrape-source`, {
      url: url,
      options: {
        maxCategories: 3,      // Scrape only 3 categories for testing
        maxPages: 1,           // Only first page of each category
        maxArticlesPerCategory: 5,  // Only 5 articles per category
        maxArticles: 15        // Max 15 articles total
      }
    }, {
      timeout: 600000 // 10 minutes
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n✅ SUCCESS!');
    console.log(`⏱️  Duration: ${duration}s (${(duration / 60).toFixed(2)} minutes)`);
    
    const data = response.data.data;
    
    console.log('\n📊 Results:');
    console.log(`  Source: ${data.source.name}`);
    console.log(`  Categories: ${data.categories.length}`);
    console.log(`  Total Articles: ${data.articles.total}`);
    console.log(`  ✅ Success: ${data.articles.success}`);
    console.log(`  ❌ Failed: ${data.articles.failed}`);
    
    console.log('\n📁 Categories Scraped:');
    data.categories.forEach((cat, i) => {
      const catArticles = data.articles.details.filter(a => a.category === cat.name);
      console.log(`  ${i + 1}. ${cat.name}: ${catArticles.length} articles`);
    });

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

/**
 * Test get all sources
 */
async function testGetSources() {
  console.log('\n' + '='.repeat(80));
  console.log(`📋 Testing: GET /api/sources`);
  console.log('='.repeat(80));

  try {
    const response = await axios.get(`${API_URL}/api/sources`);

    console.log('\n✅ SUCCESS!');
    console.log(`📊 Total Sources: ${response.data.total}`);
    
    if (response.data.data.length > 0) {
      console.log('\n📰 Sources:');
      response.data.data.forEach((source, i) => {
        console.log(`\n  ${i + 1}. ${source.name}`);
        console.log(`     Domain: ${source.domain}`);
        console.log(`     Articles: ${source.total_articles}`);
        console.log(`     Categories: ${source.total_categories}`);
        console.log(`     ID: ${source.id}`);
      });
    } else {
      console.log('\n⚠️  No sources found. Run scraping first!');
    }

    return true;
  } catch (error) {
    console.log('\n❌ FAILED!');
    console.log(`Error: ${error.message}`);
    return false;
  }
}

/**
 * Test get all articles
 */
async function testGetArticles() {
  console.log('\n' + '='.repeat(80));
  console.log(`📋 Testing: GET /api/articles`);
  console.log('='.repeat(80));

  try {
    const response = await axios.get(`${API_URL}/api/articles?limit=10`);

    console.log('\n✅ SUCCESS!');
    console.log(`📊 Total Articles: ${response.data.total}`);
    
    if (response.data.data.length > 0) {
      console.log('\n📰 Recent Articles (showing 10):');
      response.data.data.forEach((article, i) => {
        console.log(`\n  ${i + 1}. ${article.title.substring(0, 60)}...`);
        console.log(`     Source: ${article.source_name}`);
        console.log(`     Category: ${article.category_name}`);
        console.log(`     ID: ${article.id}`);
      });
    } else {
      console.log('\n⚠️  No articles found. Run scraping first!');
    }

    return true;
  } catch (error) {
    console.log('\n❌ FAILED!');
    console.log(`Error: ${error.message}`);
    return false;
  }
}

/**
 * Check if server is running
 */
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

/**
 * Main function
 */
async function main() {
  console.log('\n🚀 Full Source Scraping System - Test Suite');
  console.log(`🌐 API URL: ${API_URL}\n`);
  
  const command = process.argv[2];
  const url = process.argv[3];

  if (!command) {
    console.log('Usage:');
    console.log('  node test-full-scraper.js detect <url>');
    console.log('  node test-full-scraper.js scrape <url>');
    console.log('  node test-full-scraper.js sources');
    console.log('  node test-full-scraper.js articles');
    console.log('\nExample:');
    console.log('  node test-full-scraper.js detect https://vvnm.vietbao.com/');
    return;
  }

  switch (command) {
    case 'detect':
      if (!url) {
        console.error('❌ URL is required for detect command');
        console.log('Example: node test-full-scraper.js detect https://vvnm.vietbao.com/');
        return;
      }
      await testDetectCategories(url);
      break;

    case 'scrape':
      if (!url) {
        console.error('❌ URL is required for scrape command');
        console.log('Example: node test-full-scraper.js scrape https://vvnm.vietbao.com/');
        return;
      }
      await testScrapeSource(url);
      break;

    case 'sources':
      await testGetSources();
      break;

    case 'articles':
      await testGetArticles();
      break;

    default:
      console.error(`❌ Unknown command: ${command}`);
      console.log('Available commands: detect, scrape, sources, articles');
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Test completed!');
  console.log('='.repeat(80) + '\n');
}

(async () => {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await main();
  }
  process.exit(0);
})();