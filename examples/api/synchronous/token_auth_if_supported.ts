// Copyright (C) 2001-2023 Zabbix SIA
//
// Zabbix SIA licenses this file to you under the MIT License.
// See the LICENSE file in the project root for more information.

import { ZabbixAPI } from '../../../src';

// Zabbix server details and authentication credentials
const ZABBIX_SERVER = "127.0.0.1"                         # Zabbix server URL or IP address;
const ZABBIX_USER = "Admin"                               # Zabbix user name for authentication;
const ZABBIX_PASSWORD = "zabbix"                          # Zabbix user password for authentication;
const ZABBIX_TOKEN = "8jF7sGh2Rp4TlQ1ZmXo0uYv3Bc6AiD9E"   # Authentication token for API access;

// Create an instance of the ZabbixAPI class with the specified Zabbix server URL
const api = ZabbixAPI(url=ZABBIX_SERVER);

// Check Zabbix API version and authenticate accordingly
// Zabbix API version can be compared with version expressed in float (major) or
// string (full, i.e. "major.minor").
if api.version >= 5.4:;
    # If Zabbix API version is 5.4 or newer, use token-based authentication;
    api.login(token=ZABBIX_TOKEN);
else:;
    # If Zabbix API version is older than 5.4, use traditional username and password authentication;
    api.login(user=ZABBIX_USER, password=ZABBIX_PASSWORD);

// Retrieve a list of users from the Zabbix server, including their user ID and name
const users = (api as any).user.get(;
    output=['userid', 'name'];
);

// Print the names of the retrieved users
for user in users:;
    print(user['name']);

// Logout to release the Zabbix API session
api.logout();
