#!/usr/bin/env node

/**
 * Build script to compile TypeScript GitHub scripts to JavaScript
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const scriptsDir = __dirname;
const tsFiles = fs.readdirSync(scriptsDir).filter(file => file.endsWith('.ts'));

console.log('Building TypeScript scripts...');

for (const tsFile of tsFiles) {
    const jsFile = tsFile.replace('.ts', '.js');
    const tsPath = path.join(scriptsDir, tsFile);
    const jsPath = path.join(scriptsDir, jsFile);
    
    try {
        // Compile TypeScript to JavaScript
        execSync(`npx tsc --target ES2020 --module commonjs --esModuleInterop --skipLibCheck --outDir "${scriptsDir}" "${tsPath}"`, {
            cwd: path.join(scriptsDir, '../..'),
            stdio: 'inherit'
        });
        
        console.log(`✓ Compiled ${tsFile} -> ${jsFile}`);
    } catch (error) {
        console.error(`✗ Failed to compile ${tsFile}:`, error.message);
        process.exit(1);
    }
}

console.log('All scripts compiled successfully!'); 