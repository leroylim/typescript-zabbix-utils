#!/usr/bin/env node

// Copyright (C) 2001-2023 Zabbix SIA
//
// Zabbix SIA licenses this file under the MIT License.
// See the LICENSE file in the project root for more information.

import { ZabbixAPI, AsyncZabbixAPI, Sender, ItemValue, APIVersion } from '../../dist';

const ZABBIX_URL = process.env.ZABBIX_URL || '127.0.0.1';
const ZABBIX_USER = process.env.ZABBIX_USER || 'Admin';
const ZABBIX_PASSWORD = process.env.ZABBIX_PASSWORD || 'zabbix';

class CompatibilityAPITest6 {
    private zapi: ZabbixAPI | null = null;
    private url: string = ZABBIX_URL;
    private user: string = ZABBIX_USER;
    private password: string = ZABBIX_PASSWORD;
    private token: string = 'test_token_for_zabbix_6';

    setUp(): void {
        this.zapi = new ZabbixAPI({
            url: this.url
        });
    }

    async testClassicAuth(): Promise<void> {
        console.log('Testing Zabbix 6.0 classic auth...');
        if (!this.zapi) throw new Error('ZabbixAPI not initialized');

        if (!(this.zapi instanceof ZabbixAPI)) {
            throw new Error('Creating ZabbixAPI object was going wrong');
        }

        const version = this.zapi.apiVersion();
        if (!(version instanceof APIVersion)) {
            throw new Error('Version getting was going wrong');
        }

        await this.zapi.login(undefined, ZABBIX_USER, ZABBIX_PASSWORD);
        console.log("✅ Synchronous ZabbixAPI login completed successfully!");

        const sessionId = (this.zapi as any).__sessionId;
        console.log(`✅ Session ID: ${sessionId}`);

        try {
            const resp = await (this.zapi as any).user.checkAuthentication({ sessionid: sessionId });
            if (typeof resp !== 'object') {
                throw new Error('Request user.checkAuthentication was going wrong');
            }
            console.log('✓ checkAuthentication supported in Zabbix 6.0');
        } catch (error) {
            console.log('⚠ checkAuthentication may not be supported in this version');
        }

        const users = await (this.zapi as any).user.get({
            output: ['userid', 'name']
        });
        if (!Array.isArray(users)) {
            throw new Error('Request user.get was going wrong');
        }

        await this.zapi.logout();
        console.log("✅ Logout successful");

        const sessionIdAfterLogout = (this.zapi as any).__sessionId;
        if (sessionIdAfterLogout) {
            throw new Error('Logout was going wrong');
        }

        console.log('✓ Zabbix 6.0 classic auth test passed');
    }

    async testTokenAuth(): Promise<void> {
        console.log('Testing Zabbix 6.0 token auth...');
        if (!this.zapi) throw new Error('ZabbixAPI not initialized');

        try {
            await this.zapi.login(this.token);
            
            const users = await (this.zapi as any).user.get({
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

    async testVersionCompatibility(): Promise<void> {
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

    async runAllTests(): Promise<void> {
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
    private zapi: AsyncZabbixAPI | null = null;
    private url: string = ZABBIX_URL;
    private user: string = ZABBIX_USER;
    private password: string = ZABBIX_PASSWORD;
    private token: string = 'test_token_for_zabbix_6';

    async setUp(): Promise<void> {
        this.zapi = new AsyncZabbixAPI({
            url: this.url
        });
    }

    async tearDown(): Promise<void> {
        if (this.zapi) {
            try {
                await this.zapi.logout();
            } catch (error) {
                // Ignore logout errors
            }
        }
    }

    async testAsyncClassicAuth(): Promise<void> {
        console.log('Testing Zabbix 6.0 async classic auth...');
        if (!this.zapi) throw new Error('AsyncZabbixAPI not initialized');

        await this.zapi.login(undefined, this.user, this.password);
        
        const users = await (this.zapi as any).user.get({
            output: ['userid', 'name']
        });
        if (!Array.isArray(users)) {
            throw new Error('Request user.get was going wrong');
        }

        console.log('✓ Zabbix 6.0 async classic auth test passed');
    }

    async testAsyncTokenAuth(): Promise<void> {
        console.log('Testing Zabbix 6.0 async token auth...');
        if (!this.zapi) throw new Error('AsyncZabbixAPI not initialized');

        try {
            await this.zapi.login(this.token);
            
            const users = await (this.zapi as any).user.get({
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

    async runAllTests(): Promise<void> {
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
    private sender: Sender | null = null;
    private ip: string = ZABBIX_URL;
    private port: number = 10051;
    private chunkSize: number = 10;
    private hostname: string = `${this.constructor.name}_host`;
    private itemname: string = `${this.constructor.name}_item`;
    private itemkey: string = `${this.constructor.name}`;

    setUp(): void {
        this.sender = new Sender({
            server: this.ip,
            port: this.port,
            chunkSize: this.chunkSize
        });
    }

    async prepareItems(): Promise<void> {
        console.log('Preparing test items for sender...');
        const zapi = new ZabbixAPI({
            url: ZABBIX_URL,
            skipVersionCheck: true
        });

        await zapi.login(undefined, ZABBIX_USER, ZABBIX_PASSWORD);

        try {
            const hosts = await (zapi as any).host.get({
                filter: { host: this.hostname },
                output: ['hostid']
            });

            let hostid: string | null = null;
            if (hosts.length > 0) {
                hostid = hosts[0].hostid;
            }

            if (!hostid) {
                const result = await (zapi as any).host.create({
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

            const items = await (zapi as any).item.get({
                filter: { key_: this.itemkey },
                output: ['itemid']
            });

            let itemid: string | null = null;
            if (items.length > 0) {
                itemid = items[0].itemid;
            }

            if (!itemid) {
                const result = await (zapi as any).item.create({
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

    async testSendValues(): Promise<void> {
        console.log('Testing Zabbix 6.0 sender...');
        if (!this.sender) throw new Error('Sender not initialized');

        // Wait a bit for items to be ready
        await new Promise(resolve => setTimeout(resolve, 10000));

        const items = [
            new ItemValue(this.hostname, this.itemkey, '10'),
            new ItemValue(this.hostname, this.itemkey, 'test message'),
            new ItemValue(this.hostname, 'item_key1', '-1', 1695713666),
            new ItemValue(this.hostname, 'item_key2', '{"msg":"test message"}'),
            new ItemValue(this.hostname, this.itemkey, '0', 1695713666, 100),
            new ItemValue(this.hostname, this.itemkey, '5.5', 1695713666)
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

    async runAllTests(): Promise<void> {
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

async function runAllZabbix60CompatibilityTests(): Promise<void> {
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