#!/usr/bin/env node
// Copyright (C) 2001-2023 Zabbix SIA (Original Python library)
// Copyright (C) 2024-2025 Han Yong Lim <hanyong.lim@gmail.com> (TypeScript adaptation)
//
// Zabbix SIA licenses this file under the MIT License.
// See the LICENSE file in the project root for more information.

import axios from 'axios';

interface ZabbixBranch {
    id: string;
    displayId: string;
    type: string;
    latestCommit: string;
    latestChangeset: string;
    isDefault: boolean;
}

class ZabbixReleaseChecker {
    private branchesUrl: string;
    private librepoUrl: string;
    private manualRepo: string;

    constructor() {
        this.branchesUrl = process.env.BRANCHES_URL || '';
        this.librepoUrl = process.env.LIBREPO_URL || '';
        this.manualRepo = process.env.MANUAL_REPO || '';
    }

    async checkNewRelease(): Promise<void> {
        try {
            console.log('Checking for new Zabbix release branches...');
            
            if (!this.branchesUrl) {
                throw new Error('BRANCHES_URL environment variable is not set');
            }

            // Check Zabbix Git API for release branches
            const response = await axios.get(this.branchesUrl);
            const branches: ZabbixBranch[] = response.data.values || [];
            
            // Filter for release branches (e.g., release/7.4, release/7.2)
            const releaseBranches = branches.filter(branch => 
                branch.displayId.startsWith('release/') && 
                /^release\/\d+\.\d+$/.test(branch.displayId)
            );
            
            if (releaseBranches.length === 0) {
                console.log('No release branches found.');
                return;
            }

            // Sort release branches by version number (highest first)
            releaseBranches.sort((a, b) => {
                const versionA = a.displayId.replace('release/', '');
                const versionB = b.displayId.replace('release/', '');
                return versionB.localeCompare(versionA, undefined, { numeric: true });
            });

            const latestReleaseBranch = releaseBranches[0];
            console.log(`Latest Zabbix release branch: ${latestReleaseBranch.displayId}`);
            console.log(`Latest commit: ${latestReleaseBranch.latestCommit}`);
            console.log(`Branch ID: ${latestReleaseBranch.id}`);

            // List all release branches for information
            console.log('\nAll available release branches:');
            releaseBranches.forEach(branch => {
                console.log(`  - ${branch.displayId} (${branch.latestCommit.substring(0, 8)})`);
            });

            console.log(`\n📝 For manual compatibility updates, see: ${this.manualRepo}`);
            console.log('✓ Zabbix release branch check completed.');
            
        } catch (error) {
            console.error('Error checking for new Zabbix releases:', error);
            
            // If it's a network error, show more details
            if (axios.isAxiosError(error)) {
                console.error(`HTTP Status: ${error.response?.status}`);
                console.error(`Response data:`, error.response?.data);
            }
            
            process.exit(1);
        }
    }
}

// Run the check
const checker = new ZabbixReleaseChecker();
checker.checkNewRelease().catch(console.error);
