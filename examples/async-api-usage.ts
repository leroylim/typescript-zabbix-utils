// Copyright (C) 2001-2023 Zabbix SIA
//
// Zabbix SIA licenses this file to you under the MIT License.
// See the LICENSE file in the project root for more information.

import { AsyncZabbixAPI } from '../src';

async function main() {
    // Create an async Zabbix API instance
    const api = new AsyncZabbixAPI({
        url: "http://127.0.0.1/zabbix",
        skipVersionCheck: true // Skip version check for demo
    });

    try {
        // Initialize version information
        const version = await api.apiVersion();
        console.log(`Connected to Zabbix API version: ${version}`);

        // Login with username and password
        await api.login(
            undefined, // token
            process.env.ZABBIX_USER || "Admin",
            process.env.ZABBIX_PASSWORD || "zabbix"
        );

        console.log('Successfully logged in to Zabbix API');

        // Check authentication status
        const isAuthenticated = await api.checkAuth();
        console.log('Authentication status:', isAuthenticated);

        // Get all users (using dynamic API methods)
        const users = await (api as any).user.get({
            output: ['userid', 'username', 'name']
        });

        console.log('\nUsers:');
        for (const user of users) {
            console.log(`- ${user.name} (${user.username})`);
        }

        // Get all hosts
        const hosts = await (api as any).host.get({
            output: ['hostid', 'host', 'name'],
            limit: 5
        });

        console.log('\nHosts (first 5):');
        for (const host of hosts) {
            console.log(`- ${host.name} (${host.host})`);
        }

        // Get host groups
        const hostGroups = await (api as any).hostgroup.get({
            output: ['groupid', 'name'],
            limit: 5
        });

        console.log('\nHost Groups (first 5):');
        for (const group of hostGroups) {
            console.log(`- ${group.name}`);
        }

        // Logout
        await api.logout();
        console.log('\nSuccessfully logged out from Zabbix API');

    } catch (error) {
        console.error('Error:', error);
    }
}

// Run the example
if (require.main === module) {
    main().catch(console.error);
} 