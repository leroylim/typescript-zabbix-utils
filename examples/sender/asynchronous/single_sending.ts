// Copyright (C) 2001-2023 Zabbix SIA
//
// Zabbix SIA licenses this file to you under the MIT License.
// See the LICENSE file in the project root for more information.

import { AsyncSender } from '../../../src';

// Zabbix server/proxy details for AsyncSender
const ZABBIX_SERVER = {
    server: "127.0.0.1",  // Zabbix server/proxy IP address or hostname
    port: 10051           // Zabbix server/proxy port for AsyncSender
};

/**
 * The main function to perform asynchronous tasks.
 */
async function main(): Promise<void> {
    try {
        // Create an instance of the AsyncSender class with the specified server details
        const sender = new AsyncSender(ZABBIX_SERVER);

        // Send a value to a Zabbix server/proxy with specified parameters
        // Parameters: (host, key, value, clock, ns)
        const response = await sender.sendValue('host', 'item.key', 'value', 1695713666, 30);

        // Check if the value sending was successful
        if (response.failed === 0) {
            // Print a success message along with the response time
            console.log(`Value sent successfully in ${response.time}`);
        } else {
            // Print a failure message
            console.log("Failed to send value");
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Run the main function
if (require.main === module) {
    main().catch(console.error);
} 