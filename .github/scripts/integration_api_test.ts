#!/usr/bin/env node
// Copyright (C) 2001-2023 Zabbix SIA
//
// Zabbix SIA licenses this file under the MIT License.
// See the LICENSE file in the project root for more information.

import { ZabbixAPI, APIVersion } from '../../dist';

class IntegrationAPITest {
    private url: string;
    private user: string;
    private password: string;
    private zapi: ZabbixAPI | null = null;

    constructor() {
        this.url = 'localhost';
        this.user = 'Admin';
        this.password = 'zabbix';
    }

    async setUp(): Promise<void> {
        this.zapi = new ZabbixAPI({
            url: this.url,
            user: this.user,
            password: this.password,
            skipVersionCheck: true
        });
    }

    async tearDown(): Promise<void> {
        if (this.zapi) {
            this.zapi.logout();
        }
    }

    async testLogin(): Promise<void> {
        console.log('Testing login...');
        if (!this.zapi) {
            throw new Error('ZabbixAPI not initialized');
        }

        if (!(this.zapi instanceof ZabbixAPI)) {
            throw new Error('Login was going wrong');
        }

        const version = this.zapi.version;
        if (!(version instanceof APIVersion)) {
            throw new Error('Version getting was going wrong');
        }
        console.log('✓ Login test passed');
    }

    async testVersionGet(): Promise<void> {
        console.log('Testing version get...');
        if (!this.zapi) {
            throw new Error('ZabbixAPI not initialized');
        }

        const version = await (this.zapi as any).apiinfo.version();
        const apiVersion = this.zapi.version;
        
        if (version !== apiVersion.toString()) {
            throw new Error('Request apiinfo.version was going wrong');
        }
        console.log('✓ Version get test passed');
    }

    async testCheckAuth(): Promise<void> {
        console.log('Testing check authentication...');
        if (!this.zapi) {
            throw new Error('ZabbixAPI not initialized');
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
        console.log('✓ Check authentication test passed');
    }

    async testUserGet(): Promise<void> {
        console.log('Testing user get...');
        if (!this.zapi) {
            throw new Error('ZabbixAPI not initialized');
        }

        const users = await (this.zapi as any).user.get({
            output: ['userid', 'name']
        });

        if (!Array.isArray(users)) {
            throw new Error('Request user.get was going wrong');
        }
        console.log('✓ User get test passed');
    }

    async testHostGet(): Promise<void> {
        console.log('Testing host get...');
        if (!this.zapi) {
            throw new Error('ZabbixAPI not initialized');
        }

        const hosts = await (this.zapi as any).host_.get_({
            output: ['hostid', 'host']
        });

        if (!Array.isArray(hosts)) {
            throw new Error('Request host.get was going wrong');
        }
        console.log('✓ Host get test passed');
    }

    async runAllTests(): Promise<void> {
        try {
            await this.setUp();
            await this.testLogin();
            await this.testVersionGet();
            await this.testCheckAuth();
            await this.testUserGet();
            await this.testHostGet();
            console.log('All tests passed - OK');
        } catch (error) {
            console.error('Test failed:', error);
            process.exit(1);
        } finally {
            await this.tearDown();
        }
    }
}

// Run the tests
const test = new IntegrationAPITest();
test.runAllTests().catch(console.error); 