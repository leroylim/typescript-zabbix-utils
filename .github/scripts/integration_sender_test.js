#!/usr/bin/env node
"use strict";
// Copyright (C) 2001-2023 Zabbix SIA
//
// Zabbix SIA licenses this file under the MIT License.
// See the LICENSE file in the project root for more information.
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../../src");
class IntegrationSenderTest {
    constructor() {
        this.sender = null;
        this.host = 'localhost';
        this.port = 10051;
    }
    async setUp() {
        this.sender = new src_1.Sender({
            server: this.host,
            port: this.port
        });
    }
    async tearDown() {
        // No cleanup needed for Sender
    }
    async testSingleItem() {
        console.log('Testing single item send...');
        if (!this.sender) {
            throw new Error('Sender not initialized');
        }
        const item = new src_1.ItemValue('test_host', 'test.key', 'test_value');
        const result = await this.sender.send([item]);
        if (!(result instanceof src_1.TrapperResponse)) {
            throw new Error('Unexpected response type');
        }
        if (result.total === 0) {
            throw new Error('No items were processed');
        }
        console.log('✓ Single item send test passed');
    }
    async testMultipleItems() {
        console.log('Testing multiple items send...');
        if (!this.sender) {
            throw new Error('Sender not initialized');
        }
        const items = [
            new src_1.ItemValue('test_host', 'test.key1', 'value1'),
            new src_1.ItemValue('test_host', 'test.key2', 'value2'),
            new src_1.ItemValue('test_host', 'test.key3', 'value3')
        ];
        const result = await this.sender.send(items);
        if (!(result instanceof src_1.TrapperResponse)) {
            throw new Error('Unexpected response type');
        }
        if (result.total !== items.length) {
            throw new Error(`Expected ${items.length} items, got ${result.total}`);
        }
        console.log('✓ Multiple items send test passed');
    }
    async testItemWithTimestamp() {
        console.log('Testing item with timestamp...');
        if (!this.sender) {
            throw new Error('Sender not initialized');
        }
        const timestamp = Math.floor(Date.now() / 1000);
        const item = new src_1.ItemValue('test_host', 'test.timestamp', 'timestamped_value', timestamp);
        const result = await this.sender.send([item]);
        if (!(result instanceof src_1.TrapperResponse)) {
            throw new Error('Unexpected response type');
        }
        if (result.total === 0) {
            throw new Error('No items were processed');
        }
        console.log('✓ Item with timestamp test passed');
    }
    async testEmptyItemsList() {
        console.log('Testing empty items list...');
        if (!this.sender) {
            throw new Error('Sender not initialized');
        }
        try {
            await this.sender.send([]);
            throw new Error('Empty items list should have failed');
        }
        catch (error) {
            // Expected to fail
            console.log('✓ Empty items list test passed');
        }
    }
    async runAllTests() {
        try {
            await this.setUp();
            await this.testSingleItem();
            await this.testMultipleItems();
            await this.testItemWithTimestamp();
            await this.testEmptyItemsList();
            console.log('All sender tests passed - OK');
        }
        catch (error) {
            console.error('Sender test failed:', error);
            process.exit(1);
        }
        finally {
            await this.tearDown();
        }
    }
}
// Run the tests
const test = new IntegrationSenderTest();
test.runAllTests().catch(console.error);
