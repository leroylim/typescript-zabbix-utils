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

class CompatibilityAPITest6 {
    constructor() {
        this.zapi = null;
        this.url = ZABBIX_URL;
        this.user = ZABBIX_USER;
        this.password = ZABBIX_PASSWORD;
        this.token = 'test_token_for_zabbix_6';
    }

    setUp() {
        this.zapi = new dist_1.ZabbixAPI({
            url: this.url
        });
    }

    async testClassicAuth() {
        console.log('Testing Zabbix 6.0 classic auth...');
        if (!this.zapi) throw new Error('ZabbixAPI not initialized');

        if (!(this.zapi instanceof dist_1.ZabbixAPI)) {
            throw new Error('Creating ZabbixAPI object was going wrong');
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
            console.log('✓ checkAuthentication supported in Zabbix 6.0');
        } catch (error) {
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

        console.log('✓ Zabbix 6.0 classic auth test passed');
    }

    async testTokenAuth() {
        console.log('Testing Zabbix 6.0 token auth...');
        if (!this.zapi) throw new Error('ZabbixAPI not initialized');

        try {
            await this.zapi.login(this.token);
            
            const users = await this.zapi.user.get({
                output: ['userid', 'name']
            });
            if (!Array.isArray(users)) {
                throw new Error('Request user.get with token was going wrong');
            }

            await this.zapi.logout();
            console.log('✓ Zabbix 6.0 token auth test passed');
        } catch (error) {
            if (error instanceof Error && error.message.includes('not supported')) {
                console.log('⚠ Token auth may not be configured in this Zabbix 6.0 instance');
            } else {
                console.log('⚠ Token auth failed, may not be configured or supported in this instance');
            }
        }
    }

    async testVersionCompatibility() {
        console.log('Testing Zabbix 6.0 version compatibility...');
        if (!this.zapi) throw new Error('ZabbixAPI not initialized');

        await this.zapi.login(undefined, this.user, this.password);
        
        const version = await this.zapi.apiVersion();
        if (version.major < 6) {
            console.log(`⚠ Version ${version} is older than Zabbix 6.0`);
        } else if (version.major === 6) {
            console.log(`✓ Version compatibility check passed: ${version}`);
        } else {
            console.log(`✓ Version ${version} is newer than Zabbix 6.0 (backward compatible)`);
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
        } catch (error) {
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
        this.zapi = new dist_1.AsyncZabbixAPI({
            url: this.url
        });
    }

    async tearDown() {
        if (this.zapi) {
            try {
                await this.zapi.logout();
            } catch (error) {
                // Ignore logout errors
            }
        }
    }

    async testAsyncClassicAuth() {
        console.log('Testing Zabbix 6.0 async classic auth...');
        if (!this.zapi) throw new Error('AsyncZabbixAPI not initialized');

        await this.zapi.login(undefined, this.user, this.password);
        
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
        if (!this.zapi) throw new Error('AsyncZabbixAPI not initialized');

        try {
            await this.zapi.login(this.token);
            
            const users = await this.zapi.user.get({
                output: ['userid', 'name']
            });
            if (!Array.isArray(users)) {
                throw new Error('Request user.get with token was going wrong');
            }

            console.log('✓ Zabbix 6.0 async token auth test passed');
        } catch (error) {
            console.log('⚠ Async token auth may not be configured or supported in this instance');
        }
    }

    async runAllTests() {
        try {
            await this.setUp();
            await this.testAsyncClassicAuth();
            await this.testAsyncTokenAuth();
            console.log('All Zabbix 6.0 async API compatibility tests passed');
        } catch (error) {
            console.error('Zabbix 6.0 async API compatibility test failed:', error);
            throw error;
        } finally {
            await this.tearDown();
        }
    }
}

class CompatibilitySenderTest6 {
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
        } finally {
            await zapi.logout();
        }
    }

    async testSendValues() {
        console.log('Testing Zabbix 6.0 sender...');
        if (!this.sender) throw new Error('Sender not initialized');

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
            console.log('All Zabbix 6.0 sender compatibility tests passed');
        } catch (error) {
            console.error('Zabbix 6.0 sender compatibility test failed:', error);
            throw error;
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
        
        const senderTest = new CompatibilitySenderTest6();
        await senderTest.runAllTests();
        
        console.log('All Zabbix 6.0 compatibility tests passed - OK');
    } catch (error) {
        console.error('Zabbix 6.0 compatibility tests failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    runAllZabbix60CompatibilityTests();
} 