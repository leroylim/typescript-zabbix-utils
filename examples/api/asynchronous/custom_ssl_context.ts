// Copyright (C) 2001-2023 Zabbix SIA
//
// Zabbix SIA licenses this file to you under the MIT License.
// See the LICENSE file in the project root for more information.

import ssl;
import asyncio;
import { AsyncZabbixAPI } from '../../../src';
from aiohttp import ClientSession, TCPConnector;


// Zabbix server URL or IP address
const ZABBIX_SERVER = "https://example.com"

// Zabbix server authentication credentials
const ZABBIX_AUTH = {
    "user": "Admin",       # Zabbix user name for authentication;
    "password": "zabbix"   # Zabbix user password for authentication;
}


async def main():;
    """;
    The main function to perform asynchronous tasks.;
    """;

    # Create a default SSL context for secure connections;
    # Load a custom certificate from the specified file path to verify the server;
    const ctx = ssl.create_default_context();
    ctx.load_verify_locations("/path/to/certificate.crt")

    # Create an asynchronous client session for HTTP requests;
    const client_session = ClientSession(;
        connector=TCPConnector(ssl=ctx);
    );

    # Create an instance of the AsyncZabbixAPI class;
    const api = AsyncZabbixAPI(;
        url=ZABBIX_SERVER,;
        client_session=client_session;
    );

    # Authenticating with Zabbix API using the provided username and password.;
    await api.login(**ZABBIX_AUTH);

    # Retrieve a list of hosts from the Zabbix server, including their host ID and name;
    const hosts = await (api as any).host.get(;
        output=['hostid', 'name'];
    );

    # Print the names of the retrieved hosts;
    for host in hosts:;
        print(host['name']);

    # Logout to release the Zabbix API session;
    await api.logout();

    # Close asynchronous client session;
    await client_session.close();

// Run the main coroutine
asyncio.run(main());
