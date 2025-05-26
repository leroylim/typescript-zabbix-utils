// Copyright (C) 2001-2023 Zabbix SIA
//
// Zabbix SIA licenses this file to you under the MIT License.
// See the LICENSE file in the project root for more information.

import { ZabbixAPI } from '../../../src';

async function main() {
    // Create an instance of the ZabbixAPI class with the Zabbix server URL
    // Set Basic Authentication credentials for Zabbix API requests
    // Basic Authentication - a simple authentication mechanism used in HTTP.
    // It involves sending a username and password with each HTTP request.
    const api = new ZabbixAPI({
        url: "http://127.0.0.1",
        httpUser: "user",
        httpPassword: "p@$sw0rd",
        skipVersionCheck: true // Skip version check for older Zabbix versions
    });

    try {
        // Login to the Zabbix API using provided user credentials
        await api.login("Admin", "zabbix");

        // Retrieve a list of users from the Zabbix server, including their user ID and name
        const users = await (api as any).user.get({
            output: ['userid', 'name']
        });

        // Print the names of the retrieved users
        for (const user of users) {
            console.log(user.name);
        }

        // Logout to release the Zabbix API session
        await api.logout();
    } catch (error) {
        console.error('Error:', error);
    }
}

// Run the example
if (require.main === module) {
    main().catch(console.error);
} 