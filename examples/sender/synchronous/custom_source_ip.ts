// Copyright (C) 2001-2023 Zabbix SIA
//
// Zabbix SIA licenses this file to you under the MIT License.
// See the LICENSE file in the project root for more information.

import { Sender } from '../../../src';

async function main() {
    // Create an instance of the Sender class with specified parameters
    // Parameters: (server, port, source_ip)
    const sender = new Sender({
        server: "127.0.0.1",
        port: 10051,
        sourceIp: "10.10.1.5"
    });

    // Send a value to a Zabbix server/proxy with specified parameters
    // Parameters: (host, key, value, clock)
    const response = await sender.sendValue('host', 'item.key', 'value', 1695713666);

    // Check if the value sending was successful
    if (response.failed === 0) {
        // Print a success message along with the response time
        console.log(`Value sent successfully in ${response.time}`);
    } else {
        // Print a failure message
        console.log("Failed to send value");
    }
}

main().catch(console.error);
