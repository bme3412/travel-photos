#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

// Load heic-convert at the top level
let heicConvert;
try {
  heicConvert = require('heic-convert');
} catch {
  console.error('✗ Error: heic-convert module not found.');
  console.error('Please install it with: npm install heic-convert');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function convertHeicToJpeg(filePath, skipExisting = true) {
  try {
    const outputPath = filePath.replace(/\.HEIC$/i, '.jpg');
    
    // Check if output file already exists
    if (skipExisting) {
      try {
        await fs.access(outputPath);
        console.log(`⊘ Skipped: ${path.basename(filePath)} (JPG already exists)`);
        return { success: true, skipped: true };
      } catch {
        // File doesn't exist, continue with conversion
      }
    }

    console.log(`Converting: ${path.basename(filePath)} -> ${path.basename(outputPath)}`);

    const inputBuffer = await fs.readFile(filePath);
    const jpegBuffer = await heicConvert({
      buffer: inputBuffer,
      format: 'JPEG',
      quality: 0.85
    });

    await fs.writeFile(outputPath, jpegBuffer);
    console.log(`✓ Converted: ${path.basename(filePath)}`);
    return { success: true, skipped: false, outputPath };
  } catch (error) {
    console.error(`✗ Error converting ${path.basename(filePath)}:`, error.message);
    return { success: false, skipped: false };
  }
}

async function main() {
  console.log('\n📸 HEIC to JPG Converter\n');
  
  const folderPath = await question('Enter folder path with HEIC files: ');
  const fullPath = path.resolve(folderPath.trim());

  try {
    // Validate folder exists
    try {
      const stats = await fs.stat(fullPath);
      if (!stats.isDirectory()) {
        console.error('✗ Error: Path is not a directory');
        rl.close();
        return;
      }
    } catch {
      console.error('✗ Error: Folder does not exist');
      rl.close();
      return;
    }

    const files = await fs.readdir(fullPath);
    const heicFiles = files.filter(f => f.toUpperCase().endsWith('.HEIC'));

    if (heicFiles.length === 0) {
      console.log('✓ No HEIC files found in directory');
      rl.close();
      return;
    }

    console.log(`\nFound ${heicFiles.length} HEIC file(s)\n`);

    // Ask if user wants to skip existing JPGs
    const skipAnswer = await question('Skip files that already have JPG versions? (Y/n): ');
    const skipExisting = skipAnswer.trim().toLowerCase() !== 'n';

    let convertedCount = 0;
    let skippedCount = 0;
    const convertedFiles = [];

    for (const file of heicFiles) {
      const filePath = path.join(fullPath, file);
      const result = await convertHeicToJpeg(filePath, skipExisting);
      if (result.success && !result.skipped) {
        convertedCount++;
        convertedFiles.push(filePath);
      } else if (result.skipped) {
        skippedCount++;
      }
    }

    console.log(`\n✨ Conversion complete!`);
    console.log(`   Converted: ${convertedCount} files`);
    if (skippedCount > 0) {
      console.log(`   Skipped: ${skippedCount} files (already had JPG versions)`);
    }

    // Ask if user wants to delete original HEIC files
    if (convertedCount > 0) {
      const deleteAnswer = await question('\nDelete original HEIC files? (y/N): ');
      if (deleteAnswer.trim().toLowerCase() === 'y') {
        let deletedCount = 0;
        for (const filePath of convertedFiles) {
          try {
            await fs.unlink(filePath);
            console.log(`🗑️  Deleted: ${path.basename(filePath)}`);
            deletedCount++;
          } catch (error) {
            console.error(`✗ Failed to delete ${path.basename(filePath)}:`, error.message);
          }
        }
        console.log(`\n✓ Deleted ${deletedCount} HEIC file(s)`);
      }
    }

    console.log('\nNow you can run: npm run add-photos\n');

  } catch (error) {
    console.error('✗ Error:', error.message);
  } finally {
    rl.close();
  }
}

main().catch(console.error);

