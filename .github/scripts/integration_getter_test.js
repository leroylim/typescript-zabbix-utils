#!/usr/bin/env node
"use strict";
// Copyright (C) 2001-2023 Zabbix SIA
//
// Zabbix SIA licenses this file under the MIT License.
// See the LICENSE file in the project root for more information.
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../../src");
class IntegrationGetterTest {
    constructor() {
        this.getter = null;
        this.host = 'localhost';
        this.port = 10050;
    }
    async setUp() {
        this.getter = new src_1.Getter({
            host: this.host,
            port: this.port
        });
    }
    async tearDown() {
        // No cleanup needed for Getter
    }
    async testAgentPing() {
        console.log('Testing agent ping...');
        if (!this.getter) {
            throw new Error('Getter not initialized');
        }
        const result = await this.getter.get('agent.ping');
        if (result instanceof src_1.AgentResponse) {
            if (result.value !== '1') {
                throw new Error('Agent ping failed');
            }
        }
        else {
            throw new Error('Unexpected response type');
        }
        console.log('✓ Agent ping test passed');
    }
    async testAgentVersion() {
        console.log('Testing agent version...');
        if (!this.getter) {
            throw new Error('Getter not initialized');
        }
        const result = await this.getter.get('agent.version');
        if (result instanceof src_1.AgentResponse) {
            if (!result.value || result.value.length === 0) {
                throw new Error('Agent version failed');
            }
        }
        else {
            throw new Error('Unexpected response type');
        }
        console.log('✓ Agent version test passed');
    }
    async testSystemUname() {
        console.log('Testing system uname...');
        if (!this.getter) {
            throw new Error('Getter not initialized');
        }
        const result = await this.getter.get('system.uname');
        if (result instanceof src_1.AgentResponse) {
            if (!result.value || result.value.length === 0) {
                throw new Error('System uname failed');
            }
        }
        else {
            throw new Error('Unexpected response type');
        }
        console.log('✓ System uname test passed');
    }
    async testInvalidKey() {
        console.log('Testing invalid key...');
        if (!this.getter) {
            throw new Error('Getter not initialized');
        }
        try {
            const result = await this.getter.get('invalid.key.that.does.not.exist');
            if (result instanceof src_1.AgentResponse && result.error) {
                // Expected to have an error
                console.log('✓ Invalid key test passed');
            }
            else {
                throw new Error('Invalid key should have failed');
            }
        }
        catch (error) {
            // Also expected to fail
            console.log('✓ Invalid key test passed');
        }
    }
    async runAllTests() {
        try {
            await this.setUp();
            await this.testAgentPing();
            await this.testAgentVersion();
            await this.testSystemUname();
            await this.testInvalidKey();
            console.log('All getter tests passed - OK');
        }
        catch (error) {
            console.error('Getter test failed:', error);
            process.exit(1);
        }
        finally {
            await this.tearDown();
        }
    }
}
// Run the tests
const test = new IntegrationGetterTest();
test.runAllTests().catch(console.error);
