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
      duplicates: 0,
      details: []
    }
  };

  try {
    const detection = await detectCategories(homepageUrl);

    if (onProgress) {
      onProgress({ step: 'detection', data: detection });
    }

    const source = await saveSource(detection.source);
    results.source = source;

    const categoriesToProcess = detection.categories.slice(0, maxCategoriesPerSource);

    let totalArticlesScraped = 0;

    for (let i = 0; i < categoriesToProcess.length; i++) {
      const categoryData = categoriesToProcess[i];

      try {
        const category = await saveCategory(source.id, source.domain, categoryData);
        results.categories.push(category);

        const articleUrls = await scrapeCategoryPage(categoryData.url, {
          maxPages: maxPagesPerCategory,
          maxArticles: maxArticlesPerCategory,
          baseDomain: source.domain
        });

        const articlesToScrape = articleUrls.slice(0, 
          Math.min(maxArticlesPerCategory, maxArticlesPerSource - totalArticlesScraped)
        );

        for (let j = 0; j < articlesToScrape.length; j++) {
          const articleUrl = articlesToScrape[j];
          
          try {
            const articleData = await scrapeUrl(articleUrl);
            const savedArticle = await saveArticle(articleData, source, category);
            
            results.articles.total++;
            
            if (savedArticle.isDuplicate) {
              results.articles.duplicates++;
              console.log(`[scrapeEntireSource] ⚠️  Duplicate skipped: ${articleUrl}`);
              
              results.articles.details.push({
                url: articleUrl,
                title: articleData.title,
                category: category.name,
                status: 'duplicate',
                isDuplicate: true
              });
            } else {
              results.articles.success++;
              totalArticlesScraped++;
              
              results.articles.details.push({
                url: articleUrl,
                title: articleData.title,
                category: category.name,
                status: 'success',
                isDuplicate: false
              });
            }

            if (totalArticlesScraped >= maxArticlesPerSource) {
              break;
            }

            await new Promise(resolve => setTimeout(resolve, 1000));

          } catch (error) {
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
      }
    }

    return results;

  } catch (error) {
    results.success = false;
    results.error = error.message;
    return results;
  }
};

const scrapeSingleCategory = async (categoryUrl, sourceData, options = {}) => {
  const {
    maxPages = 2,
    maxArticles = 20
  } = options;

  try {
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
        failed: 0,
        duplicates: 0
      }
    };

    for (const articleUrl of articleUrls) {
      try {
        const articleData = await scrapeUrl(articleUrl);
        const savedArticle = await saveArticle(articleData, source, category);
        
        results.articles.total++;
        
        if (savedArticle.isDuplicate) {
          results.articles.duplicates++;
        } else {
          results.articles.success++;
        }
      } catch (error) {
        results.articles.total++;
        results.articles.failed++;
      }
    }

    return results;

  } catch (error) {
    throw error;
  }
};

module.exports = {
  scrapeEntireSource,
  scrapeSingleCategory
};