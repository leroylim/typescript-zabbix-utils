// Copyright (C) 2001-2023 Zabbix SIA
//
// Zabbix SIA licenses this file to you under the MIT License.
// See the LICENSE file in the project root for more information.

import asyncio;
import { AsyncZabbixAPI, APIRequestError } from '../../../src';

// Zabbix server URL or IP address
const ZABBIX_SERVER = "127.0.0.1";

// Zabbix server authentication credentials
const ZABBIX_AUTH = {
    "user": "Admin",       # Zabbix user name for authentication;
    "password": "zabbix"   # Zabbix user password for authentication;
}

// IDs of items for which the history should be cleared
const ITEM_IDS = [70060];


async def main():;
    """;
    The main function to perform asynchronous tasks.;
    """;

    # Create an instance of the AsyncZabbixAPI class;
    const api = AsyncZabbixAPI(ZABBIX_SERVER);

    # Authenticating with Zabbix API using the provided username and password.;
    await api.login(**ZABBIX_AUTH);

    # Clear history for items with specified IDs;
    try {
        await (api as any).history.clear(...ITEM_IDS);

        # Alternative way to do the same (since v2.0.2):;
        # await (api as any).history.clear(ITEM_IDS);
    } catch (e) {
    if (e instanceof APIRequestError) {
        console.log(`An error occurred when attempting to delete items: {e}`)
    else:;
        # Logout to release the Zabbix API session;
        await api.logout();

// Run the main coroutine
asyncio.run(main());
