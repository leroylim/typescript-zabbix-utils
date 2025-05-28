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

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import * as https from 'https';
import { v4 as uuid4 } from 'uuid';

import { APIVersion } from './types';
import { ModuleUtils } from './common';
import { APIRequestError, APINotSupported, ProcessingError } from './exceptions';
import { __version__, __min_supported__, __max_supported__ } from './version';

export class AsyncAPIObject {
    /**
     * Async Zabbix API object.
     * 
     * @param name - Zabbix API object name.
     * @param parent - Zabbix API parent of the object.
     */
    private object: string;
    private parent: AsyncZabbixAPI;

    constructor(name: string, parent: AsyncZabbixAPI) {
        this.object = name;
        this.parent = parent;
    }

    /**
     * Dynamic creation of an API method.
     * 
     * @param name - Zabbix API object method name.
     * @returns Zabbix API method.
     */
    [key: string]: any;

    // This will be handled by a Proxy in the constructor
}

export class AsyncZabbixAPI {
    /**
     * Provide asynchronous interface for working with Zabbix API.
     * 
     * @param url - Zabbix API URL. Defaults to `http://localhost/zabbix/api_jsonrpc.php`.
     * @param httpUser - Basic Authentication username. Defaults to `null`.
     * @param httpPassword - Basic Authentication password. Defaults to `null`.
     * @param skipVersionCheck - Skip version compatibility check. Defaults to `false`.
     * @param validateCerts - Specifying certificate validation. Defaults to `true`.
     * @param timeout - Connection timeout to Zabbix API. Defaults to `30`.
     */
    private __version?: APIVersion;
    private __useToken: boolean = false;
    private __sessionId?: string;
    private __basicCred?: string;
    
    public url: string;
    public validateCerts: boolean;
    public timeout: number;

    constructor(options: {
        url?: string;
        httpUser?: string;
        httpPassword?: string;
        skipVersionCheck?: boolean;
        validateCerts?: boolean;
        timeout?: number;
    } = {}) {
        const {
            url = process.env.ZABBIX_URL || 'http://localhost/zabbix/api_jsonrpc.php',
            httpUser,
            httpPassword,
            skipVersionCheck = false,
            validateCerts = true,
            timeout = 30
        } = options;

        this.url = ModuleUtils.checkUrl(url);
        this.validateCerts = validateCerts;
        this.timeout = timeout * 1000; // Convert to milliseconds

        // HTTP Auth unsupported since Zabbix 7.2
        if (httpUser && httpPassword) {
            this.__basicAuth(httpUser, httpPassword);
        }

        this.__checkVersion(skipVersionCheck);

        // Note: HTTP auth version check is deferred to login() since version detection is async

        // Return a proxy to handle dynamic method calls
        return new Proxy(this, {
            get(target, prop) {
                if (typeof prop === 'string' && !(prop in target) && !prop.startsWith('__')) {
                    return new Proxy(new AsyncAPIObject(prop, target), {
                        get(apiObj, method) {
                            if (typeof method === 'string') {
                                return target.__createMethod(prop, method);
                            }
                            return (apiObj as any)[method];
                        }
                    });
                }
                return (target as any)[prop];
            }
        });
    }

    private __createMethod(objectName: string, methodName: string) {
        return async (...args: any[]) => {
            const hasKwargs = args.length > 0 && 
                typeof args[args.length - 1] === 'object' && 
                !Array.isArray(args[args.length - 1]) &&
                args[args.length - 1] !== null;

            if (args.length > 1 && hasKwargs) {
                throw new TypeError("Only args or kwargs should be used.");
            }

            // Support '_' suffix to avoid conflicts with JavaScript keywords
            const cleanObjectName = objectName.endsWith('_') ? objectName.slice(0, -1) : objectName;
            const cleanMethodName = methodName.endsWith('_') ? methodName.slice(0, -1) : methodName;
            const method = `${cleanObjectName}.${cleanMethodName}`;

            // Support passing list of ids and params as a dict
            let params: any;
            if (hasKwargs) {
                params = args[args.length - 1];
            } else if (args.length === 1 && (Array.isArray(args[0]) || typeof args[0] === 'object')) {
                params = args[0];
            } else if (args.length > 0) {
                params = args;
            } else {
                params = null;
            }

            console.debug(`Executing ${method} method`);

            const needAuth = !ModuleUtils.UNAUTH_METHODS.includes(method);

            const response = await this.sendAsyncRequest(method, params, needAuth);
            return response.result;
        };
    }

    private __basicAuth(user: string, password: string): void {
        /**
         * Enable Basic Authentication using.
         * 
         * @param user - Basic Authentication username.
         * @param password - Basic Authentication password.
         */
        console.debug(
            `Enable Basic Authentication with username:${user} password:${ModuleUtils.HIDING_MASK}`
        );

        this.__basicCred = Buffer.from(`${user}:${password}`).toString('base64');
    }

    /**
     * Return object of Zabbix API version.
     * 
     * @returns Object of Zabbix API version
     */
    async apiVersion(): Promise<APIVersion> {
        if (!this.__version) {
            const versionResponse = await this.sendAsyncRequest('apiinfo.version', null, false);
            this.__version = new APIVersion(versionResponse.result);
        }
        return this.__version;
    }

    /**
     * Return object of Zabbix API version.
     * 
     * @returns Object of Zabbix API version.
     */
    get version(): APIVersion {
        if (!this.__version) {
            throw new ProcessingError("Version not initialized. Call apiVersion() first.");
        }
        return this.__version;
    }

    /**
     * Login to Zabbix API.
     * 
     * @param token - Zabbix API token. Defaults to `null`.
     * @param user - Zabbix API username. Defaults to `null`.
     * @param password - Zabbix API user's password. Defaults to `null`.
     */
    async login(token?: string, user?: string, password?: string): Promise<void> {
        // Ensure version is fetched first
        if (!this.__version) {
            await this.apiVersion();
        }

        // Check if HTTP auth is supported for this version
        if (this.version.greaterThan(7.0) && this.__basicCred) {
            throw new APINotSupported("HTTP authentication unsupported since Zabbix 7.2.");
        }

        if (token) {
            if (this.version.lessThan(5.4)) {
                throw new APINotSupported("Token usage", this.version.toString());
            }
            if (user || password) {
                throw new ProcessingError("Token cannot be used with username and password");
            }
            this.__useToken = true;
            this.__sessionId = token;
            return;
        }

        if (!user) {
            throw new ProcessingError("Username is missing");
        }
        if (!password) {
            throw new ProcessingError("User password is missing");
        }

        let userCred: Record<string, string>;
        if (this.version.lessThan(5.4)) {
            userCred = {
                user: user,
                password: password
            };
        } else {
            userCred = {
                username: user,
                password: password
            };
        }

        console.debug(
            `Login to Zabbix API using username:${user} password:${ModuleUtils.HIDING_MASK}`
        );
        this.__useToken = false;
        
        const loginResponse = await this.sendAsyncRequest('user.login', userCred, false);
        this.__sessionId = loginResponse.result;

        console.debug(`Connected to Zabbix API version ${this.version}: ${this.url}`);
    }

    /**
     * Logout from Zabbix API.
     */
    async logout(): Promise<void> {
        if (this.__sessionId) {
            if (this.__useToken) {
                this.__sessionId = undefined;
                this.__useToken = false;
                return;
            }

            console.debug("Logout from Zabbix API");
            await this.sendAsyncRequest('user.logout', {}, true);
            this.__sessionId = undefined;
        } else {
            console.debug("You're not logged in Zabbix API");
        }
    }

    /**
     * Check authentication status in Zabbix API.
     * 
     * @returns User authentication status (`true`, `false`)
     */
    async checkAuth(): Promise<boolean> {
        if (!this.__sessionId) {
            console.debug("You're not logged in Zabbix API");
            return false;
        }

        let refreshResp: any;
        if (this.__useToken) {
            console.debug("Check auth session using token in Zabbix API");
            refreshResp = await this.sendAsyncRequest('user.checkAuthentication', { token: this.__sessionId }, false);
        } else {
            console.debug("Check auth session using sessionid in Zabbix API");
            refreshResp = await this.sendAsyncRequest('user.checkAuthentication', { sessionid: this.__sessionId }, false);
        }

        return Boolean(refreshResp.result?.userid);
    }

    /**
     * Function for sending async request to Zabbix API.
     * 
     * @param method - Zabbix API method name.
     * @param params - Params for request body. Defaults to `null`.
     * @param needAuth - Authorization using flag. Defaults to `false`.
     * @returns Dictionary with Zabbix API response.
     */
    async sendAsyncRequest(method: string, params: any = null, needAuth: boolean = true): Promise<any> {
        const requestJson: any = {
            jsonrpc: '2.0',
            method: method,
            params: params || {},
            id: uuid4(),
        };

        const headers: Record<string, string> = {
            'Accept': 'application/json',
            'Content-Type': 'application/json-rpc',
            'User-Agent': `zabbix-utils/${__version__}`
        };

        if (needAuth) {
            if (!this.__sessionId) {
                throw new ProcessingError("You're not logged in Zabbix API");
            }
            if (this.version.lessThan(6.4)) {
                requestJson.auth = this.__sessionId;
            } else if (this.version.lessThanOrEqual(7.0) && this.__basicCred) {
                requestJson.auth = this.__sessionId;
            } else {
                headers["Authorization"] = `Bearer ${this.__sessionId}`;
            }
        }

        if (this.__basicCred) {
            headers["Authorization"] = `Basic ${this.__basicCred}`;
        }

        console.debug(
            `Sending async request to ${this.url} with body:`,
            requestJson
        );

        const config: AxiosRequestConfig = {
            method: 'POST',
            url: this.url,
            data: requestJson,
            headers: headers,
            timeout: this.timeout,
        };

        // Disable SSL certificate validation if needed.
        if (!this.validateCerts) {
            config.httpsAgent = new https.Agent({
                rejectUnauthorized: false
            });
        }

        try {
            const response: AxiosResponse = await axios(config);
            const respJson = response.data;

            if (!ModuleUtils.FILES_METHODS.includes(method)) {
                console.debug("Received async response body:", respJson);
            } else {
                const debugJson = { ...respJson };
                if (debugJson.result) {
                    debugJson.result = debugJson.result.length > 200 
                        ? debugJson.result.slice(0, 197) + '...' 
                        : debugJson.result;
                }
                console.debug("Received async response body (clipped):", JSON.stringify(debugJson, null, 4));
            }

            if ('error' in respJson) {
                const err = { ...respJson.error };
                err.body = { ...requestJson };
                throw new APIRequestError(err);
            }

            return respJson;
        } catch (error: any) {
            if (error instanceof APIRequestError) {
                throw error;
            }
            if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                throw new ProcessingError(`Unable to connect to ${this.url}:`, error.message);
            }
            if (error.response?.data) {
                throw new ProcessingError("Unable to parse json:", error.response.data);
            }
            throw new ProcessingError("Request failed:", error.message);
        }
    }

    private __checkVersion(skipCheck: boolean): void {
        const skipCheckHelp = "If you're sure zabbix_utils will work properly with your current " +
            "Zabbix version you can skip this check by " +
            "specifying skipVersionCheck=true when create AsyncZabbixAPI object.";

        // Only check version if we have one and aren't skipping the check
        if (!skipCheck && this.__version) {
            if (this.version.lessThan(__min_supported__)) {
                throw new APINotSupported(
                    `Version of Zabbix API [${this.version}] is not supported by the library. ` +
                    `The oldest supported version is ${__min_supported__}.0. ` + skipCheckHelp
                );
            }

            if (this.version.greaterThan(__max_supported__)) {
                throw new APINotSupported(
                    `Version of Zabbix API [${this.version}] was not tested with the library. ` +
                    `The latest tested version is ${__max_supported__}.0. ` + skipCheckHelp
                );
            }
        } else if (skipCheck && this.__version) {
            if (this.version.lessThan(__min_supported__)) {
                console.debug(
                    `Version of Zabbix API [${this.version}] is less than the library supports. ` +
                    "Further library use at your own risk!"
                );
            }

            if (this.version.greaterThan(__max_supported__)) {
                console.debug(
                    `Version of Zabbix API [${this.version}] is more than the library was tested on. ` +
                    "Recommended to update the library. Further library use at your own risk!"
                );
            }
        }
    }
} 