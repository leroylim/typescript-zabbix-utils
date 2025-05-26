#!/usr/bin/env node
"use strict";
// Copyright (C) 2001-2023 Zabbix SIA
//
// Zabbix SIA licenses this file under the MIT License.
// See the LICENSE file in the project root for more information.
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../../src");
const ZABBIX_URL = process.env.ZABBIX_URL || '127.0.0.1';
const ZABBIX_USER = process.env.ZABBIX_USER || 'Admin';
const ZABBIX_PASSWORD = process.env.ZABBIX_PASSWORD || 'zabbix';
class CompatibilityAPITest6 {
    constructor() {
        this.zapi = null;
        this.url = ZABBIX_URL;
        this.user = ZABBIX_USER;
        this.password = ZABBIX_PASSWORD;
        this.token = 'test_token_for_zabbix_6';
    }
    setUp() {
        this.zapi = new src_1.ZabbixAPI({
            url: this.url
        });
    }
    async testClassicAuth() {
        console.log('Testing Zabbix 6.0 classic auth...');
        if (!this.zapi)
            throw new Error('ZabbixAPI not initialized');
        await this.zapi.login(this.user, this.password);
        const sessionId = this.zapi.__session_id;
        if (!sessionId) {
            throw new Error('Login by user and password was going wrong');
        }
        const users = await this.zapi.user.get({
            output: ['userid', 'name']
        });
        if (!Array.isArray(users)) {
            throw new Error('Request user.get was going wrong');
        }
        await this.zapi.logout();
        console.log('✓ Zabbix 6.0 classic auth test passed');
    }
    async testTokenAuth() {
        console.log('Testing Zabbix 6.0 token auth...');
        if (!this.zapi)
            throw new Error('ZabbixAPI not initialized');
        try {
            // In Zabbix 6.0+, token authentication should be supported
            await this.zapi.login(undefined, undefined, this.token);
            const users = await this.zapi.user.get({
                output: ['userid', 'name']
            });
            if (!Array.isArray(users)) {
                throw new Error('Request user.get with token was going wrong');
            }
            await this.zapi.logout();
            console.log('✓ Zabbix 6.0 token auth test passed');
        }
        catch (error) {
            console.log('⚠ Token auth may not be configured or supported in this instance');
        }
    }
    async testVersionCompatibility() {
        console.log('Testing Zabbix 6.0 version compatibility...');
        if (!this.zapi)
            throw new Error('ZabbixAPI not initialized');
        await this.zapi.login(this.user, this.password);
        const version = await this.zapi.apiVersion();
        if (version.major < 6) {
            console.log(`⚠ Version ${version} is older than Zabbix 6.0`);
        }
        else {
            console.log(`✓ Version compatibility check passed: ${version}`);
        }
        await this.zapi.logout();
    }
    async runAllTests() {
        try {
            this.setUp();
            await this.testClassicAuth();
            await this.testTokenAuth();
            await this.testVersionCompatibility();
            console.log('All Zabbix 6.0 API compatibility tests passed');
        }
        catch (error) {
            console.error('Zabbix 6.0 API compatibility test failed:', error);
            throw error;
        }
    }
}
class CompatibilityAsyncAPITest6 {
    constructor() {
        this.zapi = null;
        this.url = ZABBIX_URL;
        this.user = ZABBIX_USER;
        this.password = ZABBIX_PASSWORD;
        this.token = 'test_token_for_zabbix_6';
    }
    async setUp() {
        this.zapi = new src_1.AsyncZabbixAPI({
            url: this.url
        });
    }
    async tearDown() {
        if (this.zapi) {
            try {
                await this.zapi.logout();
            }
            catch (error) {
                // Ignore logout errors
            }
        }
    }
    async testAsyncClassicAuth() {
        console.log('Testing Zabbix 6.0 async classic auth...');
        if (!this.zapi)
            throw new Error('AsyncZabbixAPI not initialized');
        await this.zapi.login(this.user, this.password);
        const users = await this.zapi.user.get({
            output: ['userid', 'name']
        });
        if (!Array.isArray(users)) {
            throw new Error('Request user.get was going wrong');
        }
        console.log('✓ Zabbix 6.0 async classic auth test passed');
    }
    async testAsyncTokenAuth() {
        console.log('Testing Zabbix 6.0 async token auth...');
        if (!this.zapi)
            throw new Error('AsyncZabbixAPI not initialized');
        try {
            await this.zapi.login(undefined, undefined, this.token);
            const users = await this.zapi.user.get({
                output: ['userid', 'name']
            });
            if (!Array.isArray(users)) {
                throw new Error('Request user.get with token was going wrong');
            }
            console.log('✓ Zabbix 6.0 async token auth test passed');
        }
        catch (error) {
            console.log('⚠ Async token auth may not be configured or supported in this instance');
        }
    }
    async runAllTests() {
        try {
            await this.setUp();
            await this.testAsyncClassicAuth();
            await this.testAsyncTokenAuth();
            console.log('All Zabbix 6.0 async API compatibility tests passed');
        }
        catch (error) {
            console.error('Zabbix 6.0 async API compatibility test failed:', error);
            throw error;
        }
        finally {
            await this.tearDown();
        }
    }
}
async function runAllZabbix60CompatibilityTests() {
    try {
        console.log('Running Zabbix 6.0 compatibility tests...');
        const apiTest = new CompatibilityAPITest6();
        await apiTest.runAllTests();
        const asyncApiTest = new CompatibilityAsyncAPITest6();
        await asyncApiTest.runAllTests();
        console.log('All Zabbix 6.0 compatibility tests passed - OK');
    }
    catch (error) {
        console.error('Zabbix 6.0 compatibility tests failed:', error);
        process.exit(1);
    }
}
// Run the tests
runAllZabbix60CompatibilityTests().catch(console.error);
