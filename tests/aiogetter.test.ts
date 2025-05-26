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

import { AsyncGetter } from '../src/aiogetter';

describe('AsyncGetter', () => {
    test('should create AsyncGetter instance with default options', () => {
        const getter = new AsyncGetter();
        expect(getter).toBeInstanceOf(AsyncGetter);
    });

    test('should create AsyncGetter instance with custom options', () => {
        const getter = new AsyncGetter({
            host: '192.168.1.100',
            port: 10050,
            timeout: 30,
            useIpv6: true,
            sourceIp: '192.168.1.10'
        });
        expect(getter).toBeInstanceOf(AsyncGetter);
    });

    test('should throw error for invalid SSL context', () => {
        expect(() => {
            new AsyncGetter({
                sslContext: 'invalid' as any
            });
        }).toThrow(TypeError);
    });

    test('should accept valid SSL context function', () => {
        const mockSslContext = () => ({} as any);
        const getter = new AsyncGetter({
            sslContext: mockSslContext
        });
        expect(getter).toBeInstanceOf(AsyncGetter);
    });
}); 