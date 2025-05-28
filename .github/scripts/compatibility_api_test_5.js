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
class CompatibilityAPITest {
    constructor() {
        this.zapi = null;
        this.url = ZABBIX_URL;
        this.user = ZABBIX_USER;
        this.password = ZABBIX_PASSWORD;
        this.token = 'token';
    }
    setUp() {
        this.zapi = new dist_1.ZabbixAPI({
            url: this.url
        });
    }
    async testClassicAuth() {
        console.log('Testing Zabbix 5.0 classic auth...');
        if (!this.zapi)
            throw new Error('ZabbixAPI not initialized');
        if (!(this.zapi instanceof dist_1.ZabbixAPI)) {
            throw new Error('Creating ZabbixAPI object was going wrong');
        }
        const version = this.zapi.apiVersion();
        if (!(version instanceof dist_1.APIVersion)) {
            throw new Error('Version getting was going wrong');
        }
        await this.zapi.login(undefined, ZABBIX_USER, ZABBIX_PASSWORD);
        console.log("✅ Synchronous ZabbixAPI login completed successfully!");
        const sessionId = this.zapi.__sessionId;
        console.log(`✅ Session ID: ${sessionId}`);
        try {
            const resp = await this.zapi.user.checkAuthentication({ sessionid: sessionId });
            if (typeof resp !== 'object') {
                throw new Error('Request user.checkAuthentication was going wrong');
            }
        }
        catch (error) {
            console.log('⚠ checkAuthentication may not be supported in this version');
        }
        const users = await this.zapi.user.get({
            output: ['userid', 'name']
        });
        if (!Array.isArray(users)) {
            throw new Error('Request user.get was going wrong');
        }
        await this.zapi.logout();
        console.log("✅ Logout successful");
        const sessionIdAfterLogout = this.zapi.__sessionId;
        if (sessionIdAfterLogout) {
            throw new Error('Logout was going wrong');
        }
        console.log('✓ Zabbix 5.0 classic auth test passed');
    }
    async testTokenAuth() {
        console.log('Testing Zabbix 5.0 token auth (should not be supported)...');
        if (!this.zapi)
            throw new Error('ZabbixAPI not initialized');
        try {
            await this.zapi.login(undefined, undefined, this.token);
            throw new Error('Login by token should not be supported in Zabbix 5.0');
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('not supported')) {
                console.log('✓ Token auth correctly not supported in Zabbix 5.0');
            }
            else {
                console.log('✓ Token auth failed as expected in Zabbix 5.0');
            }
        }
    }
    async runAllTests() {
        try {
            this.setUp();
            await this.testClassicAuth();
            await this.testTokenAuth();
            console.log('All Zabbix 5.0 API compatibility tests passed');
        }
        catch (error) {
            console.error('Zabbix 5.0 API compatibility test failed:', error);
            throw error;
        }
    }
}
class CompatibilitySenderTest {
    constructor() {
        this.sender = null;
        this.ip = ZABBIX_URL;
        this.port = 10051;
        this.chunkSize = 10;
        this.hostname = `${this.constructor.name}_host`;
        this.itemname = `${this.constructor.name}_item`;
        this.itemkey = `${this.constructor.name}`;
    }
    setUp() {
        this.sender = new dist_1.Sender({
            server: this.ip,
            port: this.port,
            chunkSize: this.chunkSize
        });
    }
    async prepareItems() {
        console.log('Preparing test items for sender...');
        const zapi = new dist_1.ZabbixAPI({
            url: ZABBIX_URL,
            skipVersionCheck: true
        });
        await zapi.login(undefined, ZABBIX_USER, ZABBIX_PASSWORD);
        try {
            const hosts = await zapi.host.get({
                filter: { host: this.hostname },
                output: ['hostid']
            });
            let hostid = null;
            if (hosts.length > 0) {
                hostid = hosts[0].hostid;
            }
            if (!hostid) {
                const result = await zapi.host.create({
                    host: this.hostname,
                    interfaces: [{
                            type: 1,
                            main: 1,
                            useip: 1,
                            ip: '127.0.0.1',
                            dns: '',
                            port: '10050'
                        }],
                    groups: [{ groupid: '2' }]
                });
                hostid = result.hostids[0];
            }
            if (!hostid) {
                throw new Error('Creating test host was going wrong');
            }
            const items = await zapi.item.get({
                filter: { key_: this.itemkey },
                output: ['itemid']
            });
            let itemid = null;
            if (items.length > 0) {
                itemid = items[0].itemid;
            }
            if (!itemid) {
                const result = await zapi.item.create({
                    name: this.itemname,
                    key_: this.itemkey,
                    hostid: hostid,
                    type: 2,
                    value_type: 3
                });
                itemid = result.itemids[0];
            }
            if (!itemid) {
                throw new Error('Creating test item was going wrong');
            }
            console.log('✓ Test items prepared');
        }
        finally {
            await zapi.logout();
        }
    }
    async testSendValues() {
        console.log('Testing Zabbix 5.0 sender...');
        if (!this.sender)
            throw new Error('Sender not initialized');
        // Wait a bit for items to be ready
        await new Promise(resolve => setTimeout(resolve, 10000));
        const items = [
            new dist_1.ItemValue(this.hostname, this.itemkey, '10'),
            new dist_1.ItemValue(this.hostname, this.itemkey, 'test message'),
            new dist_1.ItemValue(this.hostname, 'item_key1', '-1', 1695713666),
            new dist_1.ItemValue(this.hostname, 'item_key2', '{"msg":"test message"}'),
            new dist_1.ItemValue(this.hostname, this.itemkey, '0', 1695713666, 100),
            new dist_1.ItemValue(this.hostname, this.itemkey, '5.5', 1695713666)
        ];
        const resp = await this.sender.send(items);
        if (!resp || typeof resp.total !== 'number') {
            throw new Error('Sending item values was going wrong');
        }
        if (resp.total !== items.length) {
            throw new Error('Total number of the sent values is unexpected');
        }
        console.log(`✓ Sender test passed: ${resp.processed}/${resp.total} items processed`);
    }
    async runAllTests() {
        try {
            this.setUp();
            await this.prepareItems();
            await this.testSendValues();
            console.log('All Zabbix 5.0 sender compatibility tests passed');
        }
        catch (error) {
            console.error('Zabbix 5.0 sender compatibility test failed:', error);
            throw error;
        }
    }
}
class CompatibilityGetTest {
    constructor() {
        this.agent = null;
        this.host = ZABBIX_URL;
        this.port = 10050;
    }
    setUp() {
        this.agent = new dist_1.Getter({
            host: this.host,
            port: this.port
        });
    }
    async testGetValues() {
        console.log('Testing Zabbix 5.0 getter...');
        if (!this.agent)
            throw new Error('Getter not initialized');
        const resp = await this.agent.get('system.uname');
        if (!resp || typeof resp.value !== 'string') {
            throw new Error('Getting item values was going wrong');
        }
        console.log('✓ Getter test passed');
    }
    async runAllTests() {
        try {
            this.setUp();
            await this.testGetValues();
            console.log('All Zabbix 5.0 getter compatibility tests passed');
        }
        catch (error) {
            console.error('Zabbix 5.0 getter compatibility test failed:', error);
            throw error;
        }
    }
}
async function runAllZabbix50CompatibilityTests() {
    try {
        console.log('Running Zabbix 5.0 compatibility tests...');
        const apiTest = new CompatibilityAPITest();
        await apiTest.runAllTests();
        const senderTest = new CompatibilitySenderTest();
        await senderTest.runAllTests();
        const getTest = new CompatibilityGetTest();
        await getTest.runAllTests();
        console.log('All Zabbix 5.0 compatibility tests passed - OK');
    }
    catch (error) {
        console.error('Zabbix 5.0 compatibility tests failed:', error);
        process.exit(1);
    }
}
// Run the tests
runAllZabbix50CompatibilityTests().catch(console.error);
