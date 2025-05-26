// Copyright (C) 2001-2023 Zabbix SIA
//
// Zabbix SIA licenses this file to you under the MIT License.
// See the LICENSE file in the project root for more information.

import { ZabbixAPI } from '../../../src';

// Zabbix server details and authentication credentials
const ZABBIX_SERVER = "127.0.0.1";     // Zabbix server URL or IP address
const ZABBIX_USER = "Admin";           // Zabbix user name for authentication
const ZABBIX_PASSWORD = "zabbix";      // Zabbix user password for authentication

async function main() {
    // Create an instance of the ZabbixAPI class
    const api = new ZabbixAPI({ url: ZABBIX_SERVER });

    try {
        // Authenticate with the Zabbix API using the provided user credentials
        await api.login(ZABBIX_USER, ZABBIX_PASSWORD);

        // Retrieve a list of hosts from the Zabbix server, including their host ID and name
        const hosts = await (api as any).host.get({
            output: ['hostid', 'name']
        });

        // Print the names of the retrieved hosts
        for (const host of hosts) {
            console.log(host.name);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        // Automatic logout occurs when the code block exits
        try {
            await api.logout();
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
}

// Run the example
if (require.main === module) {
    main().catch(console.error);
} 