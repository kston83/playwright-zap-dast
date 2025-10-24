# Localhost Scanning Examples

## Quick localhost:3000 Unauthenticated Scan

### Method 1: Using CLI Helper (Easiest)
```bash
# One-command localhost scan
node scan.js unauth --localhost

# With additional options
node scan.js unauth --localhost --headless --limit=20
```

### Method 2: Using Custom URL File
```bash
# Create localhost URL file
echo "http://localhost:3000/" > urls-localhost.txt

# Scan using custom file
node scan.js unauth --urls=urls-localhost.txt
```

### Method 3: Using Environment Variables
```bash
# Set environment and run
USE_AUTHENTICATION=false URLS_FILE=urls-localhost.txt npm run zapTest
```

## Understanding ZAP Spider Behavior

### What the Spider Does
1. **Starts from your seed URLs** (entry points you specify)
2. **Follows ALL links** it discovers on those pages
3. **Submits forms** with test data to discover endpoints
4. **Executes JavaScript** to find dynamically loaded content
5. **Maps the complete site structure** accessible from entry points

### What You Need to Specify vs What Gets Auto-Discovered

#### ✅ MUST Specify (Seed URLs):
- **Homepage/Landing pages**: `http://localhost:3000/`
- **Login pages**: `http://localhost:3000/login` 
- **API entry points**: `http://localhost:3000/api`
- **Admin panels**: `http://localhost:3000/admin` (if not linked)
- **Isolated sections**: Pages not reachable through navigation

#### 🤖 Auto-Discovered by Spider:
- All navigation menu links
- Footer links and secondary pages
- Form submission endpoints
- AJAX/API calls triggered by pages
- Dynamic routes (React Router, etc.)
- Hidden form fields and endpoints
- JavaScript-generated URLs

### Localhost Example Structure

If your localhost:3000 has this structure:
```
http://localhost:3000/              ← SPECIFY (entry point)
├── /about                         ← Auto-discovered (if linked)
├── /contact                       ← Auto-discovered (if linked)  
├── /login                         ← SPECIFY (if not linked from home)
├── /dashboard                     ← Auto-discovered (after login)
├── /api/users                     ← Auto-discovered (if called by pages)
├── /admin                         ← SPECIFY (if separate entry point)
└── /hidden-debug-page             ← SPECIFY (if not linked anywhere)
```

**Minimal urls-localhost.txt:**
```
http://localhost:3000/
http://localhost:3000/admin
http://localhost:3000/api
```

The spider will find everything else linked from these pages!

## Pro Tips for Localhost Scanning

### 1. Development Server Setup
```bash
# Make sure your dev server is running
npm start  # or yarn start, or your dev command

# Verify it's accessible
curl http://localhost:3000/
```

### 2. Disable Authentication for Public Pages
```bash
# Scan public pages only (login, marketing, etc.)
node scan.js unauth --localhost --include="login|about|contact|home"
```

### 3. API Endpoint Discovery
```bash
# If you have API docs or health endpoints
echo "http://localhost:3000/api/health" >> urls-localhost.txt
echo "http://localhost:3000/api/docs" >> urls-localhost.txt
```

### 4. SPA (Single Page App) Considerations
For React/Vue/Angular apps:
- Spider may not discover all routes automatically
- Consider adding key route URLs manually
- Ensure your app renders navigation server-side or on initial load

### 5. Quick Test Setup
```bash
# Ultra-minimal test - let spider do the work!
node scan.js unauth --localhost --limit=5 --headless
```

This will:
1. Create temporary URL file with just `http://localhost:3000/`
2. Let ZAP spider discover all linked pages
3. Scan first 5 discovered URLs
4. Run headless for faster execution
5. Clean up temporary files

## Common Localhost Scanning Scenarios

### Scenario 1: New Feature Testing
```bash
# Test a specific feature branch
git checkout feature/new-dashboard
npm start
node scan.js unauth --localhost --include=dashboard
```

### Scenario 2: API Security Testing  
```bash
# Focus on API endpoints
node scan.js unauth --localhost --include=api --exclude=docs
```

### Scenario 3: Pre-deployment Check
```bash
# Comprehensive localhost scan before deploy
npm run build
npm run preview  # or serve build
node scan.js mixed --localhost --limit=50
```

The key insight: **Start with minimal seed URLs and let the spider do the discovery work!** Only manually specify URLs that aren't reachable through normal navigation.