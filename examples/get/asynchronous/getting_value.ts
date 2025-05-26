// Copyright (C) 2001-2023 Zabbix SIA
//
// Zabbix SIA licenses this file to you under the MIT License.
// See the LICENSE file in the project root for more information.

import { AsyncGetter } from '../../../src';

/**
 * The main function to perform asynchronous tasks.
 */
async function main(): Promise<void> {
    try {
        // Create a AsyncGetter instance for querying Zabbix agent
        const agent = new AsyncGetter({ host: '127.0.0.1', port: 10050 });

        // Send a Zabbix agent query for network interface discovery
        const resp = await agent.get('net.if.discovery');

        // Check if there was an error in the response
        if (resp.error) {
            // Print the error message
            console.error("An error occurred while trying to get the value:", resp.error);
            // Exit the script
            process.exit(1);
        }

        try {
            // Attempt to parse the JSON response
            const respList = JSON.parse(resp.value || '[]');
            
            // Iterate through the discovered network interfaces and print their names
            for (const interfaceItem of respList) {
                console.log(interfaceItem['{#IFNAME}']);
            }
        } catch (error) {
            console.error("Agent response decoding fails");
            // Exit the script if JSON decoding fails
            process.exit(1);
        }
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

// Run the main function
if (require.main === module) {
    main().catch(console.error);
} 