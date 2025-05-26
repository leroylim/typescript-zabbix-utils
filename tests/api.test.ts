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

import { ZabbixAPI, APIVersion, ProcessingError } from '../src';

describe('ZabbixAPI', () => {
    test('should create ZabbixAPI instance', () => {
        const api = new ZabbixAPI({ skipVersionCheck: true });
        expect(api).toBeInstanceOf(ZabbixAPI);
        expect(api.url).toBe('http://localhost/zabbix/api_jsonrpc.php');
    });

    test('should handle URL formatting', () => {
        const api = new ZabbixAPI({ 
            url: 'http://example.com',
            skipVersionCheck: true 
        });
        expect(api.url).toBe('http://example.com/api_jsonrpc.php');
    });

    test('should handle environment variables', () => {
        process.env.ZABBIX_URL = 'http://env-test.com';
        const api = new ZabbixAPI({ skipVersionCheck: true });
        expect(api.url).toBe('http://env-test.com/api_jsonrpc.php');
        delete process.env.ZABBIX_URL;
    });
});

describe('APIVersion', () => {
    test('should parse version correctly', () => {
        const version = new APIVersion('7.0.0');
        expect(version.major).toBe(7.0);
        expect(version.minor).toBe(0);
        expect(version.isLts()).toBe(true);
        expect(version.toString()).toBe('7.0.0');
    });

    test('should compare versions correctly', () => {
        const version = new APIVersion('7.0.0');
        expect(version.greaterThan(6.0)).toBe(true);
        expect(version.lessThan(8.0)).toBe(true);
        expect(version.equals(7.0)).toBe(true);
        expect(version.equals('7.0.0')).toBe(true);
    });

    test('should handle invalid version format', () => {
        expect(() => new APIVersion('invalid')).toThrow();
    });
});

describe('ProcessingError', () => {
    test('should create error with multiple arguments', () => {
        const error = new ProcessingError('Error:', 'message', 123);
        expect(error.message).toBe('Error: message 123');
        expect(error.name).toBe('ProcessingError');
    });
}); 