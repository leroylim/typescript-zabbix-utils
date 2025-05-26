#!/usr/bin/env node
"use strict";
// Copyright (C) 2001-2023 Zabbix SIA
//
// Zabbix SIA licenses this file under the MIT License.
// See the LICENSE file in the project root for more information.
Object.defineProperty(exports, "__esModule", { value: true });
const dist_1 = require("../../dist");
class IntegrationAsyncAPITest {
    constructor() {
        this.zapi = null;
        this.url = 'localhost';
        this.user = 'Admin';
        this.password = 'zabbix';
    }
    async setUp() {
        this.zapi = new dist_1.AsyncZabbixAPI({
            url: this.url,
            skipVersionCheck: true
        });
        await this.zapi.login(undefined, this.user, this.password);
    }
    async tearDown() {
        if (this.zapi) {
            await this.zapi.logout();
        }
    }
    async testLogin() {
        console.log('Testing async login...');
        if (!this.zapi) {
            throw new Error('AsyncZabbixAPI not initialized');
        }
        if (!(this.zapi instanceof dist_1.AsyncZabbixAPI)) {
            throw new Error('Login was going wrong');
        }
        const version = this.zapi.apiVersion();
        if (!(version instanceof dist_1.APIVersion)) {
            throw new Error('Version getting was going wrong');
        }
        console.log('✓ Async login test passed');
    }
    async testVersionGet() {
        console.log('Testing async version get...');
        if (!this.zapi) {
            throw new Error('AsyncZabbixAPI not initialized');
        }
        const version = await this.zapi.apiinfo.version();
        const apiVersion = this.zapi.apiVersion();
        if (version !== apiVersion.toString()) {
            throw new Error('Request apiinfo.version was going wrong');
        }
        console.log('✓ Async version get test passed');
    }
    async testCheckAuth() {
        console.log('Testing async check authentication...');
        if (!this.zapi) {
            throw new Error('AsyncZabbixAPI not initialized');
        }
        let resp;
        const sessionId = this.zapi.__session_id;
        const token = this.zapi.__token;
        if (sessionId === token) {
            resp = await this.zapi.user.checkAuthentication({ token: sessionId });
        }
        else {
            resp = await this.zapi.user.checkAuthentication({ sessionid: sessionId });
        }
        if (typeof resp !== 'object' || resp === null) {
            throw new Error('Request user.checkAuthentication was going wrong');
        }
        console.log('✓ Async check authentication test passed');
    }
    async testUserGet() {
        console.log('Testing async user get...');
        if (!this.zapi) {
            throw new Error('AsyncZabbixAPI not initialized');
        }
        const users = await this.zapi.user.get({
            output: ['userid', 'name']
        });
        if (!Array.isArray(users)) {
            throw new Error('Request user.get was going wrong');
        }
        console.log('✓ Async user get test passed');
    }
    async testHostGet() {
        console.log('Testing async host get...');
        if (!this.zapi) {
            throw new Error('AsyncZabbixAPI not initialized');
        }
        const hosts = await this.zapi.host_.get_({
            output: ['hostid', 'host']
        });
        if (!Array.isArray(hosts)) {
            throw new Error('Request host.get was going wrong');
        }
        console.log('✓ Async host get test passed');
    }
    async runAllTests() {
        try {
            await this.setUp();
            await this.testLogin();
            await this.testVersionGet();
            await this.testCheckAuth();
            await this.testUserGet();
            await this.testHostGet();
            console.log('All async tests passed - OK');
        }
        catch (error) {
            console.error('Async test failed:', error);
            process.exit(1);
        }
        finally {
            await this.tearDown();
        }
    }
}
// Run the tests
const test = new IntegrationAsyncAPITest();
test.runAllTests().catch(console.error);
