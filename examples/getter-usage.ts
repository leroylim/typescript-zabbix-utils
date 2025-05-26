// Copyright (C) 2001-2023 Zabbix SIA
//
// Zabbix SIA licenses this file to you under the MIT License.
// See the LICENSE file in the project root for more information.

import { Getter } from '../src';

async function main() {
    // Create a Zabbix getter instance
    const getter = new Getter({
        host: '127.0.0.1',
        port: 10050,
        timeout: 30
    });

    try {
        // Get system information
        console.log('Getting system information...');
        
        const keys = [
            'system.hostname',
            'system.uname',
            'agent.ping',
            'system.cpu.load[all,avg1]',
            'vm.memory.size[available]'
        ];

        for (const key of keys) {
            try {
                console.log(`\nGetting value for key: ${key}`);
                const response = await getter.get(key);
                
                if (response.error) {
                    console.log(`Error: ${response.error}`);
                } else {
                    console.log(`Value: ${response.value}`);
                }
                
                console.log(`Raw response: ${response.raw}`);
                
            } catch (error) {
                console.error(`Failed to get value for ${key}:`, error);
            }
        }

    } catch (error) {
        console.error('Error connecting to Zabbix agent:', error);
    }
}

// Run the example
if (require.main === module) {
    main().catch(console.error);
} 