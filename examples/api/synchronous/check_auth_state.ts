// Copyright (C) 2001-2023 Zabbix SIA
//
// Zabbix SIA licenses this file to you under the MIT License.
// See the LICENSE file in the project root for more information.

import { ZabbixAPI } from '../../../src';

// Zabbix server details and authentication credentials
const ZABBIX_AUTH = {
    url: "127.0.0.1",    // Zabbix server URL or IP address
    user: "Admin",       // Zabbix user name for authentication
    password: "zabbix"   // Zabbix user password for authentication
};

async function main() {
    // Create an instance of the ZabbixAPI class with the specified authentication details
    const api = new ZabbixAPI(ZABBIX_AUTH);

    try {
        // Some actions when your session can be released
        // For example, await api.logout()

        // Check if authentication is still valid
        if (await api.checkAuth()) {
            // Retrieve a list of hosts from the Zabbix server, including their host ID and name
            const hosts = await (api as any).host.get({
                output: ['hostid', 'name']
            });

            // Print the names of the retrieved hosts
            for (const host of hosts) {
                console.log(host.name);
            }

            // Logout to release the Zabbix API session
            await api.logout();
        } else {
            console.log('Authentication is not valid');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Run the example
if (require.main === module) {
    main().catch(console.error);
} 