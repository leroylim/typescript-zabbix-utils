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

import { ModuleUtils, ZabbixProtocol } from '../src/common';

describe('ModuleUtils', () => {
    describe('checkUrl', () => {
        const testCases = [
            {
                input: 'http://example.com',
                expected: 'http://example.com/api_jsonrpc.php'
            },
            {
                input: 'http://example.com/',
                expected: 'http://example.com/api_jsonrpc.php'
            },
            {
                input: 'http://example.com/api_jsonrpc.php',
                expected: 'http://example.com/api_jsonrpc.php'
            },
            {
                input: 'example.com',
                expected: 'http://example.com/api_jsonrpc.php'
            },
            {
                input: 'https://secure.example.com',
                expected: 'https://secure.example.com/api_jsonrpc.php'
            }
        ];

        testCases.forEach(testCase => {
            test(`should format URL correctly: ${testCase.input}`, () => {
                const result = ModuleUtils.checkUrl(testCase.input);
                expect(result).toBe(testCase.expected);
            });
        });
    });

    describe('maskSecret', () => {
        const testCases = [
            {
                input: 'verylongpassword',
                showLen: 4,
                expected: '********' // Length 16 <= (8 + 4*2) = 16, so returns mask
            },
            {
                input: 'short',
                showLen: 4,
                expected: '********'
            },
            {
                input: 'password',
                showLen: 0,
                expected: '********'
            },
            {
                input: 'verylongpassword',
                showLen: 2,
                expected: 've********rd' // Length 16 > (8 + 2*2) = 12, so shows chars
            },
            {
                input: 'superlongpasswordstring',
                showLen: 4,
                expected: 'supe********ring' // Length 23 > (8 + 4*2) = 16, so shows chars
            }
        ];

        testCases.forEach(testCase => {
            test(`should mask secret correctly: "${testCase.input}" with showLen=${testCase.showLen}`, () => {
                const result = ModuleUtils.maskSecret(testCase.input, testCase.showLen);
                expect(result).toBe(testCase.expected);
            });
        });
    });

    describe('hidePrivate', () => {
        test('should hide private fields in simple object', () => {
            const input = {
                username: 'admin',
                password: 'secret123',
                token: 'abc123def456',
                publicField: 'visible'
            };

            const result = ModuleUtils.hidePrivate(input);
            
            expect(result.username).toBe('admin');
            expect(result.password).toBe('********'); // secret123 length 9 <= 16
            expect(result.token).toBe('********'); // abc123def456 length 12 <= 16
            expect(result.publicField).toBe('visible');
        });

        test('should hide private fields in nested objects', () => {
            const input = {
                user: {
                    name: 'admin',
                    password: 'secret123'
                },
                auth: {
                    token: 'abc123def456'
                }
            };

            const result = ModuleUtils.hidePrivate(input);
            
            expect(result.user.name).toBe('admin');
            expect(result.user.password).toBe('********'); // secret123 length 9 <= 16
            expect(result.auth.token).toBe('********'); // abc123def456 length 12 <= 16
        });

        test('should hide private fields in arrays', () => {
            const input = {
                passwords: ['secret123', 'password456'],
                tokens: ['abc123def456', 'xyz789uvw012']
            };

            const result = ModuleUtils.hidePrivate(input);
            
            expect(result.passwords[0]).toBe('********'); // secret123 length 9 <= 16
            expect(result.passwords[1]).toBe('********'); // password456 length 11 <= 16
            expect(result.tokens[0]).toBe('********'); // abc123def456 length 12 <= 16
            expect(result.tokens[1]).toBe('********'); // xyz789uvw012 length 12 <= 16
        });

        test('should throw TypeError for invalid input', () => {
            expect(() => ModuleUtils.hidePrivate(null as any)).toThrow(TypeError);
            expect(() => ModuleUtils.hidePrivate([] as any)).toThrow(TypeError);
            expect(() => ModuleUtils.hidePrivate('string' as any)).toThrow(TypeError);
        });

        test('should use custom private fields', () => {
            const input = {
                customSecret: 'secret123',
                password: 'password456'
            };

            const customFields = {
                customSecret: '^.+$'
            };

            const result = ModuleUtils.hidePrivate(input, customFields);
            
            expect(result.customSecret).toBe('********'); // secret123 length 9 <= 16
            expect(result.password).toBe('password456'); // Not hidden with custom fields
        });

        test('should show partial masking for longer strings', () => {
            const input = {
                password: 'verylongpasswordthatislongerthan16chars',
                token: 'superlongtokenthatislongerthan16characters'
            };

            const result = ModuleUtils.hidePrivate(input);
            
            // These should show partial masking since they're longer than 16 chars
            expect(result.password).toBe('very********hars'); // Length 39 > 16
            expect(result.token).toBe('supe********ters'); // Length 43 > 16
        });
    });

    describe('constants', () => {
        test('should have correct constant values', () => {
            expect(ModuleUtils.HIDING_MASK).toBe('********');
            expect(ModuleUtils.JSONRPC_FILE).toBe('api_jsonrpc.php');
            expect(ModuleUtils.UNAUTH_METHODS).toContain('apiinfo.version');
            expect(ModuleUtils.UNAUTH_METHODS).toContain('user.login');
            expect(ModuleUtils.UNAUTH_METHODS).toContain('user.checkAuthentication');
            expect(ModuleUtils.FILES_METHODS).toContain('configuration.export');
        });
    });
});

describe('ZabbixProtocol', () => {
    describe('createPacket', () => {
        const mockLog = {
            debug: jest.fn()
        } as any;

        beforeEach(() => {
            mockLog.debug.mockClear();
        });

        test('should create packet from string', () => {
            const payload = 'test data';
            const packet = ZabbixProtocol.createPacket(payload, mockLog);
            
            expect(Buffer.isBuffer(packet)).toBe(true);
            expect(packet.length).toBeGreaterThan(ZabbixProtocol.HEADER_SIZE);
            expect(mockLog.debug).toHaveBeenCalled();
        });

        test('should create packet from object', () => {
            const payload = { method: 'test', params: {} };
            const packet = ZabbixProtocol.createPacket(payload, mockLog);
            
            expect(Buffer.isBuffer(packet)).toBe(true);
            expect(packet.length).toBeGreaterThan(ZabbixProtocol.HEADER_SIZE);
        });

        test('should create packet from array', () => {
            const payload = ['item1', 'item2'];
            const packet = ZabbixProtocol.createPacket(payload, mockLog);
            
            expect(Buffer.isBuffer(packet)).toBe(true);
            expect(packet.length).toBeGreaterThan(ZabbixProtocol.HEADER_SIZE);
        });

        test('should create packet from Buffer', () => {
            const payload = Buffer.from('test data');
            const packet = ZabbixProtocol.createPacket(payload, mockLog);
            
            expect(Buffer.isBuffer(packet)).toBe(true);
            expect(packet.length).toBeGreaterThan(ZabbixProtocol.HEADER_SIZE);
        });

        test('should create compressed packet', () => {
            const payload = 'test data';
            const packet = ZabbixProtocol.createPacket(payload, mockLog, true);
            
            expect(Buffer.isBuffer(packet)).toBe(true);
            expect(packet.length).toBeGreaterThan(ZabbixProtocol.HEADER_SIZE);
            
            // Check compression flag (should be 0x03 = 0x01 | 0x02)
            const flags = packet.readUInt8(4);
            expect(flags & 0x02).toBe(0x02); // Compression flag should be set
        });

        test('should have correct header structure', () => {
            const payload = 'test';
            const packet = ZabbixProtocol.createPacket(payload, mockLog);
            
            // Check protocol signature
            expect(packet.slice(0, 4).toString()).toBe('ZBXD');
            
            // Check flags (should be 0x01 for protocol)
            const flags = packet.readUInt8(4);
            expect(flags & 0x01).toBe(0x01);
            
            // Check data length
            const dataLength = packet.readUInt32LE(5);
            expect(dataLength).toBe(4); // 'test' is 4 bytes
            
            // Check uncompressed length
            const uncompressedLength = packet.readUInt32LE(9);
            expect(uncompressedLength).toBe(4);
        });

        test('should throw error for invalid data type', () => {
            expect(() => {
                ZabbixProtocol.createPacket(123 as any, mockLog);
            }).toThrow(TypeError);
        });
    });

    describe('constants', () => {
        test('should have correct constant values', () => {
            expect(ZabbixProtocol.ZABBIX_PROTOCOL.toString()).toBe('ZBXD');
            expect(ZabbixProtocol.HEADER_SIZE).toBe(13);
        });
    });
}); 