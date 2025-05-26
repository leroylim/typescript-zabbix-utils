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

import { EmptyHandler, SensitiveFilter } from '../src/logger';

describe('EmptyHandler', () => {
    test('should create EmptyHandler instance', () => {
        const handler = new EmptyHandler();
        expect(handler).toBeInstanceOf(EmptyHandler);
    });

    test('should emit without doing anything', () => {
        const handler = new EmptyHandler();
        // Should not throw any errors
        expect(() => {
            handler.emit('test', 'message', { data: 'value' });
        }).not.toThrow();
    });
});

describe('SensitiveFilter', () => {
    test('should create SensitiveFilter instance', () => {
        const filter = new SensitiveFilter();
        expect(filter).toBeInstanceOf(SensitiveFilter);
    });

    test('should filter sensitive data in record args array', () => {
        const filter = new SensitiveFilter();
        const record = {
            args: [
                'normal message',
                { password: 'secret123', username: 'admin' },
                'another message'
            ]
        };

        const result = filter.filter(record);
        expect(result).toBe(true);
        expect(record.args[0]).toBe('normal message');
        expect(record.args[2]).toBe('another message');
        
        // The sensitive object should be stringified and password masked
        const filteredData = JSON.parse(record.args[1] as string);
        expect(filteredData.password).toBe('********');
        expect(filteredData.username).toBe('admin');
    });

    test('should filter sensitive data in record args object', () => {
        const filter = new SensitiveFilter();
        const record: { args: any } = {
            args: { password: 'secret123', token: 'abc123def456', publicField: 'visible' }
        };

        const result = filter.filter(record);
        expect(result).toBe(true);
        
        // After filtering, args becomes a JSON string
        expect(typeof record.args).toBe('string');
        const filteredData = JSON.parse(record.args);
        expect(filteredData.password).toBe('********');
        expect(filteredData.token).toBe('********');
        expect(filteredData.publicField).toBe('visible');
    });

    test('should handle non-object args', () => {
        const filter = new SensitiveFilter();
        const record = {
            args: ['string', 123, true, null]
        };

        const result = filter.filter(record);
        expect(result).toBe(true);
        expect(record.args).toEqual(['string', 123, true, null]);
    });
}); 