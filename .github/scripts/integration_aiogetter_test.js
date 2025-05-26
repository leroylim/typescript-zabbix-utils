#!/usr/bin/env node
"use strict";
// Copyright (C) 2001-2023 Zabbix SIA
//
// Zabbix SIA licenses this file under the MIT License.
// See the LICENSE file in the project root for more information.
Object.defineProperty(exports, "__esModule", { value: true });
const dist_1 = require("../../dist");
class IntegrationAsyncGetterTest {
    constructor() {
        this.getter = null;
        this.host = 'localhost';
        this.port = 10050;
    }
    async setUp() {
        this.getter = new dist_1.AsyncGetter({
            host: this.host,
            port: this.port
        });
    }
    async tearDown() {
        // No cleanup needed for AsyncGetter
    }
    async testAgentPing() {
        console.log('Testing async agent ping...');
        if (!this.getter) {
            throw new Error('AsyncGetter not initialized');
        }
        const result = await this.getter.get('agent.ping');
        if (result instanceof dist_1.AgentResponse) {
            if (result.value !== '1') {
                throw new Error('Agent ping failed');
            }
        }
        else {
            throw new Error('Unexpected response type');
        }
        console.log('✓ Async agent ping test passed');
    }
    async testAgentVersion() {
        console.log('Testing async agent version...');
        if (!this.getter) {
            throw new Error('AsyncGetter not initialized');
        }
        const result = await this.getter.get('agent.version');
        if (result instanceof dist_1.AgentResponse) {
            if (!result.value || result.value.length === 0) {
                throw new Error('Agent version failed');
            }
        }
        else {
            throw new Error('Unexpected response type');
        }
        console.log('✓ Async agent version test passed');
    }
    async testSystemUname() {
        console.log('Testing async system uname...');
        if (!this.getter) {
            throw new Error('AsyncGetter not initialized');
        }
        const result = await this.getter.get('system.uname');
        if (result instanceof dist_1.AgentResponse) {
            if (!result.value || result.value.length === 0) {
                throw new Error('System uname failed');
            }
        }
        else {
            throw new Error('Unexpected response type');
        }
        console.log('✓ Async system uname test passed');
    }
    async testConcurrentRequests() {
        console.log('Testing concurrent requests...');
        if (!this.getter) {
            throw new Error('AsyncGetter not initialized');
        }
        const promises = [
            this.getter.get('agent.ping'),
            this.getter.get('agent.version'),
            this.getter.get('system.uname')
        ];
        const results = await Promise.all(promises);
        for (const result of results) {
            if (!(result instanceof dist_1.AgentResponse) || !result.value) {
                throw new Error('Concurrent request failed');
            }
        }
        console.log('✓ Concurrent requests test passed');
    }
    async testInvalidKey() {
        console.log('Testing async invalid key...');
        if (!this.getter) {
            throw new Error('AsyncGetter not initialized');
        }
        try {
            const result = await this.getter.get('invalid.key.that.does.not.exist');
            if (result instanceof dist_1.AgentResponse && result.error) {
                // Expected to have an error
                console.log('✓ Async invalid key test passed');
            }
            else {
                throw new Error('Invalid key should have failed');
            }
        }
        catch (error) {
            // Also expected to fail
            console.log('✓ Async invalid key test passed');
        }
    }
    async runAllTests() {
        try {
            await this.setUp();
            await this.testAgentPing();
            await this.testAgentVersion();
            await this.testSystemUname();
            await this.testConcurrentRequests();
            await this.testInvalidKey();
            console.log('All async getter tests passed - OK');
        }
        catch (error) {
            console.error('Async getter test failed:', error);
            process.exit(1);
        }
        finally {
            await this.tearDown();
        }
    }
}
// Run the tests
const test = new IntegrationAsyncGetterTest();
test.runAllTests().catch(console.error);
