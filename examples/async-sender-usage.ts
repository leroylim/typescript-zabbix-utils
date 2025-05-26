// Copyright (C) 2001-2023 Zabbix SIA
//
// Zabbix SIA licenses this file to you under the MIT License.
// See the LICENSE file in the project root for more information.

import { AsyncSender, ItemValue } from '../src';

async function main() {
    // Create an async Zabbix sender instance
    const sender = new AsyncSender({
        server: '127.0.0.1',
        port: 10051,
        timeout: 30
    });

    try {
        // Send a single value asynchronously
        console.log('Sending single value asynchronously...');
        const singleResponse = await sender.sendValue(
            'test_host',
            'test.key',
            '42'
        );
        console.log('Single value response:', singleResponse.toString());

        // Send multiple values asynchronously
        console.log('\nSending multiple values asynchronously...');
        const items = [
            new ItemValue('test_host', 'cpu.usage', '85.5'),
            new ItemValue('test_host', 'memory.usage', '67.2'),
            new ItemValue('test_host', 'disk.usage', '45.8'),
            new ItemValue('web_server', 'response.time', '120'),
            new ItemValue('db_server', 'connections', '45')
        ];

        const multiResponse = await sender.send(items);
        console.log('Multiple values response:', multiResponse.toString());
        console.log('Processed:', multiResponse.processed);
        console.log('Failed:', multiResponse.failed);
        console.log('Total:', multiResponse.total);
        console.log('Time spent:', multiResponse.time);

        // Send with custom timestamp
        console.log('\nSending with custom timestamp...');
        const customTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
        const timestampResponse = await sender.sendValue(
            'test_host',
            'historical.data',
            '123.45',
            customTime
        );
        console.log('Timestamp response:', timestampResponse.toString());

    } catch (error) {
        console.error('Error sending data to Zabbix:', error);
    }
}

// Run the example
if (require.main === module) {
    main().catch(console.error);
} 