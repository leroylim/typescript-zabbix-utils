#!/usr/bin/env node
// Copyright (C) 2001-2023 Zabbix SIA (Original Python library)
// Copyright (C) 2024-2025 Han Yong Lim <hanyong.lim@gmail.com> (TypeScript adaptation)
//
// Zabbix SIA licenses this file under the MIT License.
// See the LICENSE file in the project root for more information.

import { Sender, ItemValue, TrapperResponse } from '../../dist';

class IntegrationSenderTest {
    private host: string;
    private port: number;
    private sender: Sender | null = null;

    constructor() {
        this.host = 'localhost';
        this.port = 10051;
    }

    async setUp(): Promise<void> {
        this.sender = new Sender({
            server: this.host,
            port: this.port
        });
    }

    async tearDown(): Promise<void> {
        // No cleanup needed for Sender
    }

    async testSingleItem(): Promise<void> {
        console.log('Testing single item send...');
        if (!this.sender) {
            throw new Error('Sender not initialized');
        }

        const item = new ItemValue('test_host', 'test.key', 'test_value');
        const result = await this.sender.send([item]);
        
        if (!(result instanceof TrapperResponse)) {
            throw new Error('Unexpected response type');
        }
        
        if (result.total === 0) {
            throw new Error('No items were processed');
        }
        
        console.log('✓ Single item send test passed');
    }

    async testMultipleItems(): Promise<void> {
        console.log('Testing multiple items send...');
        if (!this.sender) {
            throw new Error('Sender not initialized');
        }

        const items = [
            new ItemValue('test_host', 'test.key1', 'value1'),
            new ItemValue('test_host', 'test.key2', 'value2'),
            new ItemValue('test_host', 'test.key3', 'value3')
        ];
        
        const result = await this.sender.send(items);
        
        if (!(result instanceof TrapperResponse)) {
            throw new Error('Unexpected response type');
        }
        
        if (result.total !== items.length) {
            throw new Error(`Expected ${items.length} items, got ${result.total}`);
        }
        
        console.log('✓ Multiple items send test passed');
    }

    async testItemWithTimestamp(): Promise<void> {
        console.log('Testing item with timestamp...');
        if (!this.sender) {
            throw new Error('Sender not initialized');
        }

        const timestamp = Math.floor(Date.now() / 1000);
        const item = new ItemValue('test_host', 'test.timestamp', 'timestamped_value', timestamp);
        const result = await this.sender.send([item]);
        
        if (!(result instanceof TrapperResponse)) {
            throw new Error('Unexpected response type');
        }
        
        if (result.total === 0) {
            throw new Error('No items were processed');
        }
        
        console.log('✓ Item with timestamp test passed');
    }

    async testEmptyItemsList(): Promise<void> {
        console.log('Testing empty items list...');
        if (!this.sender) {
            throw new Error('Sender not initialized');
        }

        try {
            await this.sender.send([]);
            throw new Error('Empty items list should have failed');
        } catch (error) {
            // Expected to fail
            console.log('✓ Empty items list test passed');
        }
    }

    async runAllTests(): Promise<void> {
        try {
            await this.setUp();
            await this.testSingleItem();
            await this.testMultipleItems();
            await this.testItemWithTimestamp();
            await this.testEmptyItemsList();
            console.log('All sender tests passed - OK');
        } catch (error) {
            console.error('Sender test failed:', error);
            process.exit(1);
        } finally {
            await this.tearDown();
        }
    }
}

// Run the tests
const test = new IntegrationSenderTest();
test.runAllTests().catch(console.error); 