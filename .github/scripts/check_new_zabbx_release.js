#!/usr/bin/env node
"use strict";
// Copyright (C) 2001-2023 Zabbix SIA
//
// Zabbix SIA licenses this file under the MIT License.
// See the LICENSE file in the project root for more information.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
class ZabbixReleaseChecker {
    constructor() {
        this.branchesUrl = process.env.BRANCHES_URL || '';
        this.librepoUrl = process.env.LIBREPO_URL || '';
        this.manualRepo = process.env.MANUAL_REPO || '';
    }
    async checkNewRelease() {
        try {
            console.log('Checking for new Zabbix releases...');
            // Check GitHub releases API for Zabbix
            const response = await axios_1.default.get('https://api.github.com/repos/zabbix/zabbix/releases/latest');
            const latestRelease = response.data;
            console.log(`Latest Zabbix release: ${latestRelease.tag_name}`);
            console.log(`Published at: ${latestRelease.published_at}`);
            console.log(`Release URL: ${latestRelease.html_url}`);
            // Check if this is a new release (basic implementation)
            const releaseDate = new Date(latestRelease.published_at);
            const daysSinceRelease = (Date.now() - releaseDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceRelease <= 7) {
                console.log('🚨 New Zabbix release detected within the last 7 days!');
                console.log('Consider updating the TypeScript library compatibility.');
            }
            else {
                console.log('✓ No recent Zabbix releases detected.');
            }
        }
        catch (error) {
            console.error('Error checking for new Zabbix releases:', error);
            process.exit(1);
        }
    }
}
// Run the check
const checker = new ZabbixReleaseChecker();
checker.checkNewRelease().catch(console.error);
