const { detectCategories } = require('./homepageDetector');
const { scrapeCategoryPage } = require('./categoryListScraper');
const { scrapeUrl } = require('./universalScraper');
const {
  saveSource,
  saveCategory,
  saveArticle
} = require('./sourceService');

const scrapeEntireSource = async (homepageUrl, options = {}) => {
  const {
    maxCategoriesPerSource = 5,
    maxPagesPerCategory = 2,
    maxArticlesPerCategory = 20,
    maxArticlesPerSource = 100,
    onProgress = null
  } = options;

  const results = {
    success: true,
    source: null,
    categories: [],
    articles: {
      total: 0,
      success: 0,
      failed: 0,
      details: []
    }
  };

  try {
    console.log('\n' + '='.repeat(80));
    console.log(`🚀 STARTING FULL SOURCE SCRAPING`);
    console.log(`📍 URL: ${homepageUrl}`);
    console.log('='.repeat(80) + '\n');

    console.log('📋 STEP 1: Detecting categories...');
    const detection = await detectCategories(homepageUrl);
    console.log(`✅ Detected ${detection.categories.length} categories from ${detection.source.name}\n`);

    if (onProgress) {
      onProgress({ step: 'detection', data: detection });
    }

    console.log('💾 STEP 2: Saving source to database...');
    const source = await saveSource(detection.source);
    results.source = source;
    console.log(`✅ Source saved: ${source.name} (ID: ${source.id})\n`);

    const categoriesToProcess = detection.categories.slice(0, maxCategoriesPerSource);
    console.log(`📂 STEP 3: Processing ${categoriesToProcess.length} categories...\n`);

    let totalArticlesScraped = 0;

    for (let i = 0; i < categoriesToProcess.length; i++) {
      const categoryData = categoriesToProcess[i];
      
      console.log(`\n${'─'.repeat(80)}`);
      console.log(`📁 Category ${i + 1}/${categoriesToProcess.length}: ${categoryData.name}`);
      console.log(`🔗 URL: ${categoryData.url}`);
      console.log('─'.repeat(80));

      try {
        const category = await saveCategory(source.id, source.domain, categoryData);
        results.categories.push(category);

        console.log(`🔍 Scraping article URLs from category page...`);
        const articleUrls = await scrapeCategoryPage(categoryData.url, {
          maxPages: maxPagesPerCategory,
          maxArticles: maxArticlesPerCategory,
          baseDomain: source.domain
        });

        console.log(`📝 Found ${articleUrls.length} article URLs`);

        const articlesToScrape = articleUrls.slice(0, 
          Math.min(maxArticlesPerCategory, maxArticlesPerSource - totalArticlesScraped)
        );

        console.log(`\n🎯 Scraping ${articlesToScrape.length} articles...\n`);

        for (let j = 0; j < articlesToScrape.length; j++) {
          const articleUrl = articlesToScrape[j];
          
          try {
            console.log(`  [${j + 1}/${articlesToScrape.length}] ${articleUrl.substring(0, 70)}...`);

            const articleData = await scrapeUrl(articleUrl);
            const savedArticle = await saveArticle(articleData, source, category);
            
            results.articles.total++;
            results.articles.success++;
            totalArticlesScraped++;
            
            results.articles.details.push({
              url: articleUrl,
              title: articleData.title,
              category: category.name,
              status: 'success'
            });

            console.log(`    ✅ Saved: ${articleData.title.substring(0, 50)}...`);

            if (totalArticlesScraped >= maxArticlesPerSource) {
              console.log(`\n⚠️  Reached max articles limit (${maxArticlesPerSource})`);
              break;
            }

            await new Promise(resolve => setTimeout(resolve, 1000));

          } catch (error) {
            console.log(`    ❌ Failed: ${error.message}`);
            results.articles.total++;
            results.articles.failed++;
            
            results.articles.details.push({
              url: articleUrl,
              category: category.name,
              status: 'failed',
              error: error.message
            });
          }
        }

        if (onProgress) {
          onProgress({ 
            step: 'category_complete', 
            category: category,
            articlesScraped: totalArticlesScraped 
          });
        }

        if (totalArticlesScraped >= maxArticlesPerSource) {
          break;
        }

      } catch (error) {
        console.error(`\n❌ Failed to process category ${categoryData.name}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('🎉 SCRAPING COMPLETED!');
    console.log('='.repeat(80));
    console.log(`📊 Source: ${source.name}`);
    console.log(`📁 Categories processed: ${results.categories.length}`);
    console.log(`📝 Total articles: ${results.articles.total}`);
    console.log(`✅ Successful: ${results.articles.success}`);
    console.log(`❌ Failed: ${results.articles.failed}`);
    console.log('='.repeat(80) + '\n');

    return results;

  } catch (error) {
    console.error('\n❌ SCRAPING FAILED:', error.message);
    results.success = false;
    results.error = error.message;
    return results;
  }
};

/**
 * Scrape single category
 */
const scrapeSingleCategory = async (categoryUrl, sourceData, options = {}) => {
  const {
    maxPages = 2,
    maxArticles = 20
  } = options;

  try {
    console.log(`🔍 Scraping category: ${categoryUrl}`);

    let source;
    if (sourceData.id) {
      source = sourceData;
    } else {
      source = await saveSource(sourceData);
    }

    const articleUrls = await scrapeCategoryPage(categoryUrl, {
      maxPages,
      maxArticles,
      baseDomain: source.domain
    });

    const category = await saveCategory(source.id, source.domain, {
      name: sourceData.categoryName || 'Category',
      url: categoryUrl
    });

    const results = {
      category: category,
      articles: {
        total: 0,
        success: 0,
        failed: 0
      }
    };

    for (const articleUrl of articleUrls) {
      try {
        const articleData = await scrapeUrl(articleUrl);
        await saveArticle(articleData, source, category);
        
        results.articles.total++;
        results.articles.success++;
      } catch (error) {
        results.articles.total++;
        results.articles.failed++;
      }
    }

    return results;

  } catch (error) {
    console.error('❌ Failed to scrape category:', error.message);
    throw error;
  }
};

module.exports = {
  scrapeEntireSource,
  scrapeSingleCategory
};