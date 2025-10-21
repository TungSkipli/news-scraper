const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json';
const fullPath = path.resolve(__dirname, '../../', serviceAccountPath);

if (!fs.existsSync(fullPath)) {
  throw new Error(`Service account key not found at: ${fullPath}`);
}

const serviceAccount = require(fullPath);

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const app = admin.app();

module.exports = {
  admin,
  app,
  auth: admin.auth(app),
  db: admin.firestore(app),
};