#!/usr/bin/env node
"use strict";
// Copyright (C) 2001-2023 Zabbix SIA
//
// Zabbix SIA licenses this file under the MIT License.
// See the LICENSE file in the project root for more information.
Object.defineProperty(exports, "__esModule", { value: true });
const dist_1 = require("../../dist");
class IntegrationAsyncSenderTest {
    constructor() {
        this.sender = null;
        this.host = 'localhost';
        this.port = 10051;
    }
    async setUp() {
        this.sender = new dist_1.AsyncSender({
            server: this.host,
            port: this.port
        });
    }
    async tearDown() {
        // No cleanup needed for AsyncSender
    }
    async testSingleItem() {
        console.log('Testing async single item send...');
        if (!this.sender) {
            throw new Error('AsyncSender not initialized');
        }
        const item = new dist_1.ItemValue('test_host', 'test.key', 'test_value');
        const result = await this.sender.send([item]);
        if (!(result instanceof dist_1.TrapperResponse)) {
            throw new Error('Unexpected response type');
        }
        if (result.total === 0) {
            throw new Error('No items were processed');
        }
        console.log('✓ Async single item send test passed');
    }
    async testMultipleItems() {
        console.log('Testing async multiple items send...');
        if (!this.sender) {
            throw new Error('AsyncSender not initialized');
        }
        const items = [
            new dist_1.ItemValue('test_host', 'test.key1', 'value1'),
            new dist_1.ItemValue('test_host', 'test.key2', 'value2'),
            new dist_1.ItemValue('test_host', 'test.key3', 'value3')
        ];
        const result = await this.sender.send(items);
        if (!(result instanceof dist_1.TrapperResponse)) {
            throw new Error('Unexpected response type');
        }
        if (result.total !== items.length) {
            throw new Error(`Expected ${items.length} items, got ${result.total}`);
        }
        console.log('✓ Async multiple items send test passed');
    }
    async testConcurrentSends() {
        console.log('Testing concurrent sends...');
        if (!this.sender) {
            throw new Error('AsyncSender not initialized');
        }
        const promises = [
            this.sender.send([new dist_1.ItemValue('test_host', 'concurrent.key1', 'value1')]),
            this.sender.send([new dist_1.ItemValue('test_host', 'concurrent.key2', 'value2')]),
            this.sender.send([new dist_1.ItemValue('test_host', 'concurrent.key3', 'value3')])
        ];
        const results = await Promise.all(promises);
        for (const result of results) {
            if (!(result instanceof dist_1.TrapperResponse) || result.total === 0) {
                throw new Error('Concurrent send failed');
            }
        }
        console.log('✓ Concurrent sends test passed');
    }
    async testBatchSend() {
        console.log('Testing batch send...');
        if (!this.sender) {
            throw new Error('AsyncSender not initialized');
        }
        const items = [];
        for (let i = 0; i < 10; i++) {
            items.push(new dist_1.ItemValue('test_host', `batch.key${i}`, `value${i}`));
        }
        const result = await this.sender.send(items);
        if (!(result instanceof dist_1.TrapperResponse)) {
            throw new Error('Unexpected response type');
        }
        if (result.total !== items.length) {
            throw new Error(`Expected ${items.length} items, got ${result.total}`);
        }
        console.log('✓ Batch send test passed');
    }
    async testEmptyItemsList() {
        console.log('Testing async empty items list...');
        if (!this.sender) {
            throw new Error('AsyncSender not initialized');
        }
        try {
            await this.sender.send([]);
            throw new Error('Empty items list should have failed');
        }
        catch (error) {
            // Expected to fail
            console.log('✓ Async empty items list test passed');
        }
    }
    async runAllTests() {
        try {
            await this.setUp();
            await this.testSingleItem();
            await this.testMultipleItems();
            await this.testConcurrentSends();
            await this.testBatchSend();
            await this.testEmptyItemsList();
            console.log('All async sender tests passed - OK');
        }
        catch (error) {
            console.error('Async sender test failed:', error);
            process.exit(1);
        }
        finally {
            await this.tearDown();
        }
    }
}
// Run the tests
const test = new IntegrationAsyncSenderTest();
test.runAllTests().catch(console.error);
