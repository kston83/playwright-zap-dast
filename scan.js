#!/usr/bin/env node

/**
 * CLI helper for running different scan modes
 * Usage: node scan.js [mode] [options]
 */

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function showHelp() {
  console.log(`
🔒 Playwright ZAP DAST Scanner

Usage: node scan.js [mode] [options]

SCAN MODES:
  auth          Run authenticated scan only
  unauth        Run unauthenticated scan only  
  mixed         Run both authenticated and unauthenticated scans
  both          Alias for mixed mode

OPTIONS:
  --headless    Run in headless mode (no browser UI)
  --limit=N     Scan only first N URLs
  --include=X   Include only URLs matching regex pattern X
  --exclude=X   Exclude URLs matching regex pattern X
  --urls=FILE   Use custom URL file instead of default selection
  --localhost   Quick setup for localhost:3000 scanning
  --help, -h    Show this help message

EXAMPLES:
  node scan.js auth                           # Authenticated scan
  node scan.js unauth --headless              # Unauthenticated headless scan
  node scan.js mixed --limit=5                # Mixed mode, first 5 URLs only
  node scan.js auth --include=admin           # Only scan admin pages
  node scan.js unauth --exclude=api           # Exclude API endpoints
  node scan.js unauth --localhost             # Quick localhost:3000 scan
  node scan.js unauth --urls=urls-local.txt   # Use custom URL file

ENVIRONMENT FILES:
  .env                    Main configuration
  urls.txt               Default URLs  
  urls-authenticated.txt  Protected URLs requiring login
  urls-unauthenticated.txt Public URLs (no login required)
`);
}

function runScan(mode, options = {}) {
  const env = { ...process.env };
  
  // Set scan mode
  switch (mode) {
    case 'auth':
    case 'authenticated':
      env.USE_AUTHENTICATION = 'true';
      break;
    case 'unauth':
    case 'unauthenticated':
      env.USE_AUTHENTICATION = 'false';
      break;
    case 'mixed':
    case 'both':
      env.USE_AUTHENTICATION = 'mixed';
      break;
    default:
      console.error(`❌ Unknown scan mode: ${mode}`);
      console.log('Valid modes: auth, unauth, mixed');
      process.exit(1);
  }
  
  // Set options
  if (options.headless) {
    env.HEADLESS = 'true';
  }
  
  if (options.limit) {
    env.URL_LIMIT = options.limit.toString();
  }
  
  if (options.include) {
    env.URL_INCLUDE_PATTERN = options.include;
  }
  
  if (options.exclude) {
    env.URL_EXCLUDE_PATTERN = options.exclude;
  }
  
  if (options.urls) {
    env.URLS_FILE = options.urls;
  }
  
  if (options.localhost) {
    // Create temporary localhost URL file
    const localhostUrls = 'http://localhost:3000/\n';
    fs.writeFileSync('urls-localhost-temp.txt', localhostUrls);
    env.URLS_FILE = 'urls-localhost-temp.txt';
    console.log('📝 Created temporary localhost URL file');
  }
  
  console.log(`🚀 Starting ${mode} scan...`);
  
  // Run the scan
  const child = spawn('npm', ['run', 'zapTest'], {
    env,
    stdio: 'inherit',
    shell: true
  });
  
  child.on('close', (code) => {
    // Clean up temporary localhost file if created
    if (options.localhost && fs.existsSync('urls-localhost-temp.txt')) {
      fs.unlinkSync('urls-localhost-temp.txt');
      console.log('🗑️  Cleaned up temporary URL file');
    }
    
    if (code === 0) {
      console.log('✅ Scan completed successfully');
      console.log('📊 Run "npm run generateCSV" to create consolidated reports');
    } else {
      console.error(`❌ Scan failed with exit code ${code}`);
      process.exit(code);
    }
  });
  
  child.on('error', (error) => {
    console.error('❌ Failed to start scan:', error);
    process.exit(1);
  });
}

function validateSetup() {
  // Check if required files exist
  const requiredFiles = ['package.json', 'src/runZap.spec.js'];
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    console.error('❌ Missing required files:', missingFiles.join(', '));
    console.log('Make sure you\'re running this from the project root directory');
    process.exit(1);
  }
  
  // Check if .env exists
  if (!fs.existsSync('.env')) {
    console.log('⚠️  No .env file found. Copy .env.example to .env and configure it.');
  }
  
  // Check if URL files exist
  const hasDefaultUrls = fs.existsSync('urls.txt');
  const hasAuthUrls = fs.existsSync('urls-authenticated.txt'); 
  const hasUnauthUrls = fs.existsSync('urls-unauthenticated.txt');
  
  if (!hasDefaultUrls && !hasAuthUrls && !hasUnauthUrls) {
    console.error('❌ No URL files found. Create at least one of: urls.txt, urls-authenticated.txt, urls-unauthenticated.txt');
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

const mode = args[0];
const options = {};

// Parse options
for (const arg of args.slice(1)) {
  if (arg === '--headless') {
    options.headless = true;
  } else if (arg === '--localhost') {
    options.localhost = true;
  } else if (arg.startsWith('--limit=')) {
    options.limit = Number.parseInt(arg.split('=')[1]);
  } else if (arg.startsWith('--include=')) {
    options.include = arg.split('=')[1];
  } else if (arg.startsWith('--exclude=')) {
    options.exclude = arg.split('=')[1];
  } else if (arg.startsWith('--urls=')) {
    options.urls = arg.split('=')[1];
  } else {
    console.error(`❌ Unknown option: ${arg}`);
    console.log('Run "node scan.js --help" for usage information');
    process.exit(1);
  }
}

// Validate setup and run scan
validateSetup();
runScan(mode, options);