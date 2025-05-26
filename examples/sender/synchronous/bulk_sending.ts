// Copyright (C) 2001-2023 Zabbix SIA
//
// Zabbix SIA licenses this file to you under the MIT License.
// See the LICENSE file in the project root for more information.

import { ItemValue, Sender } from '../../../src';

async function main() {
    // List of ItemValue instances representing items to be sent
    const items = [
        new ItemValue('host1', 'item.key1', '10'),
        new ItemValue('host1', 'item.key2', 'test message'),
        new ItemValue('host2', 'item.key1', '-1', 1695713666),
        new ItemValue('host3', 'item.key1', '{"msg":"test message"}'),
        new ItemValue('host2', 'item.key1', '0', 1695713666, 100)
    ];

    // Create an instance of the Sender class with the specified server details
    const sender = new Sender({ server: "127.0.0.1", port: 10051 });

    try {
        // Send multiple items to the Zabbix server/proxy and receive response
        const response = await sender.send(items);

        // Check if the value sending was successful
        if (response.failed === 0) {
            // Print a success message along with the response time
            console.log(`Value sent successfully in ${response.time}`);
        } else if (response.details) {
            // Iterate through the list of responses from Zabbix server/proxy.
            for (const [node, chunks] of Object.entries(response.details)) {
                // Iterate through the list of chunks.
                for (const resp of chunks as any[]) {
                    // Check if the value sending was successful
                    if (resp.failed === 0) {
                        // Print a success message along with the response time
                        console.log(`Value sent successfully to ${node} in ${resp.time}`);
                    } else {
                        // Print a failure message
                        console.log(`Failed to send value to ${node} at chunk step ${resp.chunk}`);
                    }
                }
            }
        } else {
            // Print a failure message
            console.log("Failed to send value");
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Run the example
if (require.main === module) {
    main().catch(console.error);
} 