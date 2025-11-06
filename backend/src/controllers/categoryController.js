const { db } = require('../config/firebase');
const { createSlug } = require('../utils/slugGenerator');

const COLLECTIONS = {
  CATEGORIES: 'categories'
};

const exportCategories = async (req, res, next) => {
  try {
    const snapshot = await db
      .collection(COLLECTIONS.CATEGORIES)
      .get();

    const categories = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        slug: data.slug,
        url: data.url,
        source_domain: data.source_domain,
        source_id: data.source_id,
        total_articles: data.total_articles || 0
      };
    });

    categories.sort((a, b) => (b.total_articles || 0) - (a.total_articles || 0));

    res.json({
      success: true,
      message: `Exported ${categories.length} categories`,
      data: {
        categories,
        count: categories.length,
        exported_at: Date.now()
      }
    });
  } catch (error) {
    console.error('[exportCategories] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to export categories',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, url, source_id, source_domain } = req.body;

    if (!name || !source_id || !source_domain) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, source_id, source_domain'
      });
    }

    const slug = createSlug(name);

    const existingCategory = await db
      .collection(COLLECTIONS.CATEGORIES)
      .where('source_id', '==', source_id)
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (!existingCategory.empty) {
      const existingDoc = existingCategory.docs[0];
      return res.json({
        success: true,
        message: 'Category already exists',
        data: {
          id: existingDoc.id,
          ...existingDoc.data(),
          isDuplicate: true
        }
      });
    }

    const newCategory = {
      source_id,
      source_domain,
      name,
      slug,
      url: url || '',
      total_articles: 0,
      last_scraped_at: Date.now(),
      created_at: Date.now()
    };

    const docRef = await db.collection(COLLECTIONS.CATEGORIES).add(newCategory);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        id: docRef.id,
        ...newCategory,
        isDuplicate: false
      }
    });
  } catch (error) {
    console.error('[createCategory] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create category',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = {
  exportCategories,
  createCategory
};
