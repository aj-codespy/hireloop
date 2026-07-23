"""
Global Setup for Visual Regression Testing
"""
import { FullConfig } from '@playwright/test';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

async function globalSetup(config: FullConfig) {
  console.log('=== Visual Regression Test Setup ===');
  
  // Create necessary directories
  const testDir = path.join(process.cwd(), 'scripts', 'visual-regression');
  const testResultsDir = path.join(testDir, 'test-results');
  const componentsDir = path.join(testDir, 'components');
  const baselineDir = path.join(componentsDir, 'baseline-snapshots');
  
  [testResultsDir, baselineDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
  
  // Log configuration
  console.log('Test Directory:', testDir);
  console.log('Projects:', config.projects.map(p => p.name).join(', '));
  console.log('Threshold:', config.snapshotOptions?.threshold || 0.2);
  console.log('Max Diff Pixels:', config.snapshotOptions?.maxDiffPixels || 1000);
  
  // Check if baseURL is accessible
  try {
    execSync(`curl -s --connect-timeout 10 ${config.use?.baseURL || 'http://localhost:3000'} > /dev/null`, { stdio: 'pipe' });
    console.log('✓ Base URL is accessible');
  } catch (error) {
    console.log('⚠ Base URL may not be accessible. Visual tests may fail.');
  }
  
  // Log viewport configurations
  config.projects.forEach(project => {
    const viewport = project.use?.viewport;
    console.log(`Project: ${project.name} - Viewport: ${viewport?.width}x${viewport?.height}`);
  });
  
  console.log('=== Setup Complete ===');
}

export default globalSetup;