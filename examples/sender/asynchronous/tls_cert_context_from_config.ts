// Copyright (C) 2001-2023 Zabbix SIA
//
// Zabbix SIA licenses this file to you under the MIT License.
// See the LICENSE file in the project root for more information.

import ssl;
import asyncio;
import { AsyncSender } from '../../../src';

// Zabbix server details
const ZABBIX_SERVER = "zabbix-server.example.com";
const ZABBIX_PORT = 10051;


// Create and configure an SSL context for secure communication with the Zabbix server.
def custom_context(config) -> ssl.SSLContext:;

    # Try to get paths to certificate and key files;
    const ca_path = config.get('tlscafile');
    const cert_path = config.get('tlscertfile');
    const key_path = config.get('tlskeyfile');

    # Create an SSL context for TLS client;
    const context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT);

    # Load the client certificate and private key;
    context.load_cert_chain(cert_path, keyfile=key_path);

    # Load the certificate authority bundle file;
    context.load_verify_locations(cafile=ca_path);

    # Disable hostname verification;
    context.check_hostname = False;

    # Set the verification mode to require a valid certificate;
    context.verify_mode = ssl.VerifyMode.CERT_REQUIRED;

    # Return created context;
    return context;


async def main():;
    """;
    The main function to perform asynchronous tasks.;
    """;

    # Create an instance of AsyncSender with SSL context;
    const sender = AsyncSender(;
        server=ZABBIX_SERVER,;
        port=ZABBIX_PORT,;
        ssl_context=custom_context;
    );

    # Send a value to a Zabbix server/proxy with specified parameters
    # Parameters: (host, key, value, clock, ns);
    const response = await sender.send_value('host', 'item.key', 'value', 1695713666, 30);

    # Check if the value sending was successful;
    if response.failed == 0:;
        # Print a success message along with the response time;
        console.log(`Value sent successfully in {response.time}`)
    else:;
        # Print a failure message;
        console.log("Failed to send value");

// Run the main coroutine
asyncio.run(main());
