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

import { AsyncSender } from '../src/aiosender';
import { ItemValue } from '../src/types';

describe('AsyncSender', () => {
    test('should create AsyncSender instance with default options', () => {
        const sender = new AsyncSender();
        expect(sender).toBeInstanceOf(AsyncSender);
    });

    test('should create AsyncSender instance with custom options', () => {
        const sender = new AsyncSender({
            server: '192.168.1.100',
            port: 10052,
            timeout: 30,
            useIpv6: true,
            chunkSize: 100,
            compression: true
        });
        expect(sender).toBeInstanceOf(AsyncSender);
    });

    test('should throw error for invalid SSL context', () => {
        expect(() => {
            new AsyncSender({
                sslContext: 'invalid' as any
            });
        }).toThrow(TypeError);
    });

    test('should throw error for invalid clusters type', () => {
        expect(() => {
            new AsyncSender({
                clusters: 'invalid' as any
            });
        }).toThrow(TypeError);
    });

    test('should create AsyncSender with clusters', () => {
        const sender = new AsyncSender({
            clusters: [
                ['192.168.1.100:10051'],
                ['192.168.1.101:10051', '192.168.1.102:10051']
            ]
        });
        expect(sender).toBeInstanceOf(AsyncSender);
    });

    test('should accept valid SSL context function', () => {
        const mockSslContext = () => ({} as any);
        const sender = new AsyncSender({
            sslContext: mockSslContext
        });
        expect(sender).toBeInstanceOf(AsyncSender);
    });
});

describe('ItemValue integration with AsyncSender', () => {
    test('should create ItemValue for async sending', () => {
        const item = new ItemValue('test_host', 'test.key', '123');
        expect(item.host).toBe('test_host');
        expect(item.key).toBe('test.key');
        expect(item.value).toBe('123');
        expect(typeof item.clock).toBe('number');
    });
}); 