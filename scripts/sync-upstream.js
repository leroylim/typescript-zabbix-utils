#!/usr/bin/env node

/**
 * Upstream Synchronization Script
 * 
 * This script helps maintain feature parity with the upstream Python zabbix-utils library.
 * It can check for changes, analyze differences, and provide guidance for updates.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class UpstreamSync {
    constructor() {
        this.upstreamUrl = 'https://github.com/zabbix/python-zabbix-utils.git';
        this.currentVersion = '2.0.2';
        this.upstreamDir = 'upstream-temp';
        this.isWindows = process.platform === 'win32';
    }

    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = {
            'info': '📋',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌',
            'sync': '🔄'
        }[level] || 'ℹ️';
        
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    exec(command, options = {}) {
        try {
            return execSync(command, { 
                encoding: 'utf8', 
                stdio: options.silent ? 'pipe' : 'inherit',
                shell: this.isWindows ? 'powershell.exe' : '/bin/bash',
                ...options 
            });
        } catch (error) {
            if (!options.allowFailure) {
                this.log(`Command failed: ${command}`, 'error');
                throw error;
            }
            return null;
        }
    }

    async cloneUpstream() {
        this.log('Cloning upstream repository...', 'sync');
        
        // Clean up existing directory
        if (fs.existsSync(this.upstreamDir)) {
            if (this.isWindows) {
                this.exec(`Remove-Item -Recurse -Force "${this.upstreamDir}"`, { allowFailure: true });
            } else {
                this.exec(`rm -rf ${this.upstreamDir}`, { allowFailure: true });
            }
        }
        
        this.exec(`git clone ${this.upstreamUrl} ${this.upstreamDir}`);
        this.log('Upstream repository cloned successfully', 'success');
    }

    getLatestTag() {
        const command = this.isWindows 
            ? `cd ${this.upstreamDir}; git tag --sort=-version:refname | Select-Object -First 1`
            : `cd ${this.upstreamDir} && git tag --sort=-version:refname | head -1`;
        
        const result = this.exec(command, { silent: true });
        return result.trim();
    }

    getNewCommits() {
        const command = this.isWindows
            ? `cd ${this.upstreamDir}; git log --oneline v${this.currentVersion}..HEAD`
            : `cd ${this.upstreamDir} && git log --oneline v${this.currentVersion}..HEAD`;
            
        const result = this.exec(command, { silent: true, allowFailure: true });
        return result ? result.trim().split('\n').filter(line => line.length > 0) : [];
    }

    getChangedFiles() {
        const command = this.isWindows
            ? `cd ${this.upstreamDir}; git diff v${this.currentVersion}..HEAD --name-only`
            : `cd ${this.upstreamDir} && git diff v${this.currentVersion}..HEAD --name-only`;
            
        const result = this.exec(command, { silent: true, allowFailure: true });
        return result ? result.trim().split('\n').filter(line => line.length > 0) : [];
    }

    getLibraryChanges() {
        const changedFiles = this.getChangedFiles();
        return changedFiles.filter(file => file.startsWith('zabbix_utils/'));
    }

    analyzeChanges() {
        this.log('Analyzing upstream changes...', 'sync');
        
        const latestTag = this.getLatestTag();
        const newCommits = this.getNewCommits();
        const changedFiles = this.getChangedFiles();
        const libraryChanges = this.getLibraryChanges();

        const analysis = {
            latestTag,
            currentVersion: this.currentVersion,
            hasNewCommits: newCommits.length > 0,
            hasLibraryChanges: libraryChanges.length > 0,
            newCommits,
            changedFiles,
            libraryChanges
        };

        return analysis;
    }

    generateSyncReport(analysis) {
        const report = [];
        
        report.push('# Upstream Synchronization Report');
        report.push('');
        report.push(`**Generated:** ${new Date().toISOString()}`);
        report.push(`**Current TypeScript Version:** ${analysis.currentVersion}`);
        report.push(`**Latest Upstream Tag:** ${analysis.latestTag}`);
        report.push(`**New Commits:** ${analysis.newCommits.length}`);
        report.push(`**Library Changes:** ${analysis.hasLibraryChanges ? 'YES' : 'NO'}`);
        report.push('');

        if (analysis.hasNewCommits) {
            if (analysis.hasLibraryChanges) {
                report.push('## 🚨 Action Required: Library Changes Detected');
                report.push('');
                report.push('The following library files have been modified:');
                report.push('```');
                analysis.libraryChanges.forEach(file => report.push(file));
                report.push('```');
                report.push('');
                report.push('### Recommended Actions:');
                report.push('1. Review each changed file in the upstream repository');
                report.push('2. Update corresponding TypeScript files');
                report.push('3. Update or add tests for new functionality');
                report.push('4. Update version number in `src/version.ts`');
                report.push('5. Update documentation and examples if needed');
                report.push('6. Run full test suite to ensure compatibility');
                report.push('');
            } else {
                report.push('## ℹ️ Non-Library Changes Detected');
                report.push('');
                report.push('Changes detected but no library code modifications found.');
                report.push('These are likely CI, documentation, or configuration changes.');
                report.push('');
            }

            report.push('## New Commits:');
            report.push('```');
            analysis.newCommits.forEach(commit => report.push(commit));
            report.push('```');
            report.push('');

            if (analysis.changedFiles.length > 0) {
                report.push('## All Changed Files:');
                report.push('```');
                analysis.changedFiles.forEach(file => report.push(file));
                report.push('```');
                report.push('');
            }
        } else {
            report.push('## ✅ Up to Date');
            report.push('');
            report.push('No new commits detected. TypeScript port is current with upstream.');
            report.push('');
        }

        report.push('## Useful Links:');
        report.push(`- [Upstream Repository](${this.upstreamUrl})`);
        report.push(`- [Compare v${analysis.currentVersion}...HEAD](${this.upstreamUrl}/compare/v${analysis.currentVersion}...HEAD)`);
        report.push(`- [Latest Release](${this.upstreamUrl}/releases/latest)`);

        return report.join('\n');
    }

    async generateDiffFiles(analysis) {
        if (!analysis.hasLibraryChanges) {
            return;
        }

        this.log('Generating diff files for library changes...', 'sync');
        
        const diffDir = 'diffs';
        if (!fs.existsSync(diffDir)) {
            fs.mkdirSync(diffDir);
        }

        for (const file of analysis.libraryChanges) {
            const command = this.isWindows
                ? `cd ${this.upstreamDir}; git diff v${this.currentVersion}..HEAD -- ${file}`
                : `cd ${this.upstreamDir} && git diff v${this.currentVersion}..HEAD -- ${file}`;
                
            const diffOutput = this.exec(command, { silent: true, allowFailure: true });

            if (diffOutput) {
                const filename = file.replace('/', '_').replace('.py', '.diff');
                const diffPath = path.join(diffDir, filename);
                fs.writeFileSync(diffPath, diffOutput);
                this.log(`Generated diff: ${diffPath}`, 'info');
            }
        }
    }

    cleanup() {
        if (fs.existsSync(this.upstreamDir)) {
            if (this.isWindows) {
                this.exec(`Remove-Item -Recurse -Force "${this.upstreamDir}"`, { allowFailure: true });
            } else {
                this.exec(`rm -rf ${this.upstreamDir}`, { allowFailure: true });
            }
        }
    }

    async run(options = {}) {
        try {
            this.log('Starting upstream synchronization check...', 'sync');
            
            await this.cloneUpstream();
            const analysis = this.analyzeChanges();
            
            // Generate report
            const report = this.generateSyncReport(analysis);
            
            if (options.output) {
                fs.writeFileSync(options.output, report);
                this.log(`Report saved to: ${options.output}`, 'success');
            } else {
                console.log('\n' + report);
            }

            // Generate diff files if requested
            if (options.generateDiffs && analysis.hasLibraryChanges) {
                await this.generateDiffFiles(analysis);
            }

            // Summary
            if (analysis.hasNewCommits) {
                if (analysis.hasLibraryChanges) {
                    this.log(`Found ${analysis.libraryChanges.length} library file changes requiring attention`, 'warning');
                } else {
                    this.log(`Found ${analysis.newCommits.length} non-library commits`, 'info');
                }
            } else {
                this.log('TypeScript port is up to date with upstream', 'success');
            }

            return analysis;

        } catch (error) {
            this.log(`Synchronization check failed: ${error.message}`, 'error');
            throw error;
        } finally {
            this.cleanup();
        }
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {};

    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--output':
            case '-o':
                options.output = args[++i];
                break;
            case '--generate-diffs':
            case '-d':
                options.generateDiffs = true;
                break;
            case '--help':
            case '-h':
                console.log(`
Usage: node sync-upstream.js [options]

Options:
  -o, --output <file>     Save report to file
  -d, --generate-diffs    Generate diff files for library changes
  -h, --help             Show this help message

Examples:
  node sync-upstream.js                           # Check and display report
  node sync-upstream.js -o sync-report.md        # Save report to file
  node sync-upstream.js -d -o report.md          # Generate diffs and save report
`);
                process.exit(0);
                break;
        }
    }

    const sync = new UpstreamSync();
    sync.run(options).catch(error => {
        console.error('Sync failed:', error.message);
        process.exit(1);
    });
}

module.exports = UpstreamSync; 