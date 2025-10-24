const fs = require("node:fs");
const path = require("node:path");

/**
 * Enhanced URL management for authenticated and unauthenticated scanning
 */
export function getURLsConfiguration() {
  const useAuthentication = process.env.USE_AUTHENTICATION !== 'false';
  const customUrlsFile = process.env.URLS_FILE; // Allow custom URL file
  const authUrlsFile = path.join(process.cwd(), "urls-authenticated.txt");
  const unauthUrlsFile = path.join(process.cwd(), "urls-unauthenticated.txt");
  const defaultUrlsFile = path.join(process.cwd(), "urls.txt");
  
  let urlsFile;
  let urls = [];
  
  // Determine which URL file to use
  if (customUrlsFile && fs.existsSync(customUrlsFile)) {
    // Use custom URL file if specified
    urlsFile = customUrlsFile;
    console.log(`📋 Using custom URLs from ${path.basename(customUrlsFile)}`);
  } else if (useAuthentication) {
    // Check for authenticated-specific URLs first
    if (fs.existsSync(authUrlsFile)) {
      urlsFile = authUrlsFile;
      console.log("📋 Using authenticated URLs from urls-authenticated.txt");
    } else {
      urlsFile = defaultUrlsFile;
      console.log("📋 Using default URLs for authenticated scanning");
    }
  } else if (fs.existsSync(unauthUrlsFile)) {
    // Check for unauthenticated-specific URLs first  
    urlsFile = unauthUrlsFile;
    console.log("📋 Using unauthenticated URLs from urls-unauthenticated.txt");
  } else {
    urlsFile = defaultUrlsFile;
    console.log("📋 Using default URLs for unauthenticated scanning");
  }
  
  try {
    urls = fs
      .readFileSync(urlsFile, "utf-8")
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url && !url.startsWith('#')); // Allow comments with #
      
    console.log(`✅ Loaded ${urls.length} URLs for ${useAuthentication ? 'authenticated' : 'unauthenticated'} scanning`);
  } catch (error) {
    console.error(`❌ Error reading URLs file ${urlsFile}: ${error}`);
    process.exit(1);
  }
  
  return {
    urls,
    useAuthentication,
    urlsFile: path.basename(urlsFile)
  };
}

/**
 * Get URLs with filtering options
 */
export function getFilteredURLs(options = {}) {
  const config = getURLsConfiguration();
  let { urls } = config;
  
  // Apply filters if provided
  if (options.include) {
    const includePattern = new RegExp(options.include, 'i');
    urls = urls.filter(url => includePattern.test(url));
    console.log(`🔍 Filtered to ${urls.length} URLs matching: ${options.include}`);
  }
  
  if (options.exclude) {
    const excludePattern = new RegExp(options.exclude, 'i');
    urls = urls.filter(url => !excludePattern.test(url));
    console.log(`🚫 Excluded URLs matching: ${options.exclude}, ${urls.length} URLs remaining`);
  }
  
  if (options.limit && options.limit > 0) {
    urls = urls.slice(0, options.limit);
    console.log(`📊 Limited to first ${options.limit} URLs`);
  }
  
  return {
    ...config,
    urls
  };
}