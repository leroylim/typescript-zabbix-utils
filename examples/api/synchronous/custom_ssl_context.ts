// Copyright (C) 2001-2023 Zabbix SIA
//
// Zabbix SIA licenses this file to you under the MIT License.
// See the LICENSE file in the project root for more information.

import { ZabbixAPI } from '../../../src';
import * as https from 'https';
import * as fs from 'fs';

// Create a custom HTTPS agent with SSL context
// Load a custom certificate from the specified file path to verify the server
const customAgent = new https.Agent({
    ca: fs.readFileSync("/path/to/certificate.crt")
});

// Create an instance of the ZabbixAPI class with the Zabbix server URL
// Set custom HTTPS agent for Zabbix API requests.
const ZABBIX_AUTH = {
    url: "https://example.com",
    user: "Admin",
    password: "zabbix",
    // Note: In TypeScript/Node.js, we use httpsAgent instead of ssl_context
    httpsAgent: customAgent
};

// Login to the Zabbix API using provided user credentials
const api = new ZabbixAPI(ZABBIX_AUTH);

// Retrieve a list of hosts from the Zabbix server, including their host ID and name
const hosts = (api as any).host.get({
    output: ['hostid', 'name']
});

// Print the names of the retrieved hosts
for (const host of hosts) {
    console.log(host.name);
}

// Logout to release the Zabbix API session
api.logout();
