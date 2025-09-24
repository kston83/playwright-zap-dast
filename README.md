# OWASP-ZAP Automated Penetration Testing with Playwright

> Automated, repeatable vulnerability scanning for web applications using **Playwright** for authenticated browsing and **OWASP ZAP** for active and passive scanning.
> This project crawls and tests each URL in `urls.txt`, produces per-URL HTML reports in `Output/`, and can generate a consolidated CSV/Excel report.

---

**Repository:** `OWASP-ZAP-Automated-Pentration-Testing-with-Playwright`
**Primary goals:** automated authenticated scans, reproducible CI/CD runs, simple contributor workflow, and clear reports that security and QA teams can use.

---

## 🎯 Objective

Provide a production-grade automation pipeline that:

* Uses **Playwright** to authenticate and visit application pages (one-step auth via `global-setup.ts` producing `storageState.json`).
* Launches and orchestrates **OWASP ZAP** sessions to spider and actively scan the authenticated surface.
* Generates human-readable HTML scan reports per URL and a unified CSV/Excel summary.
* Integrates with CI/CD (example GitHub Actions workflow included) so scans can run automatically in pipelines.

This repository is suitable for internal pentests of your own applications and for improving security QA workflows. **Do not** run these scans against systems you do not own or have explicit permission to test.

---

## 🔎 Description

The project combines:

* Playwright for browser automation and authenticated sessions (`storageState.json`) so ZAP scans the application as a real user.
* OWASP ZAP for passive analysis (spidering) and active scanning (attack simulations).
* Scripts to orchestrate session creation, scanning, report generation, and shutdown.
* CI/CD example (`.github/workflows/pentest.yml`) that demonstrates running scans in automation environments (using ZAP Docker or a ZAP service).

---

## ✅ Prerequisites

* Node.js ≥ 18 and npm ≥ 8
* Git
* Playwright (browsers installed)
* OWASP ZAP (installed locally **or** available as Docker image)
* Windows, macOS or Linux environment (commands below include platform variations)

---

## 📥 Clone & Install

```bash
git clone https://github.com/MohamedSci/OWASP-ZAP-Automated-Pentration-Testing-with-Playwright.git
cd OWASP-ZAP-Automated-Pentration-Testing-with-Playwright
npm install
```

Install Playwright browsers (required):

```bash
npx playwright install
```

Install OWASP ZAP (see next section).

---

## 🛠️ Installing OWASP ZAP

You can install OWASP ZAP either via native installer (Windows/macOS/Linux) or using Docker.

### Windows (native installer)

1. Download ZAP from the official site: [https://www.zaproxy.org/download/](https://www.zaproxy.org/download/)
2. Run the installer and install to the default path (recommended):
   `C:\Program Files\ZAP\Zed Attack Proxy\`
3. To run ZAP in daemon/headless mode for automation, open a PowerShell/cmd and run:

   ```powershell
   cd "C:\Program Files\ZAP\Zed Attack Proxy"
   .\zap.bat -daemon -host 127.0.0.1 -port 8888 -config api.disablekey=true
   ```

### macOS / Linux (native)

Download the cross-platform package from the ZAP site, extract to a chosen folder, then start ZAP:

```bash
# example path /opt/zap
/opt/ZAP/zap.sh -daemon -host 127.0.0.1 -port 8888 -config api.disablekey=true
```

### Using Docker (recommended for CI)

```bash
docker run -u zap -p 127.0.0.1:8888:8888 -d owasp/zap2docker-stable zap.sh -daemon -host 0.0.0.0 -port 8888 -config api.disablekey=true
```

> **Important:** `-config api.disablekey=true` disables the API key requirement (use only in trusted/local/CI environments). For production use, secure the API appropriately.

---

## ⚙️ Environment & Auth (one-step auth → `storageState.json`)

Create a `.env` file in project root with the credentials required for the target application:

```
# Example .env
LOGIN_URL=https://your-app/login
LOGIN_EMAIL=you@example.com
LOGIN_PASSWORD=yourPassword
COMMON_SELECTOR=.submit-button
ZAP_API_HOST=127.0.0.1
ZAP_API_PORT=8888
```

The project uses a Playwright `global-setup.ts` (or equivalent script) that performs a one-step authentication sequence and stores the resulting authenticated context in `storageState.json`. This file is then used by the Playwright/ZAP orchestration so scans are performed while authenticated.

**How to generate `storageState.json` manually (if needed):**

```bash
npx playwright test --config=playwright.config.ts --project=chromium --global-setup
# or run the specific global setup script if defined
node src/PlaywrightFuns/createNewPage.js
```

---

## ▶️ Run the Tests & Scans Locally

1. Ensure ZAP is running (native or Docker) and listening on the configured host/port (default `127.0.0.1:8888`).
2. Ensure `.env` and `urls.txt` are populated.
3. Run the main command:

```bash
npm run zapTest
```

> `npm run zapTest` should be wired in `package.json` to call the orchestrator/spec file. Example script you can add if not present:
>
> ```json
> "scripts": {
>   "zapTest": "node ./src/runZap.spec.js",
>   "generate-csv": "node generate_csv.cjs"
> }
> ```

**What happens**

* Playwright global setup will create `storageState.json` (authenticated session).
* `src/runZap.spec.js` will iterate over each URL from `urls.txt` via `Utils/getListURLS.js`.
* For each URL:

  * `src/ZAPFuns/createZapSession.js` initializes a ZAP session.
  * `src/ZAPFuns/runSpiderScan.js` runs the spider to discover links.
  * `src/ZAPFuns/runActiveScan.js` runs the active scan to find vulnerabilities.
  * `src/ZAPFuns/generateReport.js` saves a per-URL HTML report into `Output/`.
  * `src/ZAPFuns/shuttingDownZAP.js` cleans up the session.
* After the run, `generate_csv.cjs` can consolidate report info into a CSV/Excel format.

---

## 📁 Project Structure & File Descriptions

```
.
├── src/
│   ├── PlaywrightFuns/
│   │   └── createNewPage.js           # create browser, context, page and (optionally) generate storageState.json
│   ├── ZAPFuns/
│   │   ├── createZapSession.js        # initialize zap session and context
│   │   ├── delay_fun.js               # helper wait/delay utilities
│   │   ├── generateReport.js          # render/save HTML report
│   │   ├── runActiveScan.js           # active attack scanner orchestration
│   │   ├── runSpiderScan.js           # spider/crawl the site
│   │   └── shuttingDownZAP.js         # terminate zap session and cleanup
│   └── runZap.spec.js                 # main orchestration spec — iterates URLs and runs scans
├── Utils/
│   └── getListURLS.js                 # read and return URLs from urls.txt
├── Output/                             # generated HTML reports stored here
├── generate_csv.cjs                    # consolidate HTML reports -> CSV/Excel
├── .github/
│   └── workflows/
│       └── pentest.yml                 # sample GitHub Actions CI workflow
├── urls.txt                            # list of URLs to scan (one per line)
├── .env                                # env variables: credentials, zap host/port, etc
├── playwright.config.ts                 # Playwright config (global-setup, projects, timeouts)
├── package.json                         # dependencies and scripts
└── LICENSE
```

---

## 🔁 CI/CD (GitHub Actions example)

The repo includes a sample workflow: `.github/workflows/pentest.yml`. Typical steps:

1. Start ZAP (Docker image) or ensure ZAP service is available in the runner.
2. Checkout code.
3. Install Node.js and dependencies.
4. Install Playwright browsers.
5. Generate `storageState.json` (global setup).
6. Run the orchestrator (`npm run zapTest`).
7. Upload generated HTML/CSV reports as CI artifacts.

**Security note:** Never store production credentials in GitHub Actions unencrypted — use GitHub Secrets and inject them at runtime.

---

## 📊 Reports & Post-processing

* Per-URL HTML reports are output to `Output/` (filename convention: `report-<url-slug>.html`).
* `generate_csv.cjs` reads per-report data and produces `report-summary.csv` / Excel friendly output for easy ingestion into spreadsheets or dashboards.
* Reports include:

  * Alerts and risk levels
  * Affected URLs and parameters
  * CWE/CVSS where applicable (from ZAP)
  * Scan summary and timestamps

---

## 🛡️ Security, Ethics & Legal

* **Only** scan systems you own or have explicit, written authorization to test.
* OWASP ZAP active scanning can be intrusive: active scans may generate impactful requests (e.g., form submissions). Use against production systems with extreme caution.
* Respect rate limiting, user data privacy, and responsible disclosure policies.

---

## ⚙️ Troubleshooting

* **ZAP connection refused**: Ensure ZAP is listening on the configured host/port and `api.disablekey` configuration matches your security posture. If using Docker, map the port correctly.
* **Playwright storageState missing**: Run global setup or `createNewPage.js` to generate `storageState.json` before scans.
* **Spider/Active scan stalls**: Check backend logs at `backend-api/logs/` (if your project has similar logging), and increase timeouts in `playwright.config.ts`.
* **Report generation errors**: Verify `Output/` folder permissions and that `generateReport.js` can write to disk.

---

## 🧪 Example: Add a URL & Run

1. Add URLs (one per line) to `urls.txt`:

```
https://staging.example.com/login
https://staging.example.com/dashboard
```

2. Set `.env` credentials for authentication.

3. Start ZAP and run:

```bash
npm run zapTest
# then consolidate reports
npm run generate-csv
```

---

## 🤝 Contributing

Contributions are welcome! Suggested workflow:

1. Fork the repo.
2. Create a branch: `git checkout -b feature/<short-desc>`
3. Make changes and ensure tests / scripts still run.
4. Open a Pull Request describing:

   * Purpose of change
   * Security/behavior impact
   * Any additional dependencies

Please follow TypeScript/JavaScript best practices and keep changes scoped. Add tests or manual verification steps for new behavior.

---

## 📜 License

This project is licensed under the **Apache 2.0 License**. See the `LICENSE` file for details.

---

## ✍️ Author

**Mohamed Said Ibrahim**

* GitHub: `https://github.com/MohamedSci`
* Project repo: `https://github.com/MohamedSci/OWASP-ZAP-Automated-Pentration-Testing-with-Playwright`

---

## 📌 Final Notes / Best Practices

* Use a **staging/test** environment for scanning, never production unless explicitly authorized.
* Secure your ZAP API in shared environments — prefer API keys or local socket access.
* Consider rate-limiting and scan windows for safer scanning approaches.
* Review ZAP and Playwright logs regularly to improve scan coverage and reduce false positives.

---