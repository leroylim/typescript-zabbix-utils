// Copyright (C) 2001-2023 Zabbix SIA
//
// Zabbix SIA licenses this file to you under the MIT License.
// See the LICENSE file in the project root for more information.

import { AsyncZabbixAPI } from '../../../src';

// Zabbix server URL or IP address.
const ZABBIX_SERVER = "127.0.0.1";

// Use an authentication token generated via the web interface or
// API instead of standard authentication by username and password.
const ZABBIX_TOKEN = "8jF7sGh2Rp4TlQ1ZmXo0uYv3Bc6AiD9E";

/**
 * The main function to perform asynchronous tasks.
 */
async function main(): Promise<void> {
    // Create an instance of the AsyncZabbixAPI class.
    const api = new AsyncZabbixAPI({ url: ZABBIX_SERVER });

    try {
        // Initialize API version
        await api.apiVersion();

        // Authenticating with Zabbix API using the provided token.
        await api.login(ZABBIX_TOKEN);

        // Retrieve a list of users, including their user ID and name
        const users = await (api as any).user.get({
            output: ['userid', 'name']
        });

        // Print the names of the retrieved users
        for (const user of users) {
            console.log(user.name);
        }

        // Close asynchronous connection
        await api.logout();
    } catch (error) {
        console.error('Error:', error);
    }
}

// Run the main function
if (require.main === module) {
    main().catch(console.error);
} 