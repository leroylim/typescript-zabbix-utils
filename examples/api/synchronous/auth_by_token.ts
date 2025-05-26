// Copyright (C) 2001-2023 Zabbix SIA
//
// Zabbix SIA licenses this file to you under the MIT License.
// See the LICENSE file in the project root for more information.

import { ZabbixAPI } from '../../../src';

// Use an authentication token generated via the web interface or
// API instead of standard authentication by username and password.
const ZABBIX_AUTH = {
    url: "127.0.0.1",
    token: "8jF7sGh2Rp4TlQ1ZmXo0uYv3Bc6AiD9E"
};

async function main() {
    // Create an instance of the ZabbixAPI class with the specified authentication details
    const api = new ZabbixAPI(ZABBIX_AUTH);

    try {
        // Retrieve a list of users, including their user ID and name
        const users = await (api as any).user.get({
            output: ['userid', 'name']
        });

        // Print the names of the retrieved users
        for (const user of users) {
            console.log(user.name);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Run the example
if (require.main === module) {
    main().catch(console.error);
} 