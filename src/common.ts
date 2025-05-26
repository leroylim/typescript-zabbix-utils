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

import * as zlib from 'zlib';
import * as net from 'net';

export class ModuleUtils {
    // Hiding mask for sensitive data
    static readonly HIDING_MASK = "*".repeat(8);

    // The main php-file of Zabbix API
    static readonly JSONRPC_FILE = 'api_jsonrpc.php';

    // Methods working without auth token
    static readonly UNAUTH_METHODS = ['apiinfo.version', 'user.login', 'user.checkAuthentication'];

    // Methods returning files contents
    static readonly FILES_METHODS = ['configuration.export'];

    // List of private fields and regular expressions to hide them
    static readonly PRIVATE_FIELDS: Record<string, string> = {
        "token": "^.+$",
        "auth": "^.+$",
        "passwd": "^.+$",
        "sessionid": "^.+$",
        "password": "^.+$",
        "current_passwd": "^.+$",
        "result": "^[A-Za-z0-9]{32}$",  // To hide only token or sessionid in result
    };

    /**
     * Check url completeness
     * 
     * @param url - Unchecked URL of Zabbix API
     * @returns Checked URL of Zabbix API
     */
    static checkUrl(url: string): string {
        if (!url.endsWith(this.JSONRPC_FILE)) {
            url += url.endsWith('/') ? this.JSONRPC_FILE : '/' + this.JSONRPC_FILE;
        }
        if (!url.startsWith('http')) {
            url = 'http://' + url;
        }

        return url;
    }

    /**
     * Replace the most part of string to hiding mask.
     * 
     * @param string - Raw string with without hiding.
     * @param showLen - Number of signs shown on each side of the string. Defaults to 4.
     * @returns String with hiding part.
     */
    static maskSecret(string: string, showLen: number = 4): string {
        // If showLen is 0 or the length of the string is smaller than the hiding mask length
        // and showLen from both sides of the string, return only hiding mask.
        if (showLen === 0 || string.length <= (this.HIDING_MASK.length + showLen * 2)) {
            return this.HIDING_MASK;
        }

        // Return the string with the hiding mask, surrounded by the specified number of characters
        // to display on each side of the string.
        return `${string.slice(0, showLen)}${this.HIDING_MASK}${string.slice(-showLen)}`;
    }

    /**
     * Hide private data Zabbix info (e.g. token, password)
     * 
     * @param inputData - Input dictionary with private fields.
     * @param fields - Dictionary of private fields and their filtering regexps.
     * @returns Result dictionary without private data.
     */
    static hidePrivate(inputData: Record<string, any>, fields?: Record<string, string>): Record<string, any> {
        const privateFields = fields || this.PRIVATE_FIELDS;

        if (typeof inputData !== 'object' || inputData === null || Array.isArray(inputData)) {
            throw new TypeError(`Unsupported data type '${typeof inputData}', only 'object' is expected`);
        }

        const genRepl = (match: string): string => {
            return this.maskSecret(match);
        };

        const hideStr = (k: string, v: string): string => {
            const regex = new RegExp(privateFields[k], 'g');
            return v.replace(regex, genRepl);
        };

        const hideDict = (v: Record<string, any>): Record<string, any> => {
            return this.hidePrivate(v, privateFields);
        };

        const hideList = (k: string, v: any[]): any[] => {
            const result: any[] = [];
            for (const item of v) {
                if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
                    result.push(hideDict(item));
                    continue;
                }
                if (Array.isArray(item)) {
                    result.push(hideList(k, item));
                    continue;
                }
                if (typeof item === 'string') {
                    const keyWithoutS = k.replace(/s$/, '');
                    if (keyWithoutS in privateFields) {
                        result.push(hideStr(keyWithoutS, item));
                        continue;
                    }
                    // The 'result' regex is used to hide only token or
                    // sessionid format for unknown values
                    if ('result' in privateFields) {
                        result.push(hideStr('result', item));
                        continue;
                    }
                }
                result.push(item);
            }
            return result;
        };

        const resultData = { ...inputData };

        for (const [key, value] of Object.entries(resultData)) {
            if (typeof value === 'string') {
                if (key in privateFields) {
                    resultData[key] = hideStr(key, value);
                }
            }
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                resultData[key] = hideDict(value);
            }
            if (Array.isArray(value)) {
                resultData[key] = hideList(key, value);
            }
        }

        return resultData;
    }
}

export class ZabbixProtocol {
    static readonly ZABBIX_PROTOCOL = Buffer.from('ZBXD');
    static readonly HEADER_SIZE = 13;

    private static prepareRequest(data: Buffer | string | any[] | Record<string, any>): Buffer {
        if (Buffer.isBuffer(data)) {
            return data;
        }
        if (typeof data === 'string') {
            return Buffer.from(data, 'utf-8');
        }
        if (Array.isArray(data) || (typeof data === 'object' && data !== null)) {
            return Buffer.from(JSON.stringify(data), 'utf-8');
        }
        throw new TypeError("Unsupported data type, only 'Buffer', 'string', 'array' or 'object' is expected");
    }

    /**
     * Create a packet for sending via the Zabbix protocol.
     * 
     * @param payload - Payload of the future packet
     * @param log - Logger object (console in Node.js)
     * @param compression - Compression use flag. Defaults to false.
     * @returns Generated Zabbix protocol packet
     */
    static createPacket(payload: Buffer | string | any[] | Record<string, any>, 
                       log: Console, compression: boolean = false): Buffer {
        const request = this.prepareRequest(payload);

        const requestStr = request.toString('utf-8');
        const displayStr = requestStr.length > 200 ? requestStr.slice(0, 197) + '...' : requestStr;
        log.debug('Request data:', displayStr);

        // 0x01 - Zabbix communications protocol
        let flags = 0x01;

        let data = request;
        if (compression) {
            data = zlib.deflateSync(request);
            // 0x02 - compression flag
            flags |= 0x02;
        }

        const header = Buffer.alloc(this.HEADER_SIZE);
        this.ZABBIX_PROTOCOL.copy(header, 0);
        header.writeUInt8(flags, 4);
        header.writeUInt32LE(data.length, 5);
        header.writeUInt32LE(request.length, 9);

        return Buffer.concat([header, data]);
    }

    /**
     * Receive packet data from socket
     * 
     * @param conn - Socket connection
     * @param size - Size of data to receive
     * @param log - Logger object
     * @returns Received data
     */
    static receivePacket(conn: net.Socket, size: number, log: Console): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            let received = 0;

            const onData = (chunk: Buffer) => {
                chunks.push(chunk);
                received += chunk.length;

                if (received >= size) {
                    conn.removeListener('data', onData);
                    conn.removeListener('error', onError);
                    const result = Buffer.concat(chunks);
                    resolve(result.slice(0, size));
                }
            };

            const onError = (error: Error) => {
                conn.removeListener('data', onData);
                conn.removeListener('error', onError);
                reject(error);
            };

            conn.on('data', onData);
            conn.on('error', onError);
        });
    }

    /**
     * Parse a received synchronously Zabbix protocol packet.
     * 
     * @param conn - Socket connection
     * @param log - Logger object
     * @param ExceptionClass - Exception class to throw
     * @returns Body of the received packet
     */
    static async parseSyncPacket(conn: net.Socket, log: Console, ExceptionClass: any): Promise<string> {
        const responseHeader = await this.receivePacket(conn, this.HEADER_SIZE, log);
        log.debug('Zabbix response header:', responseHeader);

        if (!responseHeader.subarray(0, 4).equals(this.ZABBIX_PROTOCOL) || 
            responseHeader.length !== this.HEADER_SIZE) {
            log.debug('Unexpected response was received from Zabbix.');
            throw new ExceptionClass('Unexpected response was received from Zabbix.');
        }

        const flags = responseHeader.readUInt8(4);
        const datalen = responseHeader.readUInt32LE(5);
        const reserved = responseHeader.readUInt32LE(9);

        // 0x01 - Zabbix communications protocol
        if (!(flags & 0x01)) {
            throw new ExceptionClass(
                'Unexpected flags were received. ' +
                'Check debug log for more information.'
            );
        }

        // 0x04 - Using large packet mode
        if (flags & 0x04) {
            throw new ExceptionClass(
                'A large packet flag was received. ' +
                'Current module doesn\'t support large packets.'
            );
        }

        let responseBody: Buffer;
        // 0x02 - Using packet compression mode
        if (flags & 0x02) {
            const compressedData = await this.receivePacket(conn, datalen, log);
            responseBody = zlib.inflateSync(compressedData);
        } else {
            responseBody = await this.receivePacket(conn, datalen, log);
        }

        return responseBody.toString('utf-8');
    }
} 