/**
 * Migration Script: Fix /uploads/switcheats/ paths in DB
 *
 * This script replaces all occurrences of /uploads/switcheats/
 * with /uploads/ in the database across all relevant collections.
 *
 * Run once on the server with:
 *   node scripts/migrate-image-paths.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in .env');
    process.exit(1);
}

// All collections and their image fields to fix
const COLLECTIONS = [
    { name: 'food_categories',        fields: ['image'] },
    { name: 'food_items',             fields: ['image'] },
    { name: 'grocery_products',       fields: ['image'] },
    { name: 'grocery_categories',     fields: ['image'] },
    { name: 'accessories_products',   fields: ['image'] },
    { name: 'accessories_categories', fields: ['image'] },
    { name: 'food_restaurants',       fields: ['profileImage', 'coverImage', 'coverImages', 'menuImages'] },
    { name: 'food_addons',            fields: ['image'] },
];

const OLD_SEGMENT = /\/uploads\/switcheats\//gi;
const NEW_PREFIX  = '/uploads/';

function fixValue(value) {
    if (!value) return { changed: false, value };
    
    if (typeof value === 'string') {
        const fixed = value.replace(OLD_SEGMENT, NEW_PREFIX);
        return { changed: fixed !== value, value: fixed };
    }
    if (Array.isArray(value)) {
        let anyChanged = false;
        const fixed = value.map(item => {
            if (typeof item === 'string') {
                const f = item.replace(OLD_SEGMENT, NEW_PREFIX);
                if (f !== item) anyChanged = true;
                return f;
            }
            if (item && typeof item === 'object') {
                if (item.url) {
                    const f = item.url.replace(OLD_SEGMENT, NEW_PREFIX);
                    if (f !== item.url) { anyChanged = true; return { ...item, url: f }; }
                }
            }
            return item;
        });
        return { changed: anyChanged, value: fixed };
    }
    if (value && typeof value === 'object' && value.url) {
        const fixed = value.url.replace(OLD_SEGMENT, NEW_PREFIX);
        if (fixed !== value.url) return { changed: true, value: { ...value, url: fixed } };
    }
    return { changed: false, value };
}

async function migrateCollection(db, collectionName, fields) {
    const collection = db.collection(collectionName);
    let totalFixed = 0;

    for (const field of fields) {
        const filter = { [field]: { $regex: '/uploads/switcheats/', $options: 'i' } };
        const docs = await collection.find(filter).toArray();

        for (const doc of docs) {
            const { changed, value: newValue } = fixValue(doc[field]);
            if (changed) {
                await collection.updateOne({ _id: doc._id }, { $set: { [field]: newValue } });
                console.log(`  ✅ [${collectionName}] _id=${doc._id} field=${field}`);
                totalFixed++;
            }
        }
    }
    return totalFixed;
}

async function main() {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;
    console.log('✅ Connected!\n');

    let grandTotal = 0;

    for (const { name, fields } of COLLECTIONS) {
        console.log(`📂 Processing: ${name}`);
        const fixed = await migrateCollection(db, name, fields);
        console.log(`   → Fixed: ${fixed} record(s)\n`);
        grandTotal += fixed;
    }

    console.log(`\n🎉 Migration complete! Total fixed: ${grandTotal} record(s)`);
    if (grandTotal > 0) {
        console.log('\n⚠️  Also move physical files on your server:');
        console.log('   sudo cp -r /var/www/uploads/switcheats/* /var/www/uploads/');
        console.log('   sudo rm -rf /var/www/uploads/switcheats');
    } else {
        console.log('ℹ️  No records needed fixing — DB is already clean.');
    }

    await mongoose.disconnect();
    process.exit(0);
}

main().catch(err => {
    console.error('❌ Migration failed:', err.message);
    mongoose.disconnect();
    process.exit(1);
});
