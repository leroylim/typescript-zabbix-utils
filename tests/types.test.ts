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

import { APIVersion, Cluster, ItemValue, TrapperResponse, Node, AgentResponse } from '../src/types';
import { ProcessingError } from '../src/exceptions';

describe('APIVersion', () => {
    describe('initialization', () => {
        const testCases = [
            { input: '7.0.0alpha', shouldThrow: true },
            { input: '6.0.0', expected: '6.0.0', shouldThrow: false },
            { input: '6.0', shouldThrow: true },
            { input: '7', shouldThrow: true }
        ];

        testCases.forEach(testCase => {
            test(`should handle version ${testCase.input}`, () => {
                if (testCase.shouldThrow) {
                    expect(() => new APIVersion(testCase.input)).toThrow();
                } else {
                    const version = new APIVersion(testCase.input);
                    expect(version.toString()).toBe(testCase.expected);
                }
            });
        });
    });

    describe('major version', () => {
        const testCases = [
            { input: '6.0.10', expected: 6.0 },
            { input: '6.2.0', expected: 6.2 }
        ];

        testCases.forEach(testCase => {
            test(`should return major version ${testCase.expected} for ${testCase.input}`, () => {
                const version = new APIVersion(testCase.input);
                expect(version.major).toBe(testCase.expected);
            });
        });
    });

    describe('minor version', () => {
        const testCases = [
            { input: '6.0.10', expected: 10 },
            { input: '6.2.0', expected: 0 }
        ];

        testCases.forEach(testCase => {
            test(`should return minor version ${testCase.expected} for ${testCase.input}`, () => {
                const version = new APIVersion(testCase.input);
                expect(version.minor).toBe(testCase.expected);
            });
        });
    });

    describe('LTS detection', () => {
        const testCases = [
            { input: '6.0.10', expected: true },
            { input: '6.2.0', expected: false },
            { input: '6.4.5', expected: false },
            { input: '7.0.0', expected: true },
            { input: '7.0.30', expected: true }
        ];

        testCases.forEach(testCase => {
            test(`should detect LTS correctly for ${testCase.input}`, () => {
                const version = new APIVersion(testCase.input);
                expect(version.isLts()).toBe(testCase.expected);
            });
        });
    });

    describe('version comparison', () => {
        const testCases = [
            { version: '6.0.0', other: '6.0.0', operation: 'equals', expected: true },
            { version: '6.0.0', other: 6.0, operation: 'notEquals', expected: false },
            { version: '6.0.0', other: 6.0, operation: 'greaterThanOrEqual', expected: true },
            { version: '6.0.0', other: 7.0, operation: 'lessThan', expected: true },
            { version: '6.4.1', other: 6.4, operation: 'greaterThan', expected: false }
        ];

        testCases.forEach(testCase => {
            test(`should compare ${testCase.version} ${testCase.operation} ${testCase.other}`, () => {
                const version = new APIVersion(testCase.version);
                const result = (version as any)[testCase.operation](testCase.other);
                expect(result).toBe(testCase.expected);
            });
        });

        test('should throw TypeError for invalid comparison types', () => {
            const version = new APIVersion('6.0.0');
            expect(() => version.greaterThan({} as any)).toThrow(TypeError);
            expect(() => version.lessThan([] as any)).toThrow(TypeError);
        });
    });
});

describe('Cluster', () => {
    describe('parsing', () => {
        const testCases = [
            {
                input: ['127.0.0.1'],
                expected: '127.0.0.1:10051'
            },
            {
                input: ['localhost:10151'],
                expected: 'localhost:10151'
            },
            {
                input: ['zabbix.cluster.node1', 'zabbix.cluster.node2:20051', 'zabbix.cluster.node3:30051'],
                expected: 'zabbix.cluster.node1:10051,zabbix.cluster.node2:20051,zabbix.cluster.node3:30051'
            }
        ];

        testCases.forEach(testCase => {
            test(`should parse cluster nodes correctly for ${JSON.stringify(testCase.input)}`, () => {
                const cluster = new Cluster(testCase.input);
                expect(cluster.toString()).toBe(testCase.expected);
            });
        });
    });
});

describe('ItemValue', () => {
    describe('creation and serialization', () => {
        test('should create ItemValue with basic parameters', () => {
            const item = new ItemValue('test_host', 'test_key', '0');
            const json = item.toJson();
            
            expect(json.host).toBe('test_host');
            expect(json.key).toBe('test_key');
            expect(json.value).toBe('0');
            expect(typeof json.clock).toBe('number');
        });

        test('should create ItemValue with clock parameter', () => {
            const clock = 1695713666;
            const item = new ItemValue('test_host', 'test_key', '0', clock);
            const json = item.toJson();
            
            expect(json.clock).toBe(clock);
        });

        test('should create ItemValue with nanoseconds', () => {
            const clock = 1695713666;
            const ns = 100;
            const item = new ItemValue('test_host', 'test_key', '0', clock, ns);
            const json = item.toJson();
            
            expect(json.clock).toBe(clock);
            expect(json.ns).toBe(ns);
        });

        test('should serialize to JSON string correctly', () => {
            const item = new ItemValue('test_host', 'test_key', '0', 1695713666);
            const jsonString = item.toString();
            const parsed = JSON.parse(jsonString);
            
            expect(parsed.host).toBe('test_host');
            expect(parsed.key).toBe('test_key');
            expect(parsed.value).toBe('0');
            expect(parsed.clock).toBe(1695713666);
        });
    });
});

describe('Node', () => {
    test('should create Node with string port', () => {
        const node = new Node('127.0.0.1', '10051');
        expect(node.addr).toBe('127.0.0.1');
        expect(node.port).toBe(10051);
        expect(node.toString()).toBe('127.0.0.1:10051');
    });

    test('should create Node with number port', () => {
        const node = new Node('127.0.0.1', 10051);
        expect(node.addr).toBe('127.0.0.1');
        expect(node.port).toBe(10051);
        expect(node.toString()).toBe('127.0.0.1:10051');
    });
});

describe('TrapperResponse', () => {
    test('should initialize with default values', () => {
        const response = new TrapperResponse();
        expect(response.processed).toBe(0);
        expect(response.failed).toBe(0);
        expect(response.total).toBe(0);
        expect(response.time).toBe(0);
        expect(response.chunk).toBe(1);
    });

    test('should initialize with custom chunk', () => {
        const response = new TrapperResponse(5);
        expect(response.chunk).toBe(5);
    });

    test('should parse response correctly', () => {
        const response = new TrapperResponse();
        const mockResponse = {
            info: 'processed: 10; failed: 2; total: 12; seconds spent: 0.123456'
        };

        const parsed = response.parse(mockResponse);
        expect(parsed.processed).toBe('10');
        expect(parsed.failed).toBe('2');
        expect(parsed.total).toBe('12');
        expect(parsed.time).toBe('0.123456');
    });

    test('should throw ProcessingError for invalid response', () => {
        const response = new TrapperResponse();
        const invalidResponse = {};

        expect(() => response.parse(invalidResponse)).toThrow(ProcessingError);
    });

    test('should add response data correctly', () => {
        const response = new TrapperResponse();
        const mockResponse = {
            info: 'processed: 10; failed: 2; total: 12; seconds spent: 0.123456'
        };

        response.add(mockResponse);
        expect(response.processed).toBe(10);
        expect(response.failed).toBe(2);
        expect(response.total).toBe(12);
        expect(response.time).toBe(0.123456);
    });
});

describe('AgentResponse', () => {
    test('should handle regular response', () => {
        const response = new AgentResponse('test value');
        expect(response.raw).toBe('test value');
        expect(response.value).toBe('test value');
        expect(response.error).toBeUndefined();
    });

    test('should handle ZBXD protocol response', () => {
        const response = new AgentResponse('ZBXD\x01\x00\x00\x00\x00\x00\x00\x00\x00test value');
        expect(response.raw).toBe('ZBXD\x01\x00\x00\x00\x00\x00\x00\x00\x00test value');
        expect(response.value).toBe('test value');
        expect(response.error).toBeUndefined();
    });

    test('should handle ZBX_NOTSUPPORTED response', () => {
        const response = new AgentResponse('ZBX_NOTSUPPORTED\x00error message');
        expect(response.raw).toBe('ZBX_NOTSUPPORTED\x00error message');
        expect(response.error).toBe('error message');
        expect(response.value).toBeUndefined();
    });

    test('should convert to string correctly', () => {
        const response = new AgentResponse('test value');
        expect(response.toString()).toBe('test value');
        expect(response.valueOf()).toBe('test value');
    });
}); 