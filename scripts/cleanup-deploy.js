// scripts/cleanup-deploy.js
const fs = require('fs').promises;
const path = require('path');

async function cleanup() {
  console.log('🧹 Starting deployment cleanup...');

  const directories = [
    'public/images/albums'
  ];

  for (const dir of directories) {
    try {
      const fullPath = path.join(process.cwd(), dir);
      const exists = await fs.access(fullPath).then(() => true).catch(() => false);

      if (exists) {
        const files = await fs.readdir(fullPath);
        
        for (const file of files) {
          if (file === '.gitkeep') continue;
          
          const filePath = path.join(fullPath, file);
          const stats = await fs.stat(filePath);
          
          if (stats.isDirectory()) {
            await fs.rm(filePath, { recursive: true });
            console.log(`📁 Removed directory: ${file}`);
          } else {
            await fs.unlink(filePath);
            console.log(`🗑️  Removed file: ${file}`);
          }
        }
        
        // Create .gitkeep if it doesn't exist
        const gitkeepPath = path.join(fullPath, '.gitkeep');
        const gitkeepExists = await fs.access(gitkeepPath).then(() => true).catch(() => false);
        if (!gitkeepExists) {
          await fs.writeFile(gitkeepPath, '');
          console.log('✨ Created .gitkeep file');
        }
        
        console.log(`✅ Cleaned ${dir}`);
      }
    } catch (error) {
      console.error(`❌ Error cleaning ${dir}:`, error);
    }
  }

  console.log('\n🎉 Cleanup complete! Ready for deployment.');
}

cleanup().catch(console.error);