#!/usr/bin/env node

/**
 * Migration script to move files from public/uploads to secure-uploads
 * This script should be run ONCE to migrate existing files
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PUBLIC_UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
const SECURE_UPLOADS_DIR = path.join(process.cwd(), 'secure-uploads');

async function migrateFiles() {
  console.log('🚀 Starting file migration...');
  
  try {
    // Ensure secure directory exists
    if (!fs.existsSync(SECURE_UPLOADS_DIR)) {
      fs.mkdirSync(SECURE_UPLOADS_DIR, { recursive: true });
      console.log('✅ Created secure-uploads directory');
    }

    // Get all files in public uploads (excluding AIS.jpg logo)
    const files = fs.readdirSync(PUBLIC_UPLOADS_DIR)
      .filter(file => file !== 'AIS.jpg' && file !== '.DS_Store');

    if (files.length === 0) {
      console.log('ℹ️  No files to migrate');
      return;
    }

    console.log(`📁 Found ${files.length} files to migrate`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const file of files) {
      try {
        const sourcePath = path.join(PUBLIC_UPLOADS_DIR, file);
        const destPath = path.join(SECURE_UPLOADS_DIR, file);

        // Move file to secure location
        fs.renameSync(sourcePath, destPath);
        
        console.log(`✅ Migrated: ${file}`);
        migratedCount++;

        // Update database record if it exists
        try {
          await prisma.upload.updateMany({
            where: {
              imagePath: {
                contains: file
              }
            },
            data: {
              imagePath: `/api/secure-file/${file}`
            }
          });
        } catch (dbError) {
          console.log(`⚠️  Database update failed for ${file}:`, dbError.message);
        }

      } catch (error) {
        console.error(`❌ Failed to migrate ${file}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successfully migrated: ${migratedCount} files`);
    console.log(`❌ Failed to migrate: ${errorCount} files`);
    
    if (errorCount === 0) {
      console.log('\n🎉 All files migrated successfully!');
      console.log('💡 You can now safely delete the public/uploads folder');
    } else {
      console.log('\n⚠️  Some files failed to migrate. Check the logs above.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateFiles().catch(console.error);
