const { db, admin } = require('../config/firebase');
const fs = require('fs').promises;
const path = require('path');

const CATEGORIES_FILE = path.join(__dirname, '../../data/categories.json');

const ensureDataDir = async () => {
  const dataDir = path.dirname(CATEGORIES_FILE);
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
};

const loadCategoriesFromFile = async () => {
  try {
    const data = await fs.readFile(CATEGORIES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { categories: [], last_updated: null };
    }
    throw error;
  }
};

const saveCategoriestoFile = async (categories) => {
  await ensureDataDir();
  const data = {
    categories,
    last_updated: new Date().toISOString(),
    total: categories.length
  };
  await fs.writeFile(CATEGORIES_FILE, JSON.stringify(data, null, 2), 'utf-8');
};

const getAllCategories = async (req, res) => {
  try {
    const { source = 'file', force_refresh } = req.query;

    if (source === 'file' && !force_refresh) {
      const fileData = await loadCategoriesFromFile();
      
      if (fileData.categories.length > 0) {
        return res.json({
          success: true,
          message: 'Categories loaded from cache file',
          data: fileData,
          source: 'file'
        });
      }
    }

    const snapshot = await db.collection('categories').orderBy('created_at', 'desc').get();
    
    const categories = [];
    snapshot.forEach(doc => {
      categories.push({
        id: doc.id,
        ...doc.data()
      });
    });

    await saveCategoriestoFile(categories);

    res.json({
      success: true,
      message: `Categories loaded from Firestore and cached to file`,
      data: {
        categories,
        last_updated: new Date().toISOString(),
        total: categories.length
      },
      source: 'firestore'
    });
  } catch (error) {
    console.error('[getAllCategories] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load categories',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, description, keywords, examples } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    const existingSnapshot = await db.collection('categories')
      .where('name', '==', name)
      .limit(1)
      .get();

    if (!existingSnapshot.empty) {
      return res.status(400).json({
        success: false,
        message: `Category "${name}" already exists`,
        data: {
          id: existingSnapshot.docs[0].id,
          ...existingSnapshot.docs[0].data()
        }
      });
    }

    const categoryData = {
      name: name.trim(),
      description: description || '',
      keywords: keywords || [],
      examples: examples || [],
      article_count: 0,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      created_by: req.body.created_by || 'system'
    };

    const docRef = await db.collection('categories').add(categoryData);

    const newCategory = {
      id: docRef.id,
      ...categoryData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const fileData = await loadCategoriesFromFile();
    fileData.categories.push(newCategory);
    await saveCategoriestoFile(fileData.categories);

    res.json({
      success: true,
      message: 'Category created successfully',
      data: newCategory
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

const syncCategoriesFromFirestore = async (req, res) => {
  try {
    const snapshot = await db.collection('categories').orderBy('created_at', 'desc').get();
    
    const categories = [];
    snapshot.forEach(doc => {
      categories.push({
        id: doc.id,
        ...doc.data()
      });
    });

    await saveCategoriestoFile(categories);

    res.json({
      success: true,
      message: `Synced ${categories.length} categories from Firestore to file`,
      data: {
        categories,
        last_updated: new Date().toISOString(),
        total: categories.length
      }
    });
  } catch (error) {
    console.error('[syncCategoriesFromFirestore] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to sync categories',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = {
  getAllCategories,
  createCategory,
  syncCategoriesFromFirestore
};
