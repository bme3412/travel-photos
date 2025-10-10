#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function checkFiles() {
  const folderPath = await question('Enter folder path: ');
  const fullPath = path.resolve(folderPath.trim());

  try {
    const files = await fs.readdir(fullPath);
    const heicFiles = files.filter(f => f.toUpperCase().endsWith('.HEIC'));
    const jpgFiles = files.filter(f => f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.jpeg'));
    
    console.log(`\n📊 Folder contents:`);
    console.log(`  HEIC files: ${heicFiles.length}`);
    console.log(`  JPG files: ${jpgFiles.length}`);
    console.log(`  Total: ${files.length} files`);
    
    if (heicFiles.length > 0) {
      console.log(`\n⚠️  You still have ${heicFiles.length} HEIC files to convert`);
      console.log(`\nRun: npm run convert-folder`);
    } else {
      console.log(`\n✅ All files are JPG - ready to upload!`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    rl.close();
  }
}

checkFiles();

