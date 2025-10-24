import dotenv from 'dotenv';
dotenv.config();

/**
 * Centralized configuration management for scan modes
 */
export class ScanConfiguration {
  constructor() {
    this.mode = this.getScanMode();
    this.config = this.loadConfiguration();
  }

  getScanMode() {
    const authMode = process.env.USE_AUTHENTICATION;
    
    if (authMode === 'false') return 'unauthenticated';
    if (authMode === 'true') return 'authenticated';
    if (authMode === 'mixed') return 'mixed';
    
    // Default to authenticated if not specified
    return 'authenticated';
  }

  loadConfiguration() {
    const baseConfig = {
      zap: {
        proxy: process.env.ZAP_PROXY || 'http://localhost:8888',
        apiKey: process.env.ZAP_API_KEY || '',
        timeout: Number.parseInt(process.env.ZAP_TIMEOUT) || 60000
      },
      browser: {
        headless: process.env.HEADLESS === 'true',
        timeout: Number.parseInt(process.env.BROWSER_TIMEOUT) || 60000
      },
      scan: {
        spiderTimeout: Number.parseInt(process.env.SPIDER_TIMEOUT) || 300000,
        activeScanTimeout: Number.parseInt(process.env.ACTIVE_SCAN_TIMEOUT) || 600000,
        delayBetweenScans: Number.parseInt(process.env.SCAN_DELAY) || 5000
      }
    };

    // Add authentication config only if needed
    if (this.mode === 'authenticated' || this.mode === 'mixed') {
      baseConfig.auth = {
        loginUrl: process.env.LOGIN_URL,
        email: process.env.LOGIN_EMAIL,
        password: process.env.LOGIN_PASSWORD,
        commonSelector: process.env.COMMON_SELECTOR || 'body'
      };
    }

    return baseConfig;
  }

  requiresAuthentication() {
    return this.mode === 'authenticated' || this.mode === 'mixed';
  }

  getDisplayMode() {
    const modes = {
      'authenticated': '🔐 Authenticated Only',
      'unauthenticated': '🌐 Unauthenticated Only', 
      'mixed': '🔀 Mixed Mode (Auth + Unauth)'
    };
    return modes[this.mode] || modes.authenticated;
  }

  validateConfiguration() {
    const errors = [];

    // Validate ZAP configuration
    if (!this.config.zap.proxy) {
      errors.push('ZAP_PROXY is required');
    }

    // Validate authentication if required
    if (this.requiresAuthentication()) {
      if (!this.config.auth?.loginUrl) {
        errors.push('LOGIN_URL is required for authenticated scanning');
      }
      if (!this.config.auth?.email) {
        errors.push('LOGIN_EMAIL is required for authenticated scanning');
      }
      if (!this.config.auth?.password) {
        errors.push('LOGIN_PASSWORD is required for authenticated scanning');
      }
    }

    if (errors.length > 0) {
      console.error('❌ Configuration Errors:');
      for (const error of errors) {
        console.error(`   - ${error}`);
      }
      throw new Error(`Invalid configuration: ${errors.join(', ')}`);
    }

    console.log('✅ Configuration validated successfully');
    return true;
  }
}

export const scanConfig = new ScanConfiguration();