#!/usr/bin/env node
"use strict";
// Copyright (C) 2001-2023 Zabbix SIA
//
// Zabbix SIA licenses this file under the MIT License.
// See the LICENSE file in the project root for more information.
Object.defineProperty(exports, "__esModule", { value: true });
const dist_1 = require("../../dist");
class IntegrationAPITest {
    constructor() {
        this.zapi = null;
        this.url = 'localhost';
        this.user = 'Admin';
        this.password = 'zabbix';
    }
    async setUp() {
        this.zapi = new dist_1.ZabbixAPI({
            url: this.url,
            user: this.user,
            password: this.password,
            skipVersionCheck: true
        });
    }
    async tearDown() {
        if (this.zapi) {
            this.zapi.logout();
        }
    }
    async testLogin() {
        console.log('Testing login...');
        if (!this.zapi) {
            throw new Error('ZabbixAPI not initialized');
        }
        if (!(this.zapi instanceof dist_1.ZabbixAPI)) {
            throw new Error('Login was going wrong');
        }
        const version = this.zapi.apiVersion();
        if (!(version instanceof dist_1.APIVersion)) {
            throw new Error('Version getting was going wrong');
        }
        console.log('✓ Login test passed');
    }
    async testVersionGet() {
        console.log('Testing version get...');
        if (!this.zapi) {
            throw new Error('ZabbixAPI not initialized');
        }
        const version = await this.zapi.apiinfo.version();
        const apiVersion = this.zapi.apiVersion();
        if (version !== apiVersion.toString()) {
            throw new Error('Request apiinfo.version was going wrong');
        }
        console.log('✓ Version get test passed');
    }
    async testCheckAuth() {
        console.log('Testing check authentication...');
        if (!this.zapi) {
            throw new Error('ZabbixAPI not initialized');
        }
        let resp;
        const sessionId = this.zapi.__sessionId;
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
        console.log('✓ Check authentication test passed');
    }
    async testUserGet() {
        console.log('Testing user get...');
        if (!this.zapi) {
            throw new Error('ZabbixAPI not initialized');
        }
        const users = await this.zapi.user.get({
            output: ['userid', 'name']
        });
        if (!Array.isArray(users)) {
            throw new Error('Request user.get was going wrong');
        }
        console.log('✓ User get test passed');
    }
    async testHostGet() {
        console.log('Testing host get...');
        if (!this.zapi) {
            throw new Error('ZabbixAPI not initialized');
        }
        const hosts = await this.zapi.host_.get_({
            output: ['hostid', 'host']
        });
        if (!Array.isArray(hosts)) {
            throw new Error('Request host.get was going wrong');
        }
        console.log('✓ Host get test passed');
    }
    async runAllTests() {
        try {
            await this.setUp();
            await this.testLogin();
            await this.testVersionGet();
            await this.testCheckAuth();
            await this.testUserGet();
            await this.testHostGet();
            console.log('All tests passed - OK');
        }
        catch (error) {
            console.error('Test failed:', error);
            process.exit(1);
        }
        finally {
            await this.tearDown();
        }
    }
}
// Run the tests
const test = new IntegrationAPITest();
test.runAllTests().catch(console.error);
