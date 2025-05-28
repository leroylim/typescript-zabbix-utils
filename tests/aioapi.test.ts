// zabbix_utils
//
// Copyright (C) 2001-2023 Zabbix SIA (Original Python library)
// Copyright (C) 2024-2025 Han Yong Lim <hanyong.lim@gmail.com> (TypeScript adaptation)
//
// Permission is hereby granted, free of charge, to any person
// obtaining a copy of this software and associated documentation
// files (the "Software"), to deal in the Software without restriction,
// including without limitation the rights to use, copy, modify,
// merge, publish, distribute, sublicense, and/or sell copies
// of the Software, and to permit persons to whom the Software
// is furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
// OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
// HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
// WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALINGS IN THE SOFTWARE.

import { AsyncZabbixAPI } from '../src/aioapi';
import { APINotSupported, ProcessingError } from '../src/exceptions';

describe('AsyncZabbixAPI', () => {
    test('should create AsyncZabbixAPI instance with default options', () => {
        const api = new AsyncZabbixAPI();
        expect(api).toBeInstanceOf(AsyncZabbixAPI);
        expect(api.url).toContain('api_jsonrpc.php');
        expect(api.validateCerts).toBe(true);
        expect(api.timeout).toBe(30000);
    });

    test('should create AsyncZabbixAPI instance with custom options', () => {
        const api = new AsyncZabbixAPI({
            url: 'http://example.com/zabbix',
            validateCerts: false,
            timeout: 60,
            skipVersionCheck: true
        });
        expect(api).toBeInstanceOf(AsyncZabbixAPI);
        expect(api.url).toBe('http://example.com/zabbix/api_jsonrpc.php');
        expect(api.validateCerts).toBe(false);
        expect(api.timeout).toBe(60000);
    });

    test('should handle environment variables', () => {
        const originalUrl = process.env.ZABBIX_URL;
        process.env.ZABBIX_URL = 'http://env.example.com/zabbix';
        
        const api = new AsyncZabbixAPI();
        expect(api.url).toBe('http://env.example.com/zabbix/api_jsonrpc.php');
        
        // Restore original value
        if (originalUrl) {
            process.env.ZABBIX_URL = originalUrl;
        } else {
            delete process.env.ZABBIX_URL;
        }
    });

    test('should create dynamic API objects', () => {
        const api = new AsyncZabbixAPI({ skipVersionCheck: true });
        
        // Test that we can access API objects
        expect(typeof (api as any).user).toBe('object');
        expect(typeof (api as any).host).toBe('object');
        expect(typeof (api as any).item).toBe('object');
    });

    test('should create dynamic API methods', () => {
        const api = new AsyncZabbixAPI({ skipVersionCheck: true });
        
        // Test that we can access API methods
        expect(typeof (api as any).user.get).toBe('function');
        expect(typeof (api as any).host.get).toBe('function');
        expect(typeof (api as any).item.get).toBe('function');
    });

    test('should handle basic authentication', () => {
        const api = new AsyncZabbixAPI({
            httpUser: 'admin',
            httpPassword: 'password',
            skipVersionCheck: true
        });
        expect(api).toBeInstanceOf(AsyncZabbixAPI);
    });

    test('should throw error for HTTP auth with Zabbix 7.2+ during login', async () => {
        const api = new AsyncZabbixAPI({
            httpUser: 'admin',
            httpPassword: 'password',
            skipVersionCheck: true
        });
        
        // Mock the sendAsyncRequest to simulate version detection
        jest.spyOn(api, 'sendAsyncRequest').mockResolvedValue({
            result: '7.2.0'
        });
        
        await expect(api.login(undefined, 'admin', 'password')).rejects.toThrow(APINotSupported);
    });
}); 