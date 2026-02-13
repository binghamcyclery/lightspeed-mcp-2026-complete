import { execSync } from 'child_process';
import { readdirSync, statSync, cpSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

const uiDir = join(process.cwd(), 'src/ui');
const distDir = join(process.cwd(), 'dist/ui');

// Clean dist/ui directory
if (existsSync(distDir)) {
  rmSync(distDir, { recursive: true, force: true });
}

console.log('🔨 Building React MCP Apps...\n');

const apps = readdirSync(uiDir).filter(name => {
  const appPath = join(uiDir, name);
  return statSync(appPath).isDirectory();
});

let successCount = 0;
let failedApps = [];

apps.forEach((appName, index) => {
  const appPath = join(uiDir, appName);
  const packageJsonPath = join(appPath, 'package.json');
  const viteConfigPath = join(appPath, 'vite.config.ts');
  
  // Check if it's a Vite app
  if (!existsSync(viteConfigPath)) {
    console.log(`⏭️  Skipping ${appName} (not a Vite app)`);
    return;
  }
  
  try {
    console.log(`[${index + 1}/${apps.length}] Building ${appName}...`);
    
    // Build the app
    execSync('npx vite build', {
      cwd: appPath,
      stdio: 'inherit',
    });
    
    // Copy built files to dist/ui/{app-name}
    const appDistSrc = join(appPath, 'dist');
    const appDistDest = join(distDir, appName);
    
    if (existsSync(appDistSrc)) {
      cpSync(appDistSrc, appDistDest, { recursive: true });
      console.log(`✓ Built and copied ${appName}\n`);
      successCount++;
    }
    
  } catch (error) {
    console.error(`✗ Failed to build ${appName}:`, error.message);
    failedApps.push(appName);
  }
});

console.log('\n' + '='.repeat(50));
console.log(`✓ Successfully built ${successCount}/${apps.length} apps`);

if (failedApps.length > 0) {
  console.log(`✗ Failed apps: ${failedApps.join(', ')}`);
  process.exit(1);
}

console.log('='.repeat(50) + '\n');
