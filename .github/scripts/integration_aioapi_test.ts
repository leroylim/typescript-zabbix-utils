#!/usr/bin/env node
// Copyright (C) 2001-2023 Zabbix SIA
//
// Zabbix SIA licenses this file under the MIT License.
// See the LICENSE file in the project root for more information.

import { AsyncZabbixAPI, APIVersion } from '../../dist';

class IntegrationAsyncAPITest {
    private url: string;
    private user: string;
    private password: string;
    private zapi: AsyncZabbixAPI | null = null;

    constructor() {
        this.url = 'localhost';
        this.user = 'Admin';
        this.password = 'zabbix';
    }

    async setUp(): Promise<void> {
        this.zapi = new AsyncZabbixAPI({
            url: this.url,
            skipVersionCheck: true
        });
        await this.zapi.login(undefined, this.user, this.password);
    }

    async tearDown(): Promise<void> {
        if (this.zapi) {
            await this.zapi.logout();
        }
    }

    async testLogin(): Promise<void> {
        console.log('Testing async login...');
        if (!this.zapi) {
            throw new Error('AsyncZabbixAPI not initialized');
        }

        if (!(this.zapi instanceof AsyncZabbixAPI)) {
            throw new Error('Login was going wrong');
        }

        const version = this.zapi.apiVersion();
        if (!(version instanceof APIVersion)) {
            throw new Error('Version getting was going wrong');
        }
        console.log('✓ Async login test passed');
    }

    async testVersionGet(): Promise<void> {
        console.log('Testing async version get...');
        if (!this.zapi) {
            throw new Error('AsyncZabbixAPI not initialized');
        }

        const version = await (this.zapi as any).apiinfo.version();
        const apiVersion = this.zapi.apiVersion();
        
        if (version !== apiVersion.toString()) {
            throw new Error('Request apiinfo.version was going wrong');
        }
        console.log('✓ Async version get test passed');
    }

    async testCheckAuth(): Promise<void> {
        console.log('Testing async check authentication...');
        if (!this.zapi) {
            throw new Error('AsyncZabbixAPI not initialized');
        }

        let resp: any;
        const sessionId = (this.zapi as any).__sessionId;
        const token = (this.zapi as any).__token;

        if (sessionId === token) {
            resp = await (this.zapi as any).user.checkAuthentication({ token: sessionId });
        } else {
            resp = await (this.zapi as any).user.checkAuthentication({ sessionid: sessionId });
        }

        if (typeof resp !== 'object' || resp === null) {
            throw new Error('Request user.checkAuthentication was going wrong');
        }
        console.log('✓ Async check authentication test passed');
    }

    async testUserGet(): Promise<void> {
        console.log('Testing async user get...');
        if (!this.zapi) {
            throw new Error('AsyncZabbixAPI not initialized');
        }

        const users = await (this.zapi as any).user.get({
            output: ['userid', 'name']
        });

        if (!Array.isArray(users)) {
            throw new Error('Request user.get was going wrong');
        }
        console.log('✓ Async user get test passed');
    }

    async testHostGet(): Promise<void> {
        console.log('Testing async host get...');
        if (!this.zapi) {
            throw new Error('AsyncZabbixAPI not initialized');
        }

        const hosts = await (this.zapi as any).host_.get_({
            output: ['hostid', 'host']
        });

        if (!Array.isArray(hosts)) {
            throw new Error('Request host.get was going wrong');
        }
        console.log('✓ Async host get test passed');
    }

    async runAllTests(): Promise<void> {
        try {
            await this.setUp();
            await this.testLogin();
            await this.testVersionGet();
            await this.testCheckAuth();
            await this.testUserGet();
            await this.testHostGet();
            console.log('All async tests passed - OK');
        } catch (error) {
            console.error('Async test failed:', error);
            process.exit(1);
        } finally {
            await this.tearDown();
        }
    }
}

// Run the tests
const test = new IntegrationAsyncAPITest();
test.runAllTests().catch(console.error); 