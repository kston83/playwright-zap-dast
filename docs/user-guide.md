# Playwright ZAP DAST User Guide

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

### Key Features

✅ **Authenticated Scanning**: Automatically login and maintain user sessions during scans  
✅ **Multi-URL Support**: Scan multiple application pages from a simple text file  
✅ **Comprehensive Reports**: Generate detailed HTML reports and consolidated CSV summaries  
✅ **CI/CD Integration**: Ready-to-use GitHub Actions workflow for automated security testing  
✅ **Framework Support**: Built-in support for Angular, React, Vue, and Bootstrap applications  

### Use Cases

- **Development Security**: Integrate security testing into development workflows
- **QA Testing**: Automated security validation during testing phases  
- **Compliance Audits**: Regular security assessments for compliance requirements
- **Penetration Testing**: Automated preliminary scans before manual testing

## Quick Start

### 30-Second Setup
```bash
# 1. Clone and install
git clone <repository-url>
cd playwright-zap-dast
npm install
npx playwright install

# 2. Start OWASP ZAP (separate terminal)
docker run -u zap -p 127.0.0.1:8888:8888 -d owasp/zap2docker-stable zap.sh -daemon -host 0.0.0.0 -port 8888 -config api.disablekey=true

# 3. Configure environment
cp .env.example .env  # Edit with your credentials

# 4. Add URLs to scan
echo "https://your-app.com/login" >> urls.txt

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
git clone https://github.com/your-org/playwright-zap-dast.git
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
# Application Authentication
LOGIN_URL=https://your-app.com/login
LOGIN_EMAIL=test-user@example.com
LOGIN_PASSWORD=your-secure-password
COMMON_SELECTOR=.dashboard-content  # Element that appears after successful login

# ZAP Configuration
ZAP_PROXY=http://localhost:8888
ZAP_API_KEY=                        # Optional: Leave empty if api.disablekey=true
BASE_URL=https://your-app.com

# Browser Configuration  
HEADLESS=false                      # Set to 'true' for CI/CD environments
BROWSER_TIMEOUT=60000               # Browser timeout in milliseconds

# Scan Mode Configuration
USE_AUTHENTICATION=true             # Options: true, false, mixed
SPIDER_TIMEOUT=300000              # Spider scan timeout (5 minutes)
ACTIVE_SCAN_TIMEOUT=600000         # Active scan timeout (10 minutes)  
SCAN_DELAY=5000                    # Delay between scans in milliseconds

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
   - Navigates to login URL
   - Performs authentication
   - Saves session state to `storageState.json`

2. **URL Processing** (`runZap.spec.js`)
   - Reads URLs from `urls.txt`
   - Launches browser with ZAP proxy configuration
   - Iterates through each URL

3. **Security Scanning** (for each URL)
   - **Spider Scan**: Discovers links and application structure
   - **Active Scan**: Performs vulnerability testing and attack simulations
   - **Report Generation**: Creates detailed HTML report

4. **Cleanup**
   - Closes browser sessions
   - Shuts down ZAP sessions
   - Organizes output files

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

### Custom Scan Profiles

You can customize ZAP scan behavior by modifying the scan functions:

```javascript
// In src/ZAPFuns/runActiveScan.js
// Add custom scan policies or exclusions
const scanPolicy = {
  // Custom scanning rules
  excludePatterns: ['.*logout.*', '.*delete.*'],
  includePatterns: ['.*api.*', '.*admin.*']
};
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

The tool includes a convenient CLI helper for running different scan modes:

```bash
# Quick scan commands
npm run scan auth                    # Authenticated scan
npm run scan unauth                  # Unauthenticated scan  
npm run scan mixed                   # Both modes

# With options
node scan.js auth --headless         # Headless authenticated scan
node scan.js unauth --limit=5        # First 5 URLs only
node scan.js mixed --include=admin   # Only admin pages
node scan.js auth --exclude=logout   # Exclude logout pages

# Help
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
```

**Solutions:**
- Verify login credentials in `.env` file
- Check `COMMON_SELECTOR` matches post-login page element
- Increase timeout in `playwright.config.ts`
- Test manual login with same credentials

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
```

**Solutions:**
- Increase Node.js memory: `NODE_OPTIONS="--max-old-space-size=4096" npm run zapTest`
- Reduce concurrent scans
- Process URLs in smaller batches
- Close browser instances between scans

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

**Q: How long does a typical scan take?**
A: Scan duration depends on several factors:
- Number of URLs (5-60 minutes per URL)
- Application complexity and size
- Network latency and server response times
- Scan depth and policy configuration

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
- [Project GitHub Repository](https://github.com/your-org/playwright-zap-dast)

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

**Document Version:** 1.0  
**Last Updated:** October 23, 2025  
**Compatibility:** Node.js 18+, OWASP ZAP 2.11+, Playwright 1.55+