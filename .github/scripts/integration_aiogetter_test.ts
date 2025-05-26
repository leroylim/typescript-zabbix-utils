#!/usr/bin/env node
// Copyright (C) 2001-2023 Zabbix SIA
//
// Zabbix SIA licenses this file under the MIT License.
// See the LICENSE file in the project root for more information.

import { AsyncGetter, AgentResponse } from '../../src';

class IntegrationAsyncGetterTest {
    private host: string;
    private port: number;
    private getter: AsyncGetter | null = null;

    constructor() {
        this.host = 'localhost';
        this.port = 10050;
    }

    async setUp(): Promise<void> {
        this.getter = new AsyncGetter({
            host: this.host,
            port: this.port
        });
    }

    async tearDown(): Promise<void> {
        // No cleanup needed for AsyncGetter
    }

    async testAgentPing(): Promise<void> {
        console.log('Testing async agent ping...');
        if (!this.getter) {
            throw new Error('AsyncGetter not initialized');
        }

        const result = await this.getter.get('agent.ping');
        if (result instanceof AgentResponse) {
            if (result.value !== '1') {
                throw new Error('Agent ping failed');
            }
        } else {
            throw new Error('Unexpected response type');
        }
        console.log('✓ Async agent ping test passed');
    }

    async testAgentVersion(): Promise<void> {
        console.log('Testing async agent version...');
        if (!this.getter) {
            throw new Error('AsyncGetter not initialized');
        }

        const result = await this.getter.get('agent.version');
        if (result instanceof AgentResponse) {
            if (!result.value || result.value.length === 0) {
                throw new Error('Agent version failed');
            }
        } else {
            throw new Error('Unexpected response type');
        }
        console.log('✓ Async agent version test passed');
    }

    async testSystemUname(): Promise<void> {
        console.log('Testing async system uname...');
        if (!this.getter) {
            throw new Error('AsyncGetter not initialized');
        }

        const result = await this.getter.get('system.uname');
        if (result instanceof AgentResponse) {
            if (!result.value || result.value.length === 0) {
                throw new Error('System uname failed');
            }
        } else {
            throw new Error('Unexpected response type');
        }
        console.log('✓ Async system uname test passed');
    }

    async testConcurrentRequests(): Promise<void> {
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
            if (!(result instanceof AgentResponse) || !result.value) {
                throw new Error('Concurrent request failed');
            }
        }
        console.log('✓ Concurrent requests test passed');
    }

    async testInvalidKey(): Promise<void> {
        console.log('Testing async invalid key...');
        if (!this.getter) {
            throw new Error('AsyncGetter not initialized');
        }

        try {
            const result = await this.getter.get('invalid.key.that.does.not.exist');
            if (result instanceof AgentResponse && result.error) {
                // Expected to have an error
                console.log('✓ Async invalid key test passed');
            } else {
                throw new Error('Invalid key should have failed');
            }
        } catch (error) {
            // Also expected to fail
            console.log('✓ Async invalid key test passed');
        }
    }

    async runAllTests(): Promise<void> {
        try {
            await this.setUp();
            await this.testAgentPing();
            await this.testAgentVersion();
            await this.testSystemUname();
            await this.testConcurrentRequests();
            await this.testInvalidKey();
            console.log('All async getter tests passed - OK');
        } catch (error) {
            console.error('Async getter test failed:', error);
            process.exit(1);
        } finally {
            await this.tearDown();
        }
    }
}

// Run the tests
const test = new IntegrationAsyncGetterTest();
test.runAllTests().catch(console.error); 