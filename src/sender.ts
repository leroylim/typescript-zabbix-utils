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
import * as fs from 'fs';
import { ZabbixProtocol } from './common';
import { ProcessingError } from './exceptions';
import { TrapperResponse, ItemValue, Cluster, Node } from './types';

export class Sender {
    /**
     * Zabbix sender synchronous implementation.
     * 
     * @param server - Zabbix server address. Defaults to '127.0.0.1'.
     * @param port - Zabbix server port. Defaults to 10051.
     * @param useConfig - Specifying configuration use. Defaults to false.
     * @param timeout - Connection timeout value. Defaults to 10.
     * @param useIpv6 - Specifying IPv6 use instead of IPv4. Defaults to false.
     * @param sourceIp - IP from which to establish connection. Defaults to null.
     * @param chunkSize - Number of packets in one chunk. Defaults to 250.
     * @param clusters - List of Zabbix clusters. Defaults to null.
     * @param socketWrapper - Function to wrap socket. Defaults to null.
     * @param compression - Specifying compression use. Defaults to false.
     * @param configPath - Path to Zabbix agent configuration file.
     */
    private timeout: number;
    private useIpv6: boolean;
    private tls: Record<string, string> = {};
    private sourceIp?: string;
    private chunkSize: number;
    private compression: boolean;
    private socketWrapper?: (conn: net.Socket, tls: Record<string, string>) => net.Socket;
    private clusters: Cluster[];

    constructor(options: {
        server?: string;
        port?: number;
        useConfig?: boolean;
        timeout?: number;
        useIpv6?: boolean;
        sourceIp?: string;
        chunkSize?: number;
        clusters?: string[][];
        socketWrapper?: (conn: net.Socket, tls: Record<string, string>) => net.Socket;
        compression?: boolean;
        configPath?: string;
    } = {}) {
        const {
            server,
            port = 10051,
            useConfig = false,
            timeout = 10,
            useIpv6 = false,
            sourceIp,
            chunkSize = 250,
            clusters,
            socketWrapper,
            compression = false,
            configPath = '/etc/zabbix/zabbix_agentd.conf'
        } = options;

        this.timeout = timeout * 1000; // Convert to milliseconds
        this.useIpv6 = useIpv6;
        this.sourceIp = sourceIp;
        this.chunkSize = chunkSize;
        this.compression = compression;

        if (socketWrapper && typeof socketWrapper !== 'function') {
            throw new TypeError('Value "socketWrapper" should be a function.');
        }
        this.socketWrapper = socketWrapper;

        if (useConfig) {
            this.clusters = [];
            this.loadConfig(configPath);
            return;
        }

        if (clusters) {
            if (!Array.isArray(clusters)) {
                throw new TypeError('Value "clusters" should be an array.');
            }

            const clustersCopy = [...clusters];
            if (server) {
                clustersCopy.push([`${server}:${port}`]);
            }

            this.clusters = clustersCopy.map(c => new Cluster(c));
        } else {
            this.clusters = [new Cluster([`${server || '127.0.0.1'}:${port}`])];
        }
    }

    private readConfig(config: Record<string, string>): void {
        const serverRow = config.ServerActive || config.Server || '127.0.0.1:10051';

        for (const cluster of serverRow.split(',')) {
            this.clusters.push(new Cluster(cluster.trim().split(';')));
        }

        if (config.SourceIP) {
            this.sourceIp = config.SourceIP;
        }

        for (const [key, value] of Object.entries(config)) {
            if (key.toLowerCase().startsWith('tls')) {
                this.tls[key] = value;
            }
        }
    }

    private loadConfig(filepath: string): void {
        const configContent = fs.readFileSync(filepath, 'utf-8');
        const config: Record<string, string> = {};

        for (const line of configContent.split('\n')) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const [key, ...valueParts] = trimmed.split('=');
                if (key && valueParts.length > 0) {
                    config[key.trim()] = valueParts.join('=').trim();
                }
            }
        }

        this.readConfig(config);
    }

    private async getResponse(conn: net.Socket): Promise<Record<string, any>> {
        try {
            const result = JSON.parse(
                await ZabbixProtocol.parseSyncPacket(conn, console, ProcessingError)
            );
            console.debug('Received data:', result);
            return result;
        } catch (error) {
            console.debug('Unexpected response was received from Zabbix.');
            throw error;
        }
    }

    private createRequest(items: ItemValue[]): Record<string, any> {
        return {
            request: "sender data",
            data: items.map(i => i.toJson())
        };
    }

    private async sendToCluster(cluster: Cluster, packet: Buffer): Promise<[Node, Record<string, any>]> {
        let activeNode: Node | null = null;
        let activeNodeIdx = 0;
        let connection: net.Socket | null = null;

        for (let i = 0; i < cluster.nodes.length; i++) {
            const node = cluster.nodes[i];
            console.debug(`Trying to send data to ${node}`);

            try {
                connection = new net.Socket();
                connection.setTimeout(this.timeout);

                await new Promise<void>((resolve, reject) => {
                    const onConnect = () => {
                        connection!.removeListener('error', onError);
                        connection!.removeListener('timeout', onTimeout);
                        resolve();
                    };

                    const onError = (err: Error) => {
                        connection!.removeListener('connect', onConnect);
                        connection!.removeListener('timeout', onTimeout);
                        reject(err);
                    };

                    const onTimeout = () => {
                        connection!.removeListener('connect', onConnect);
                        connection!.removeListener('error', onError);
                        reject(new Error(`Connection timeout after ${this.timeout}ms`));
                    };

                    connection!.once('connect', onConnect);
                    connection!.once('error', onError);
                    connection!.once('timeout', onTimeout);

                    const connectOptions: net.NetConnectOpts = {
                        host: node.addr,
                        port: node.port,
                        family: this.useIpv6 ? 6 : 4
                    };

                    if (this.sourceIp) {
                        connectOptions.localAddress = this.sourceIp;
                    }

                    connection!.connect(connectOptions);
                });

                activeNodeIdx = i;
                if (i > 0) {
                    [cluster.nodes[0], cluster.nodes[i]] = [cluster.nodes[i], cluster.nodes[0]];
                    activeNodeIdx = 0;
                }
                activeNode = node;
                break;

            } catch (error) {
                console.debug(`Connection failed to ${node}:`, error);
                if (connection) {
                    connection.destroy();
                    connection = null;
                }
            }
        }

        if (!activeNode || !connection) {
            throw new ProcessingError(
                `Couldn't connect to all of cluster nodes: ${cluster.nodes.map(n => n.toString())}`
            );
        }

        if (this.socketWrapper) {
            connection = this.socketWrapper(connection, this.tls);
        }

        try {
            await new Promise<void>((resolve, reject) => {
                connection!.write(packet, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        } catch (error) {
            connection.destroy();
            throw error;
        }

        let response: Record<string, any>;
        try {
            response = await this.getResponse(connection);
        } catch (error) {
            connection.destroy();
            throw error;
        }

        console.debug(`Response from ${activeNode}:`, response);

        if (response && response.response !== 'success') {
            if (response.redirect) {
                console.debug(
                    `Packet was redirected from ${activeNode} to ${response.redirect.address}. ` +
                    `Proxy group revision: ${response.redirect.revision}.`
                );
                cluster.nodes[activeNodeIdx] = new Node(
                    ...response.redirect.address.split(':') as [string, string]
                );
                connection.destroy();
                return this.sendToCluster(cluster, packet);
            } else {
                connection.destroy();
                throw new Error(JSON.stringify(response));
            }
        }

        connection.destroy();
        return [activeNode, response];
    }

    private async chunkSend(items: ItemValue[]): Promise<Record<string, Record<string, any>>> {
        const responses: Record<string, Record<string, any>> = {};
        const packet = ZabbixProtocol.createPacket(this.createRequest(items), console, this.compression);

        for (const cluster of this.clusters) {
            const [activeNode, response] = await this.sendToCluster(cluster, packet);
            responses[activeNode.toString()] = response;
        }

        return responses;
    }

    /**
     * Sends packets and receives an answer from Zabbix.
     * 
     * @param items - List of ItemValue objects.
     * @returns Response from Zabbix server/proxy.
     */
    async send(items: ItemValue[]): Promise<TrapperResponse> {
        // Split the list of items into chunks
        const chunks: ItemValue[][] = [];
        for (let i = 0; i < items.length; i += this.chunkSize) {
            chunks.push(items.slice(i, i + this.chunkSize));
        }

        const result = new TrapperResponse();
        result.details = {};

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];

            if (!chunk.every(item => item instanceof ItemValue)) {
                throw new ProcessingError(
                    `Received unexpected item list. It must be a list of ItemValue objects: ${JSON.stringify(chunk)}`
                );
            }

            const respByNode = await this.chunkSend(chunk);

            let nodeStep = 1;
            for (const [nodeStr, resp] of Object.entries(respByNode)) {
                try {
                    result.add(resp, (i + 1) * nodeStep);
                } catch (error) {
                    throw new ProcessingError(error instanceof Error ? error.message : String(error));
                }
                nodeStep += 1;

                if (!(nodeStr in result.details)) {
                    result.details[nodeStr] = [];
                }
                const chunkResponse = new TrapperResponse(i + 1);
                chunkResponse.add(resp);
                result.details[nodeStr].push(chunkResponse);
            }
        }

        return result;
    }

    /**
     * Sends one value and receives an answer from Zabbix.
     * 
     * @param host - Host name the item belongs to.
     * @param key - Item key to send value to.
     * @param value - Item value.
     * @param clock - Time in Unix timestamp format. Defaults to current time.
     * @param ns - Time expressed in nanoseconds. Defaults to undefined.
     * @returns Response from Zabbix server/proxy.
     */
    async sendValue(host: string, key: string, value: string, clock?: number, ns?: number): Promise<TrapperResponse> {
        return this.send([new ItemValue(host, key, value, clock, ns)]);
    }
} 