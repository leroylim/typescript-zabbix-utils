// Copyright (C) 2001-2023 Zabbix SIA
//
// Zabbix SIA licenses this file to you under the MIT License.
// See the LICENSE file in the project root for more information.

import { AsyncGetter } from '../src';

async function main() {
    // Create an async Zabbix getter instance
    const getter = new AsyncGetter({
        host: '127.0.0.1',
        port: 10050,
        timeout: 30
    });

    try {
        // Get system information asynchronously
        console.log('Getting system information asynchronously...');
        
        const keys = [
            'system.hostname',
            'system.uname',
            'agent.ping',
            'system.cpu.load[all,avg1]',
            'vm.memory.size[available]',
            'vfs.fs.size[/,used]'
        ];

        // Process keys concurrently
        const promises = keys.map(async (key) => {
            try {
                console.log(`\nGetting value for key: ${key}`);
                const response = await getter.get(key);
                
                return {
                    key,
                    success: true,
                    response
                };
                
            } catch (error) {
                return {
                    key,
                    success: false,
                    error: error instanceof Error ? error.message : String(error)
                };
            }
        });

        const results = await Promise.all(promises);

        console.log('\n=== Results ===');
        for (const result of results) {
            if (result.success) {
                const response = result.response!;
                if (response.error) {
                    console.log(`${result.key}: Error - ${response.error}`);
                } else {
                    console.log(`${result.key}: ${response.value}`);
                }
                console.log(`  Raw response: ${response.raw}`);
            } else {
                console.log(`${result.key}: Failed - ${result.error}`);
            }
        }

        // Sequential processing example
        console.log('\n=== Sequential Processing ===');
        for (const key of ['agent.ping', 'agent.version']) {
            try {
                console.log(`Getting ${key}...`);
                const response = await getter.get(key);
                console.log(`  Value: ${response.value}`);
            } catch (error) {
                console.log(`  Error: ${error}`);
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