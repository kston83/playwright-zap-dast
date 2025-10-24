# Playwright ZAP DAST User Guide

## Quick Reference

**Common Commands:**
```bash
# Scan modes
npm run zapTest                      # Default (authenticated if configured)
npm run zapTest:auth                 # Authenticated only
npm run zapTest:unauth               # Unauthenticated only
npm run zapTest:mixed                # Both modes

# CLI helper
node scan.js auth                    # Authenticated scan
node scan.js unauth --localhost      # Quick localhost scan
node scan.js mixed --limit=10        # Mixed mode, 10 URLs

# Generate reports
npm run generateCSV                  # Create CSV summary

# Setup
npx playwright install               # Install browsers
npm run scan:help                    # Show CLI help
```

**Key Files:**
- `.env` - Credentials and configuration
- `urls.txt` - Default URLs to scan
- `urls-authenticated.txt` - Protected pages
- `urls-unauthenticated.txt` - Public pages
- `storageState.json` - Saved auth session
- `Output/` - HTML scan reports
- `playwright.config.ts` - Playwright settings

**Quick Troubleshooting:**
- ZAP not running? `docker run -u zap -p 127.0.0.1:8888:8888 -d owasp/zap2docker-stable ...`
- Auth failing? Check `.env` credentials and `COMMON_SELECTOR`
- No `storageState.json`? Run global setup or use unauthenticated mode
- Memory issues? Use `NODE_OPTIONS="--max-old-space-size=4096"`

---

## Table of Contents
1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Prerequisites](#prerequisites)
4. [Installation & Setup](#installation--setup)
5. [Configuration](#configuration)
6. [Running Security Scans](#running-security-scans)
7. [Understanding Reports](#understanding-reports)
8. [Advanced Usage](#advanced-usage)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)
11. [FAQ](#faq)

## Overview

The Playwright ZAP DAST (Dynamic Application Security Testing) tool is an automated security testing solution that combines:

- **Playwright**: For browser automation and authenticated web application navigation
- **OWASP ZAP**: For comprehensive vulnerability scanning and security testing
- **Automated Reporting**: Generate detailed HTML and CSV reports for security analysis

This tool enables security teams, QA engineers, and developers to perform automated penetration testing on web applications with authenticated user sessions.

### Architecture: How Playwright and ZAP Work Together

This tool uses a **proxy-based architecture** where Playwright and ZAP collaborate:

```
┌─────────────────────────────────────────────────────────────┐
│                    Scan Orchestration                        │
│                   (runZap.spec.js)                          │
└────────────┬───────────────────────────────┬────────────────┘
             │                               │
             ▼                               ▼
    ┌────────────────┐              ┌────────────────┐
    │   Playwright   │◄────────────►│   OWASP ZAP    │
    │    Browser     │   Proxies    │  (Port 8888)   │
    │  Automation    │   Traffic    │                │
    └────────┬───────┘              └────────┬───────┘
             │                               │
             ▼                               ▼
    ┌────────────────┐              ┌────────────────┐
    │ Authentication │              │  Spider Scan   │
    │ storageState   │              │  Active Scan   │
    │    .json       │              │  Report Gen    │
    └────────────────┘              └────────────────┘
```

**Key Points:**
1. **Playwright's Role**: 
   - Handles complex authentication flows (login forms, MFA, CSRF tokens)
   - Maintains authenticated browser sessions via `storageState.json`
   - Navigates to URLs with full JavaScript execution
   - Routes all traffic through ZAP proxy

2. **ZAP's Role**:
   - Passively monitors all HTTP traffic from Playwright
   - Actively scans for vulnerabilities (XSS, SQLi, etc.)
   - Generates security reports with findings

3. **Why Both Are Needed**:
   - ZAP alone struggles with modern auth (forms, CSRF, JavaScript)
   - Playwright alone doesn't perform security testing
   - Together: Playwright authenticates, ZAP scans authenticated pages

### Key Features

✅ **Authenticated Scanning**: Automatically login and maintain user sessions during scans  
✅ **Multi-URL Support**: Scan multiple application pages from simple text files  
✅ **Comprehensive Reports**: Generate detailed HTML reports and consolidated CSV summaries  
✅ **CI/CD Integration**: Ready-to-use workflow for automated security testing  
✅ **Multiple Scan Modes**: Authenticated, unauthenticated, or mixed mode scanning
✅ **Framework Support**: Built-in support for Angular, React, Vue, and Bootstrap applications  
✅ **Flexible URL Management**: Separate URL files for different scan scenarios  

### Use Cases

- **Development Security**: Integrate security testing into development workflows
- **QA Testing**: Automated security validation during testing phases  
- **Compliance Audits**: Regular security assessments for compliance requirements
- **Penetration Testing**: Automated preliminary scans before manual testing

## Quick Start

### 30-Second Setup
```bash
# 1. Clone and install
git clone https://github.com/kston83/playwright-zap-dast.git
cd playwright-zap-dast
npm install
npx playwright install

# 2. Start OWASP ZAP (separate terminal)
docker run -u zap -p 127.0.0.1:8888:8888 -d owasp/zap2docker-stable zap.sh -daemon -host 0.0.0.0 -port 8888 -config api.disablekey=true

# 3. Configure environment
touch .env  # Add your credentials (see Configuration section)

# 4. Add URLs to scan
echo "https://your-app.com/" >> urls.txt

# 5. Run scan
npm run zapTest
```

## Prerequisites

### System Requirements
- **Node.js**: Version 18 or higher
- **npm**: Version 8 or higher  
- **Operating System**: Windows, macOS, or Linux
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Network**: Access to target applications and OWASP ZAP instance

### Required Software
- **OWASP ZAP**: Either installed locally or running as Docker container
- **Playwright Browsers**: Automatically installed via `npx playwright install`
- **Git**: For version control and repository management

## Installation & Setup

### Step 1: Repository Setup
```bash
# Clone the repository
git clone https://github.com/kston83/playwright-zap-dast.git
cd playwright-zap-dast

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Step 2: OWASP ZAP Installation

#### Option A: Docker (Recommended)
```bash
# Start ZAP daemon in Docker
docker run -u zap -p 127.0.0.1:8888:8888 -d owasp/zap2docker-stable \
  zap.sh -daemon -host 0.0.0.0 -port 8888 -config api.disablekey=true
```

#### Option B: Native Installation

**Windows:**
1. Download ZAP from [official website](https://www.zaproxy.org/download/)
2. Install to default location: `C:\Program Files\ZAP\Zed Attack Proxy\`
3. Start ZAP daemon:
```cmd
cd "C:\Program Files\ZAP\Zed Attack Proxy"
zap.bat -daemon -host 127.0.0.1 -port 8888 -config api.disablekey=true
```

**macOS/Linux:**
```bash
# Extract ZAP to /opt/zap (or your preferred location)
# Start ZAP daemon
/opt/zap/zap.sh -daemon -host 127.0.0.1 -port 8888 -config api.disablekey=true
```

### Step 3: Verify Installation
```bash
# Check ZAP is running
curl http://localhost:8888/JSON/core/view/version/

# Test Playwright installation
npx playwright --version
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# Application Authentication (Required for authenticated scans)
LOGIN_URL=https://your-app.com/login
LOGIN_EMAIL=test-user@example.com
LOGIN_PASSWORD=your-secure-password
COMMON_SELECTOR=.dashboard-content  # Element that appears after successful login

# ZAP Configuration (Required)
ZAP_PROXY=http://localhost:8888

# Browser Configuration (Optional)
HEADLESS=false                      # Set to 'true' for CI/CD environments
BASE_URL=https://your-app.com

# Scan Mode Configuration (Optional - defaults shown)
USE_AUTHENTICATION=true             # Options: true, false, mixed
URLS_FILE=                          # Custom URL file path (optional)

# URL Filtering (Optional)
URL_INCLUDE_PATTERN=               # Regex to include specific URLs
URL_EXCLUDE_PATTERN=               # Regex to exclude specific URLs
URL_LIMIT=                         # Limit number of URLs to scan
```

### URL Configuration

The tool supports different URL files based on scan mode:

#### Default Configuration (`urls.txt`)
```plaintext
# Add one URL per line - used for all modes if specific files don't exist
https://your-app.com/dashboard
https://your-app.com/admin/users
https://your-app.com/reports/financial
https://your-app.com/settings/profile
```

#### Authenticated URLs (`urls-authenticated.txt`)
```plaintext
# Protected pages that require login
https://your-app.com/dashboard
https://your-app.com/admin/users
https://your-app.com/finance/reports
https://your-app.com/profile/settings
```

#### Unauthenticated URLs (`urls-unauthenticated.txt`)
```plaintext
# Public pages that don't require authentication
https://your-app.com/
https://your-app.com/login
https://your-app.com/about
https://your-app.com/contact
https://your-app.com/help
https://your-app.com/api/public/health
```

#### URL File Priority
1. **Authenticated Mode**: `urls-authenticated.txt` → `urls.txt`
2. **Unauthenticated Mode**: `urls-unauthenticated.txt` → `urls.txt`  
3. **Mixed Mode**: Uses both authenticated and unauthenticated files

#### URL File Features
- **Comments**: Lines starting with `#` are ignored
- **Empty Lines**: Automatically filtered out
- **Whitespace**: Leading/trailing spaces are trimmed
- **Filtering**: Support include/exclude patterns via environment variables

### Understanding What Gets Scanned

#### URL Files as "Seed URLs"
The URLs you specify in your URL files are **seed URLs** (starting points). ZAP's spider will automatically discover and scan additional pages:

**What You MUST Specify:**
- Homepage/landing pages: `https://your-app.com/`
- Login pages (if not linked): `https://your-app.com/login`
- API entry points: `https://your-app.com/api`
- Admin panels (if not reachable through navigation)
- Isolated sections not linked from main navigation

**What Gets Auto-Discovered:**
- All navigation menu links
- Footer links and secondary pages
- Form submission endpoints
- AJAX/API calls triggered by JavaScript
- Dynamic routes (React Router, Vue Router, etc.)
- Hidden form fields and endpoints
- JavaScript-generated URLs

**Example:**
If your `urls.txt` contains only:
```
https://your-app.com/
```

ZAP's spider will automatically find and scan:
- `/about`, `/contact`, `/pricing` (if linked)
- `/api/users`, `/api/products` (if called by pages)
- Dynamic routes like `/product/123`
- Form submission endpoints

**Best Practice:** Start with minimal seed URLs and let the spider discover the rest!

### Framework-Specific Configuration

The `framework-config.json` file contains selectors and configurations for different web frameworks:

```json
{
  "frameworks": {
    "angular": {
      "componentPrefixes": ["app-", "mat-", "ng-", "p-"],
      "testAttribute": "data-testid"
    },
    "react": {
      "testAttribute": "data-testid"  
    },
    "vue": {
      "componentPrefixes": ["v-", "vue-"],
      "testAttribute": "data-cy"
    }
  }
}
```

## Running Security Scans

### Basic Scan Execution

```bash
# Run complete security scan
npm run zapTest

# Generate CSV reports after scanning
npm run generateCSV
```

### Scan Process Flow

1. **Authentication Setup** (`global-setup.ts`)
   - Only runs when `USE_AUTHENTICATION` is `true` or `mixed`
   - Navigates to login URL
   - Performs authentication
   - Saves session state to `storageState.json`
   - Skipped for unauthenticated scans

2. **Browser Launch** (`runZap.spec.js`)
   - Launches Chromium with ZAP proxy configuration
   - Loads authenticated session if available
   - Configures browser to route traffic through ZAP (port 8888)

3. **URL Processing**
   - Reads URLs from appropriate file (see URL Configuration)
   - Applies filtering if `URL_INCLUDE_PATTERN` or `URL_EXCLUDE_PATTERN` set
   - Limits URLs if `URL_LIMIT` specified
   - Iterates through each URL sequentially

4. **Security Scanning** (for each URL)
   - **Navigation**: Playwright visits the URL with auth cookies
   - **Spider Scan**: ZAP discovers links and application structure
   - **Active Scan**: ZAP performs vulnerability testing (XSS, SQLi, etc.)
   - **Report Generation**: Creates detailed HTML report per URL

5. **Cleanup**
   - Closes browser sessions
   - Shuts down ZAP sessions
   - Organizes output files in `Output/` directory

### Screenshot and Video Capture

The tool includes Playwright's screenshot/video capabilities, configured for **debugging only**:

**Current Configuration** (`playwright.config.ts`):
```typescript
screenshot: 'only-on-failure',  // Captures when Playwright test fails
video: 'retain-on-failure',     // Saves video when test fails
```

**Why Minimal Capture?**
- ZAP generates comprehensive HTML reports with HTTP traffic details
- Screenshots don't add security value (ZAP cares about traffic, not visuals)
- Videos create large files with minimal benefit
- Only useful for debugging Playwright navigation issues

**When Screenshots ARE Captured:**
- Playwright navigation timeout
- Login/authentication failure
- Browser crash or error
- Test assertion failure

**Storage Location:**
- Screenshots: `test-results/` directory
- Videos: `test-results/` directory (only on failure)

**If You Want Visual Evidence:**
You can modify the configuration for audit trails:
```typescript
// In playwright.config.ts - for audit/compliance
screenshot: 'on',           // Capture every page
video: 'on',                // Record all sessions
// Warning: This creates significant storage overhead!
```

### Scan Mode Options

The tool supports three scanning modes:

#### 1. Authenticated Scanning (Default)
```bash
# Explicitly run authenticated scan
npm run zapTest:auth

# Or set environment variable
USE_AUTHENTICATION=true npm run zapTest
```

#### 2. Unauthenticated Scanning  
```bash
# Run unauthenticated scan
npm run zapTest:unauth

# Or set environment variable
USE_AUTHENTICATION=false npm run zapTest
```

#### 3. Mixed Mode Scanning
```bash
# Scan both authenticated and unauthenticated URLs
USE_AUTHENTICATION=mixed npm run zapTest
```

### Command Options

```bash
# Run with specific Playwright options
npx playwright test src/runZap.spec.js --headed --project=chromium

# Run with custom timeout
TIMEOUT=300000 npm run zapTest

# Run in headless mode (for CI/CD)
HEADLESS=true npm run zapTest

# Run with URL filtering
URL_INCLUDE_PATTERN="admin|settings" npm run zapTest
URL_EXCLUDE_PATTERN="logout|delete" npm run zapTest
```

### Monitoring Scan Progress

During scan execution, you'll see output like:
```
✅ New ZAP Session ID: 1234567890
➡️  Navigating to: https://your-app.com/dashboard
🔍 Starting Spider scan...
⚡ Starting Active scan...
📄 Generating Report for: https://your-app.com/dashboard
✅ Report Saved: Output/your-app-com_dashboard_2025-10-23T10-30-45.html
```

## Understanding Reports

### HTML Reports

Individual HTML reports are generated for each scanned URL and saved in the `Output/` directory.

**Report Structure:**
- **Executive Summary**: High-level overview of findings
- **Risk Summary Table**: Counts of issues by risk level (High, Medium, Low, Informational)
- **Detailed Alerts**: Comprehensive list of identified vulnerabilities
- **Scan Information**: Technical details about the scan process

**Risk Levels:**
- 🔴 **High**: Critical security vulnerabilities requiring immediate attention
- 🟡 **Medium**: Important security issues that should be addressed
- 🟢 **Low**: Minor security concerns or best practice violations  
- 🔵 **Informational**: Security-related observations without immediate risk

### CSV Reports

After running `npm run generateCSV`, you'll find consolidated reports in `Output/Generate/`:

**summary.csv**: Overview of all scanned URLs
```csv
url,riskLevel,numAlerts
your-app.com/dashboard,High,3
your-app.com/admin,Medium,2
your-app.com/reports,Low,1
```

**alerts.csv**: Detailed alert information
```csv
url,riskName,riskLevel,numInstances
your-app.com/dashboard,SQL Injection,High,1
your-app.com/dashboard,XSS Vulnerability,Medium,2
your-app.com/admin,Weak Authentication,Medium,1
```

### Report Analysis

**Priority Actions Based on Risk Levels:**

1. **High Risk Findings**
   - Review immediately
   - Block production deployment if possible
   - Implement fixes before next release

2. **Medium Risk Findings**
   - Schedule fixes within current sprint
   - Document in security backlog
   - Consider temporary mitigations

3. **Low/Informational Findings**
   - Address during maintenance windows
   - Include in security improvement roadmap
   - Use for security training opportunities

## Advanced Usage

### Using the CLI Helper Script

The `scan.js` helper provides convenient commands for common scenarios:

```bash
# Basic scan modes
node scan.js auth                    # Authenticated scanning only
node scan.js unauth                  # Unauthenticated scanning only
node scan.js mixed                   # Both authenticated and unauthenticated
node scan.js both                    # Alias for mixed

# With options
node scan.js unauth --headless       # Run without browser UI
node scan.js auth --limit=10         # Scan first 10 URLs only
node scan.js unauth --include=admin  # Only URLs matching "admin"
node scan.js auth --exclude=logout   # Skip URLs matching "logout"
node scan.js unauth --urls=custom.txt # Use custom URL file

# Localhost development
node scan.js unauth --localhost      # Quick localhost:3000 scan

# Get help
node scan.js --help
npm run scan:help
```

**CLI Options:**
- `--headless`: Run browser in headless mode
- `--limit=N`: Scan only first N URLs
- `--include=PATTERN`: Include only URLs matching regex pattern
- `--exclude=PATTERN`: Exclude URLs matching regex pattern  
- `--urls=FILE`: Use custom URL file
- `--localhost`: Quick setup for localhost:3000

### Custom URL Filtering

You can filter URLs without modifying the URL files:

**Environment Variable Method:**
```bash
# Include only admin pages
URL_INCLUDE_PATTERN="admin|settings" npm run zapTest

# Exclude sensitive operations
URL_EXCLUDE_PATTERN="logout|delete|remove" npm run zapTest

# Limit to first 5 URLs
URL_LIMIT=5 npm run zapTest
```

**CLI Method:**
```bash
node scan.js auth --include="admin|dashboard" --exclude="logout" --limit=10
```

### Custom Scan Profiles

Customize ZAP scan behavior by modifying scan parameters:

```javascript
// Example: Modify src/ZAPFuns/runActiveScan.js
// Adjust scan intensity or add exclusions
const scanResponse = await axios.get(`${ZAP_PROXY}/JSON/ascan/action/scan/`, {
  params: { 
    url: url, 
    recurse: true,
    inScopeOnly: false,
    scanPolicyName: 'Default Policy',  // Use custom policy
    apikey: zapSession 
  }
});
```

### CI/CD Integration

#### GitHub Actions Example

Create `.github/workflows/security-scan.yml`:

```yaml
name: Security Scan
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: |
        npm install
        npx playwright install
        
    - name: Start OWASP ZAP
      run: |
        docker run -u zap -p 127.0.0.1:8888:8888 -d owasp/zap2docker-stable \
          zap.sh -daemon -host 0.0.0.0 -port 8888 -config api.disablekey=true
        sleep 30
        
    - name: Run Security Scan
      env:
        LOGIN_URL: ${{ secrets.LOGIN_URL }}
        LOGIN_EMAIL: ${{ secrets.LOGIN_EMAIL }}
        LOGIN_PASSWORD: ${{ secrets.LOGIN_PASSWORD }}
        HEADLESS: true
      run: |
        npm run zapTest
        npm run generateCSV
        
    - name: Upload Reports
      uses: actions/upload-artifact@v3
      with:
        name: security-reports
        path: Output/
```

### Parallel Scanning

For faster execution with multiple URLs, you can modify the scan approach:

```javascript
// Example: Parallel URL processing
const urls = getURLsList();
const batchSize = 3; // Process 3 URLs concurrently

for (let i = 0; i < urls.length; i += batchSize) {
  const batch = urls.slice(i, i + batchSize);
  await Promise.all(batch.map(url => scanUrl(url)));
}
```

### CLI Helper Script

The tool includes a convenient CLI helper (`scan.js`) for running different scan modes:

```bash
# Quick scan commands
node scan.js auth                    # Authenticated scan
node scan.js unauth                  # Unauthenticated scan  
node scan.js mixed                   # Both modes (alias: both)

# Localhost development scanning
node scan.js unauth --localhost      # Quick localhost:3000 scan
node scan.js unauth --localhost --headless

# With options
node scan.js auth --headless         # Headless authenticated scan
node scan.js unauth --limit=5        # First 5 URLs only
node scan.js mixed --include=admin   # Only admin pages
node scan.js auth --exclude=logout   # Exclude logout pages
node scan.js unauth --urls=urls-localhost.txt # Use custom URL file

# Help
node scan.js --help
# or
npm run scan:help
```

### Scan Mode Details

#### Authenticated Mode (`USE_AUTHENTICATION=true`)
- Runs `global-setup.ts` to create authenticated session
- Uses `storageState.json` for maintaining login state
- Scans protected application areas
- URL source: `urls-authenticated.txt` → `urls.txt`

#### Unauthenticated Mode (`USE_AUTHENTICATION=false`)  
- Skips authentication setup
- Scans public pages without login
- Ideal for testing login pages, marketing content, APIs
- URL source: `urls-unauthenticated.txt` → `urls.txt`

#### Mixed Mode (`USE_AUTHENTICATION=mixed`)
- Runs both authenticated and unauthenticated scans
- Comprehensive coverage of entire application surface  
- Uses separate URL files for each mode
- Longer scan times but complete coverage

### Custom Authentication

For complex authentication flows, modify `global-setup.ts`:

```javascript
// Multi-step authentication example
await page.goto(LOGIN_URL);

// Step 1: Username
await page.fill('[name="username"]', LOGIN_EMAIL);
await page.click('[type="submit"]');

// Step 2: Password  
await page.waitForSelector('[name="password"]');
await page.fill('[name="password"]', LOGIN_PASSWORD);
await page.click('[type="submit"]');

// Step 3: MFA (if required)
if (await page.isVisible('[name="mfa-code"]')) {
  await page.fill('[name="mfa-code"]', process.env.MFA_CODE);
  await page.click('[type="submit"]');
}
```

## Troubleshooting

### Common Issues

#### 1. ZAP Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:8888
```

**Solutions:**
- Verify ZAP is running: `curl http://localhost:8888/JSON/core/view/version/`
- Check port availability: `netstat -an | grep 8888`
- Restart ZAP daemon
- Check firewall/antivirus blocking connections

#### 2. Authentication Failures
```
❌ Navigation failed for https://app.com/dashboard: Timeout 60000ms exceeded
⚠️  Authentication enabled but storageState.json not found - running unauthenticated
```

**Solutions:**
- Verify login credentials in `.env` file
- Check `COMMON_SELECTOR` matches post-login page element
- Run global setup manually: `npx playwright test --config=playwright.config.ts --global-setup`
- Verify `storageState.json` exists after global setup
- Test manual login with same credentials
- Check for CAPTCHA or anti-automation measures

#### 3. Browser Launch Issues  
```
Error: Failed to launch browser
```

**Solutions:**
- Reinstall Playwright browsers: `npx playwright install --force`
- Check system dependencies: `npx playwright install-deps`
- Try different browser: modify `playwright.config.ts`

#### 4. Report Generation Failures
```
❌ Report Generation Error: Request failed with status code 500
```

**Solutions:**
- Verify ZAP session is active
- Check ZAP API accessibility
- Ensure `Output/` directory has write permissions
- Review ZAP logs for errors

#### 5. Memory Issues
```
JavaScript heap out of memory
FATAL ERROR: Reached heap limit Allocation failed
```

**Solutions:**
- Increase Node.js memory: `NODE_OPTIONS="--max-old-space-size=4096" npm run zapTest`
- Reduce number of URLs being scanned
- Use URL filtering to process in batches
- Scan in unauthenticated mode (skips global setup overhead)
- Close other applications to free memory

#### 6. storageState.json Not Found
```
⚠️  Authentication enabled but storageState.json not found - running unauthenticated
```

**Solutions:**
- This is a warning, not an error - scan will continue without auth
- Generate storageState: `USE_AUTHENTICATION=true npx playwright test --global-setup`
- Check if `.env` has correct `LOGIN_URL`, `LOGIN_EMAIL`, `LOGIN_PASSWORD`
- Verify `COMMON_SELECTOR` exists on post-login page
- For unauthenticated scans, use: `node scan.js unauth` or `USE_AUTHENTICATION=false`

### Debug Mode

Enable detailed logging by setting environment variables:

```bash
# Enable Playwright debug logs
DEBUG=pw:api npm run zapTest

# Enable verbose ZAP logging
ZAP_LOG_LEVEL=DEBUG npm run zapTest

# Enable Node.js debugging
NODE_OPTIONS="--inspect" npm run zapTest
```

### Log Analysis

Check common log locations:

- **Application logs**: Console output during execution
- **Playwright logs**: `test-results/` directory  
- **ZAP logs**: Docker container logs or ZAP installation directory
- **Browser logs**: Available in Playwright traces

### Performance Optimization

**For Large Scan Jobs:**

1. **Increase timeouts** in `playwright.config.ts`:
```javascript
export default defineConfig({
  timeout: 300 * 60 * 1000, // 5 hours for large scans
  expect: { timeout: 120000 },  // 2 minutes per expect
});
```

2. **Optimize ZAP scanning**:
   - Reduce active scan intensity
   - Use focused scan policies
   - Exclude non-essential URL patterns

3. **Resource management**:
   - Monitor memory usage during scans
   - Implement scan result cleanup
   - Use headless mode for better performance

## Best Practices

### Security Guidelines

#### 1. Credential Management
- ❌ **Never** commit credentials to version control
- ✅ Use environment variables for all sensitive data
- ✅ Use dedicated test accounts with minimal privileges
- ✅ Rotate test credentials regularly
- ✅ Use secret management tools in production environments

#### 2. Scan Targeting
- ❌ **Never** scan applications you don't own without explicit permission
- ✅ Use staging/test environments for security scans
- ✅ Inform application owners before scanning
- ✅ Respect rate limits and scan during maintenance windows
- ✅ Document scan scope and limitations

#### 3. Report Handling
- ❌ Don't share security reports through unsecured channels
- ✅ Encrypt reports containing sensitive findings
- ✅ Implement proper access controls for report storage
- ✅ Establish clear escalation procedures for critical findings

### Development Guidelines

#### 1. Code Quality
```javascript
// ✅ Good: Use proper error handling
try {
  const result = await zapClient.startScan(url);
  logger.info(`Scan started: ${result.scanId}`);
} catch (error) {
  logger.error(`Scan failed for ${url}:`, error.message);
  throw new ScanError(`Unable to start scan: ${error.message}`);
}

// ❌ Bad: Ignore errors
zapClient.startScan(url);
```

#### 2. Configuration Management
```javascript
// ✅ Good: Centralized configuration
const config = {
  zap: {
    proxy: process.env.ZAP_PROXY || 'http://localhost:8888',
    timeout: parseInt(process.env.ZAP_TIMEOUT) || 60000
  }
};

// ❌ Bad: Hardcoded values
const zapProxy = 'http://localhost:8888';
```

#### 3. Logging Standards
```javascript  
// ✅ Good: Structured logging
logger.info('Starting scan', { 
  url: targetUrl, 
  scanType: 'active',
  sessionId: zapSession 
});

// ❌ Bad: Unstructured logging with sensitive data
console.log(`Starting scan for ${url} with password ${password}`);
```

### Testing Strategy

#### 1. Scan Validation
- Test authentication flow before full scans
- Verify scan coverage with known vulnerabilities
- Validate report generation with sample data
- Test error handling with invalid inputs

#### 2. Environment Management
- Use consistent test data across environments
- Implement database state management for repeatable scans
- Document application state requirements
- Coordinate with development teams on test timing

#### 3. Continuous Improvement
- Review scan effectiveness regularly
- Update URL lists based on application changes
- Refine scan policies based on findings
- Train team members on new security patterns

### Performance Guidelines

#### 1. Resource Management
```javascript
// ✅ Good: Proper cleanup
try {
  const browser = await chromium.launch(options);
  const page = await browser.newPage();
  // ... scan operations
} finally {
  await browser?.close();
  await zapSession?.shutdown();
}
```

#### 2. Scan Optimization
- Use targeted scan policies instead of full scans
- Implement intelligent wait strategies
- Batch similar operations together
- Monitor and limit resource consumption

#### 3. Scalability Considerations
- Design for horizontal scaling in CI/CD environments
- Implement scan result caching where appropriate
- Use asynchronous operations for I/O bound tasks
- Plan for scan volume growth over time

## FAQ

### General Questions

**Q: Why does this tool use Playwright with ZAP?**
A: Playwright and ZAP serve complementary roles:
- **Playwright**: Handles complex authentication (forms, CSRF tokens, MFA), maintains sessions via `storageState.json`, executes JavaScript for SPAs, and navigates authenticated pages
- **ZAP**: Performs security testing (vulnerability scanning, attack simulations, report generation)
- **Together**: Playwright authenticates and navigates → ZAP scans the authenticated traffic

ZAP alone struggles with modern authentication flows. Playwright alone doesn't perform security testing. The combination enables comprehensive security scanning of authenticated web applications.

**Q: Can I use ZAP without Playwright?**
A: Yes, but with limitations:
- ✅ Simple HTTP Basic Authentication
- ✅ Public/unauthenticated pages
- ❌ Complex form-based login
- ❌ JavaScript-heavy single page applications
- ❌ CSRF token handling
- ❌ Multi-step authentication flows

For modern web applications, Playwright significantly enhances ZAP's capabilities.

**Q: How long does a typical scan take?**
A: Scan duration depends on several factors:
- Number of URLs (5-60 minutes per URL)
- Application complexity and size
- Network latency and server response times
- Spider depth and active scan intensity
- Number of pages discovered by spider

A single URL might take 10-30 minutes (spider + active scan).

**Q: What's the difference between authenticated, unauthenticated, and mixed mode?**
A: Each mode serves different purposes:

**Authenticated Mode** (`USE_AUTHENTICATION=true`):
- Runs `global-setup.ts` to login and create `storageState.json`
- Scans protected pages that require authentication
- Uses cookies/tokens from authenticated session
- Best for: Testing application features behind login

**Unauthenticated Mode** (`USE_AUTHENTICATION=false`):
- Skips authentication setup entirely
- Scans public pages without login
- Runs headless by default (faster)
- Best for: Testing public pages, login forms, marketing sites, APIs

**Mixed Mode** (`USE_AUTHENTICATION=mixed`):
- Runs both authenticated AND unauthenticated scans
- Uses `urls-authenticated.txt` for auth scans
- Uses `urls-unauthenticated.txt` for public scans
- Best for: Comprehensive coverage of entire application

**Q: Can I scan applications that require MFA?**
A: Yes, but you'll need to modify the authentication flow in `global-setup.ts` to handle MFA steps. Consider using test accounts with MFA disabled if possible.

**Q: Is it safe to scan production applications?**
A: Use extreme caution with production scans. OWASP ZAP active scanning can be intrusive and may:
- Generate high traffic volumes
- Submit test data through forms
- Trigger security alerts or rate limiting
- Impact application performance

Always get explicit permission and prefer staging environments.

### Technical Questions

**Q: Can I run multiple scans in parallel?**
A: The current implementation processes URLs sequentially. You can modify the code to support parallel processing, but consider:
- ZAP session management
- Resource consumption
- Target application capacity
- Network bandwidth limitations

**Q: How do I scan single-page applications (SPAs)?**
A: SPAs require special consideration:
- Ensure proper wait strategies for dynamic content loading
- Configure framework-specific selectors in `framework-config.json`
- Consider using Playwright's `waitForLoadState('networkidle')` option
- Test scan coverage manually to ensure all routes are discovered

**Q: Can I integrate with other security tools?**
A: Yes, the tool can be extended to integrate with:
- JIRA for automated ticket creation
- Slack/Teams for scan notifications  
- Security orchestration platforms (SOAR)
- Vulnerability management systems
- CI/CD pipeline tools beyond GitHub Actions

**Q: How do I customize scan policies?**
A: ZAP scan policies can be customized by:
- Creating custom policy files in ZAP
- Modifying scan parameters in the ZAP functions
- Using ZAP API calls to configure specific scan rules
- Implementing policy selection based on application type

**Q: What browsers are supported?**
A: Currently configured for Chromium, but Playwright supports:
- Chrome/Chromium
- Firefox  
- Safari (WebKit)
- Microsoft Edge

Modify `playwright.config.ts` to change browser selection.

### Troubleshooting Questions

**Q: Why is authentication failing?**
A: Common authentication issues:
- Incorrect credentials in `.env` file
- Wrong selector for login elements
- Captcha or anti-automation measures
- Session timeout during login process
- MFA requirements not handled

**Q: Why are no vulnerabilities found?**
A: Several reasons why scans might not find issues:
- Application actually has good security (great!)
- Scan policy too restrictive
- Authentication issues preventing full access
- Scan timeout before completion
- Application uses security measures that block automated testing

**Q: How do I handle dynamic content?**
A: For applications with dynamic content:
- Increase wait times in scan functions
- Use specific wait strategies (`waitForSelector`, `waitForLoadState`)
- Configure appropriate timeouts in Playwright config
- Consider using Playwright's auto-waiting features

**Q: Can I scan APIs directly?**
A: While this tool focuses on web UI scanning, you can:
- Use ZAP's API scanning capabilities directly
- Modify the tool to handle API endpoints
- Use Playwright to navigate to API documentation pages
- Consider dedicated API security testing tools for comprehensive API testing

---

## Support & Resources

### Documentation
- [OWASP ZAP Documentation](https://www.zaproxy.org/docs/)
- [Playwright Documentation](https://playwright.dev/)
- [Project GitHub Repository](https://github.com/kston83/playwright-zap-dast)

### Community
- [OWASP ZAP User Group](https://groups.google.com/g/zaproxy-users)
- [Playwright Community Discord](https://discord.gg/playwright)
- [Security Testing Best Practices](https://owasp.org/www-community/controls/)

### Getting Help
1. Check this user guide and troubleshooting section
2. Review project documentation and GitHub issues
3. Consult OWASP ZAP and Playwright official documentation
4. Engage with community forums and support channels
5. Contact your security team or system administrators

---

*This user guide covers the essential aspects of using the Playwright ZAP DAST tool. For advanced customization and development topics, refer to the refactoring plan and codebase documentation.*

**Document Version:** 1.1  
**Last Updated:** October 24, 2025  
**Compatibility:** Node.js 18+, OWASP ZAP 2.11+, Playwright 1.55+