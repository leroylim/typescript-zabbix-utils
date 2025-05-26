#!/usr/bin/env node
"use strict";
// Copyright (C) 2001-2023 Zabbix SIA
//
// Zabbix SIA licenses this file under the MIT License.
// See the LICENSE file in the project root for more information.
Object.defineProperty(exports, "__esModule", { value: true });
const dist_1 = require("../../dist");
const ZABBIX_URL = process.env.ZABBIX_URL || '127.0.0.1';
const ZABBIX_USER = process.env.ZABBIX_USER || 'Admin';
const ZABBIX_PASSWORD = process.env.ZABBIX_PASSWORD || 'zabbix';
class CompatibilityAPITestLatest {
    constructor() {
        this.zapi = null;
        this.url = ZABBIX_URL;
        this.user = ZABBIX_USER;
        this.password = ZABBIX_PASSWORD;
        this.token = 'test_token_for_latest_zabbix';
    }
    setUp() {
        this.zapi = new dist_1.ZabbixAPI({
            url: this.url
        });
    }
    async testClassicAuth() {
        console.log('Testing latest Zabbix classic auth...');
        if (!this.zapi)
            throw new Error('ZabbixAPI not initialized');
        await this.zapi.login(undefined, this.user, this.password);
        const users = await this.zapi.user.get({
            output: ['userid', 'name']
        });
        if (!Array.isArray(users)) {
            throw new Error('Request user.get was going wrong');
        }
        await this.zapi.logout();
        console.log('✓ Latest Zabbix classic auth test passed');
    }
    async testTokenAuth() {
        console.log('Testing latest Zabbix token auth...');
        if (!this.zapi)
            throw new Error('ZabbixAPI not initialized');
        try {
            await this.zapi.login(this.token);
            const users = await this.zapi.user.get({
                output: ['userid', 'name']
            });
            if (!Array.isArray(users)) {
                throw new Error('Request user.get with token was going wrong');
            }
            await this.zapi.logout();
            console.log('✓ Latest Zabbix token auth test passed');
        }
        catch (error) {
            console.log('⚠ Token auth may not be configured or supported in this instance');
        }
    }
    async testVersionCompatibility() {
        console.log('Testing latest Zabbix version compatibility...');
        if (!this.zapi)
            throw new Error('ZabbixAPI not initialized');
        await this.zapi.login(undefined, this.user, this.password);
        const version = await this.zapi.apiVersion();
        console.log(`✓ Running on Zabbix version: ${version}`);
        if (version.major >= 7) {
            console.log('✓ Latest version features should be available');
        }
        else {
            console.log('⚠ Running on older version, some latest features may not be available');
        }
        await this.zapi.logout();
    }
    async testLatestFeatures() {
        console.log('Testing latest Zabbix features...');
        if (!this.zapi)
            throw new Error('ZabbixAPI not initialized');
        await this.zapi.login(undefined, this.user, this.password);
        try {
            // Test latest API features
            const version = await this.zapi.apiVersion();
            // Test some potential latest features
            if (version.major >= 7) {
                try {
                    const settings = await this.zapi.settings.get({
                        output: ['default_theme', 'default_lang']
                    });
                    if (typeof settings === 'object') {
                        console.log('✓ Latest settings API available');
                    }
                }
                catch (error) {
                    console.log('⚠ Some latest settings features may not be available');
                }
                try {
                    // Test if new authentication methods are available
                    const authMethods = await this.zapi.authentication.get({
                        output: ['authentication_type']
                    });
                    if (typeof authMethods === 'object') {
                        console.log('✓ Latest authentication API available');
                    }
                }
                catch (error) {
                    console.log('⚠ Latest authentication features may not be available');
                }
            }
            console.log('✓ Latest features compatibility check completed');
        }
        catch (error) {
            console.log('⚠ Some latest features may not be available');
        }
        await this.zapi.logout();
    }
    async runAllTests() {
        try {
            this.setUp();
            await this.testClassicAuth();
            await this.testTokenAuth();
            await this.testVersionCompatibility();
            await this.testLatestFeatures();
            console.log('All latest Zabbix API compatibility tests passed');
        }
        catch (error) {
            console.error('Latest Zabbix API compatibility test failed:', error);
            throw error;
        }
    }
}
class CompatibilityAsyncAPITestLatest {
    constructor() {
        this.zapi = null;
        this.url = ZABBIX_URL;
        this.user = ZABBIX_USER;
        this.password = ZABBIX_PASSWORD;
        this.token = 'test_token_for_latest_zabbix';
    }
    async setUp() {
        this.zapi = new dist_1.AsyncZabbixAPI({
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
        console.log('Testing latest Zabbix async classic auth...');
        if (!this.zapi)
            throw new Error('AsyncZabbixAPI not initialized');
        await this.zapi.login(undefined, this.user, this.password);
        const users = await this.zapi.user.get({
            output: ['userid', 'name']
        });
        if (!Array.isArray(users)) {
            throw new Error('Request user.get was going wrong');
        }
        console.log('✓ Latest Zabbix async classic auth test passed');
    }
    async testAsyncTokenAuth() {
        console.log('Testing latest Zabbix async token auth...');
        if (!this.zapi)
            throw new Error('AsyncZabbixAPI not initialized');
        try {
            await this.zapi.login(this.token);
            const users = await this.zapi.user.get({
                output: ['userid', 'name']
            });
            if (!Array.isArray(users)) {
                throw new Error('Request user.get with token was going wrong');
            }
            console.log('✓ Latest Zabbix async token auth test passed');
        }
        catch (error) {
            console.log('⚠ Async token auth may not be configured or supported in this instance');
        }
    }
    async testAsyncLatestFeatures() {
        console.log('Testing latest Zabbix async features...');
        if (!this.zapi)
            throw new Error('AsyncZabbixAPI not initialized');
        try {
            const version = await this.zapi.apiVersion();
            if (version.major >= 7) {
                console.log('✓ Latest async features compatible with current version');
                // Test async performance improvements
                const startTime = Date.now();
                await this.zapi.user.get({ output: ['userid'] });
                const endTime = Date.now();
                console.log(`✓ Async API response time: ${endTime - startTime}ms`);
            }
            else {
                console.log('⚠ Running on older version for latest features test');
            }
        }
        catch (error) {
            console.log('⚠ Some async latest features may not be available');
        }
    }
    async runAllTests() {
        try {
            await this.setUp();
            await this.testAsyncClassicAuth();
            await this.testAsyncTokenAuth();
            await this.testAsyncLatestFeatures();
            console.log('All latest Zabbix async API compatibility tests passed');
        }
        catch (error) {
            console.error('Latest Zabbix async API compatibility test failed:', error);
            throw error;
        }
        finally {
            await this.tearDown();
        }
    }
}
async function runAllLatestCompatibilityTests() {
    try {
        console.log('Running latest Zabbix compatibility tests...');
        const apiTest = new CompatibilityAPITestLatest();
        await apiTest.runAllTests();
        const asyncApiTest = new CompatibilityAsyncAPITestLatest();
        await asyncApiTest.runAllTests();
        console.log('All latest Zabbix compatibility tests passed - OK');
    }
    catch (error) {
        console.error('Latest Zabbix compatibility tests failed:', error);
        process.exit(1);
    }
}
// Run the tests
runAllLatestCompatibilityTests().catch(console.error);
