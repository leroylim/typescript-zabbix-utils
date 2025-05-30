#!/usr/bin/env node
"use strict";
// Copyright (C) 2001-2023 Zabbix SIA (Original Python library)
// Copyright (C) 2024-2025 Han Yong Lim <hanyong.lim@gmail.com> (TypeScript adaptation)
//
// Zabbix SIA licenses this file under the MIT License.
// See the LICENSE file in the project root for more information.
Object.defineProperty(exports, "__esModule", { value: true });
const dist_1 = require("../../dist");
async function waitForZabbixAPI() {
    const maxAttempts = 20;
    const delayMs = 5000; // 5 seconds
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            console.log(`Attempt ${attempt}/${maxAttempts}: Checking Zabbix API...`);
            const zapi = new dist_1.ZabbixAPI({
                url: 'http://localhost',
                skipVersionCheck: true
            });
            await zapi.login(undefined, 'Admin', 'zabbix');
            // Get and display the actual server version
            const version = await zapi.apiVersion();
            console.log(`✓ Connected to Zabbix API version ${version}`);
            await zapi.logout();
            console.log('✓ Zabbix API is ready!');
            process.exit(0);
        }
        catch (error) {
            console.log(`Zabbix API is not ready... Error: ${error}`, { flush: true });
            if (attempt < maxAttempts) {
                console.log(`Waiting ${delayMs / 1000} seconds before next attempt...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }
    console.error('Failed to wait for Zabbix API to be ready');
    process.exit(1);
}
// Run the wait function
waitForZabbixAPI().catch((error) => {
    console.error('Error waiting for Zabbix API:', error);
    process.exit(1);
});
