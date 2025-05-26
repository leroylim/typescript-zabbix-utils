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

import * as net from 'net';
import { ZabbixProtocol } from './common';
import { ProcessingError } from './exceptions';
import { AgentResponse } from './types';

export class Getter {
    /**
     * Zabbix get synchronous implementation.
     * 
     * @param host - Zabbix agent address. Defaults to '127.0.0.1'.
     * @param port - Zabbix agent port. Defaults to 10050.
     * @param timeout - Connection timeout value. Defaults to 10.
     * @param useIpv6 - Specifying IPv6 use instead of IPv4. Defaults to false.
     * @param sourceIp - IP from which to establish connection. Defaults to null.
     * @param socketWrapper - Function to wrap socket. Defaults to null.
     */
    private host: string;
    private port: number;
    private timeout: number;
    private useIpv6: boolean;
    private sourceIp?: string;
    private socketWrapper?: (conn: net.Socket) => net.Socket;

    constructor(options: {
        host?: string;
        port?: number;
        timeout?: number;
        useIpv6?: boolean;
        sourceIp?: string;
        socketWrapper?: (conn: net.Socket) => net.Socket;
    } = {}) {
        const {
            host = '127.0.0.1',
            port = 10050,
            timeout = 10,
            useIpv6 = false,
            sourceIp,
            socketWrapper
        } = options;

        this.host = host;
        this.port = port;
        this.timeout = timeout * 1000; // Convert to milliseconds
        this.useIpv6 = useIpv6;
        this.sourceIp = sourceIp;

        if (socketWrapper && typeof socketWrapper !== 'function') {
            throw new TypeError('Value "socketWrapper" should be a function.');
        }
        this.socketWrapper = socketWrapper;
    }

    private async getResponse(conn: net.Socket): Promise<string> {
        const result = await ZabbixProtocol.parseSyncPacket(conn, console, ProcessingError);
        console.debug('Received data:', result);
        return result;
    }

    /**
     * Gets item value from Zabbix agent by specified key.
     * 
     * @param key - Zabbix item key.
     * @returns Value from Zabbix agent for specified key.
     */
    async get(key: string): Promise<AgentResponse> {
        const packet = ZabbixProtocol.createPacket(key, console);

        let connection: net.Socket;
        try {
            connection = new net.Socket();
        } catch (error) {
            throw new ProcessingError(`Error creating socket for ${this.host}:${this.port}`);
        }

        connection.setTimeout(this.timeout);

        try {
            await new Promise<void>((resolve, reject) => {
                const onConnect = () => {
                    connection.removeListener('error', onError);
                    connection.removeListener('timeout', onTimeout);
                    resolve();
                };

                const onError = (err: Error) => {
                    connection.removeListener('connect', onConnect);
                    connection.removeListener('timeout', onTimeout);
                    reject(err);
                };

                const onTimeout = () => {
                    connection.removeListener('connect', onConnect);
                    connection.removeListener('error', onError);
                    reject(new Error(`Connection timeout after ${this.timeout}ms`));
                };

                connection.once('connect', onConnect);
                connection.once('error', onError);
                connection.once('timeout', onTimeout);

                const connectOptions: net.NetConnectOpts = {
                    host: this.host,
                    port: this.port,
                    family: this.useIpv6 ? 6 : 4
                };

                if (this.sourceIp) {
                    connectOptions.localAddress = this.sourceIp;
                }

                connection.connect(connectOptions);
            });

            if (this.socketWrapper) {
                connection = this.socketWrapper(connection);
            }

            await new Promise<void>((resolve, reject) => {
                connection.write(packet, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

        } catch (error) {
            console.error(
                `An error occurred while trying to connect/send to ${this.host}:${this.port}:`,
                error
            );
            connection.destroy();
            throw error;
        }

        let response: string;
        try {
            response = await this.getResponse(connection);
        } catch (error) {
            console.debug('Get value error:', error);
            console.warn('Check access restrictions in Zabbix agent configuration.');
            connection.destroy();
            throw error;
        }

        console.debug(`Response from [${this.host}:${this.port}]:`, response);

        try {
            connection.destroy();
        } catch (error) {
            // Ignore socket close errors
        }

        return new AgentResponse(response);
    }
} 