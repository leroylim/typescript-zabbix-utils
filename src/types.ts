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

import { ProcessingError } from './exceptions';
import { __max_supported__ } from './version';

export class APIVersion {
    /**
     * Zabbix API version object.
     * 
     * @param apiver - Raw version in string format.
     */
    private readonly __raw: string;
    private readonly __first: number;
    private readonly __second: number;
    private readonly __third: number;

    constructor(apiver: string) {
        this.__raw = apiver;
        const [first, second, third] = this.__parseVersion(this.__raw);
        this.__first = first;
        this.__second = second;
        this.__third = third;
    }

    /**
     * Get a symbol from the raw version string by index
     * For compatibility with using Zabbix version as a string
     */
    [Symbol.iterator](): Iterator<string> {
        return this.__raw[Symbol.iterator]();
    }

    charAt(index: number): string {
        return this.__raw.charAt(index);
    }

    /**
     * Check if the current version is LTS.
     * 
     * @returns true if the current version is LTS.
     */
    isLts(): boolean {
        return this.__second === 0;
    }

    /**
     * Get major version number.
     * 
     * @returns A major version number.
     */
    get major(): number {
        return parseFloat(`${this.__first}.${this.__second}`);
    }

    /**
     * Get minor version number.
     * 
     * @returns A minor version number.
     */
    get minor(): number {
        return this.__third;
    }

    private __parseVersion(ver: string): [number, number, number] {
        // Parse the version string into a list of integers.
        const match = ver.match(/^(\d+)\.(\d+)\.(\d+)$/);
        if (!match) {
            throw new Error(
                `Unable to parse version of Zabbix API: ${ver}. ` +
                `Default '${__max_supported__}.0' format is expected.`
            );
        }
        return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
    }

    toString(): string {
        return this.__raw;
    }

    valueOf(): string {
        return this.__raw;
    }

    equals(other: number | string): boolean {
        if (typeof other === 'number') {
            return this.major === other;
        }
        if (typeof other === 'string') {
            const [first, second, third] = this.__parseVersion(other);
            return this.__first === first && this.__second === second && this.__third === third;
        }
        throw new TypeError(
            `'equals' not supported between instances of '${this.constructor.name}' and ` +
            `'${typeof other}', only 'number' or 'string' is expected`
        );
    }

    greaterThan(other: number | string): boolean {
        if (typeof other === 'number') {
            return this.major > other;
        }
        if (typeof other === 'string') {
            const [first, second, third] = this.__parseVersion(other);
            return [this.__first, this.__second, this.__third] > [first, second, third];
        }
        throw new TypeError(
            `'>' not supported between instances of '${this.constructor.name}' and ` +
            `'${typeof other}', only 'number' or 'string' is expected`
        );
    }

    lessThan(other: number | string): boolean {
        if (typeof other === 'number') {
            return this.major < other;
        }
        if (typeof other === 'string') {
            const [first, second, third] = this.__parseVersion(other);
            return [this.__first, this.__second, this.__third] < [first, second, third];
        }
        throw new TypeError(
            `'<' not supported between instances of '${this.constructor.name}' and ` +
            `'${typeof other}', only 'number' or 'string' is expected`
        );
    }

    notEquals(other: number | string): boolean {
        return !this.equals(other);
    }

    greaterThanOrEqual(other: number | string): boolean {
        return !this.lessThan(other);
    }

    lessThanOrEqual(other: number | string): boolean {
        return !this.greaterThan(other);
    }
}

export class TrapperResponse {
    /**
     * Contains response from Zabbix server/proxy.
     * 
     * @param chunk - Current chunk number. Defaults to 1.
     */
    private __processed: number = 0;
    private __failed: number = 0;
    private __total: number = 0;
    private __time: number = 0;
    private __chunk: number;
    public details: any = null;

    constructor(chunk: number = 1) {
        this.__chunk = chunk;
    }

    toString(): string {
        const result: Record<string, any> = {};
        for (const [key, value] of Object.entries(this)) {
            if (key === 'details') {
                continue;
            }
            const cleanKey = key.replace(/^_+TrapperResponse_+/, '').replace(/^_+/, '');
            result[cleanKey] = typeof value === 'number' ? value.toString() : value;
        }
        return JSON.stringify(result);
    }

    /**
     * Parse response from Zabbix.
     * 
     * @param response - Raw response from Zabbix.
     * @throws ProcessingError if unexpected response received
     */
    parse(response: Record<string, any>): Record<string, string> {
        const fields = {
            "processed": ['[Pp]rocessed', '\\d+'],
            "failed": ['[Ff]ailed', '\\d+'],
            "total": ['[Tt]otal', '\\d+'],
            "time": ['[Ss]econds spent', '\\d+\\.\\d+']
        };

        const patternParts = Object.entries(fields).map(([k, [r0, r1]]) => 
            `${r0}:\\s+?(?<${k}>${r1})`
        );
        const pattern = new RegExp(patternParts.join(';\\s+?'));

        const info = response.info;
        if (!info) {
            throw new ProcessingError(`Received unexpected response: ${JSON.stringify(response)}`);
        }

        const match = pattern.exec(info);
        if (!match || !match.groups) {
            throw new ProcessingError(`Failed to parse response: ${info}`);
        }

        return match.groups;
    }

    /**
     * Add and merge response data from Zabbix.
     * 
     * @param response - Raw response from Zabbix.
     * @param chunk - Chunk number. Defaults to null.
     */
    add(response: Record<string, any>, chunk?: number): void {
        const resp = this.parse(response);

        this.__processed += parseInt(resp.processed);
        this.__failed += parseInt(resp.failed);
        this.__total += parseInt(resp.total);
        this.__time += parseFloat(resp.time);

        if (chunk !== undefined) {
            this.__chunk = chunk;
        }

        this.details = response;
    }

    /**
     * Get processed count
     */
    get processed(): number {
        return this.__processed;
    }

    /**
     * Get failed count
     */
    get failed(): number {
        return this.__failed;
    }

    /**
     * Get total count
     */
    get total(): number {
        return this.__total;
    }

    /**
     * Get time spent
     */
    get time(): number {
        return this.__time;
    }

    /**
     * Get chunk number
     */
    get chunk(): number {
        return this.__chunk;
    }
}

export class ItemValue {
    /**
     * Zabbix item value object.
     * 
     * @param host - Host name.
     * @param key - Item key.
     * @param value - Item value.
     * @param clock - Timestamp. Defaults to current time.
     * @param ns - Nanoseconds. Defaults to null.
     */
    public host: string;
    public key: string;
    public value: string;
    public clock: number;
    public ns?: number;

    constructor(host: string, key: string, value: string, clock?: number, ns?: number) {
        this.host = host;
        this.key = key;
        this.value = value;
        this.clock = clock || Math.floor(Date.now() / 1000);
        this.ns = ns;
    }

    toString(): string {
        return JSON.stringify(this.toJson());
    }

    valueOf(): string {
        return this.toString();
    }

    toJson(): Record<string, any> {
        const result: Record<string, any> = {
            host: this.host,
            key: this.key,
            value: this.value,
            clock: this.clock
        };

        if (this.ns !== undefined) {
            result.ns = this.ns;
        }

        return result;
    }
}

export class Node {
    /**
     * Zabbix HA node object.
     * 
     * @param addr - Node address.
     * @param port - Node port.
     */
    public addr: string;
    public port: number;

    constructor(addr: string, port: number | string) {
        this.addr = addr;
        this.port = typeof port === 'string' ? parseInt(port) : port;
    }

    toString(): string {
        return `${this.addr}:${this.port}`;
    }

    valueOf(): string {
        return this.toString();
    }
}

export class Cluster {
    /**
     * Zabbix HA cluster object.
     * 
     * @param addr - List of node addresses.
     */
    public nodes: Node[];

    constructor(addr: string[]) {
        this.nodes = this.__parseHaNode(addr);
    }

    private __parseHaNode(nodeList: string[]): Node[] {
        const nodes: Node[] = [];
        for (const node of nodeList) {
            const [addr, port] = node.split(':');
            nodes.push(new Node(addr, port || '10051'));
        }
        return nodes;
    }

    toString(): string {
        return this.nodes.map(node => node.toString()).join(',');
    }

    valueOf(): string {
        return this.toString();
    }
}

export class AgentResponse {
    /**
     * Zabbix agent response object.
     * 
     * @param response - Raw response from Zabbix agent.
     */
    public raw: string;
    public value?: string;
    public error?: string;

    constructor(response: string) {
        this.raw = response;

        if (response.startsWith('ZBXD')) {
            // Handle binary protocol response
            this.value = response.slice(13); // Skip header
        } else if (response.startsWith('ZBX_NOTSUPPORTED')) {
            this.error = response.slice(17); // Remove "ZBX_NOTSUPPORTED\0"
        } else {
            this.value = response;
        }
    }

    toString(): string {
        return this.raw;
    }

    valueOf(): string {
        return this.toString();
    }
} 