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

import { ModuleUtils } from './common';

export class ModuleBaseException extends Error {
    constructor(message?: string) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class APIRequestError extends ModuleBaseException {
    /**
     * Exception class when Zabbix API returns error by request.
     * 
     * @param apiError - Raw error message from Zabbix API.
     */
    public data?: string;
    public body?: any;

    constructor(apiError: string | Record<string, any>) {
        if (typeof apiError === 'object' && apiError !== null) {
            apiError.body = ModuleUtils.hidePrivate(apiError.body);
            const message = `${apiError.message || ''} ${apiError.data || ''}`.trim();
            super(message);
            
            for (const [key, value] of Object.entries(apiError)) {
                (this as any)[key] = value;
            }
        } else {
            super(String(apiError));
        }
    }
}

export class APINotSupported extends ModuleBaseException {
    /**
     * Exception class when object/action is not supported by Zabbix API.
     * 
     * @param message - Not supported object/action message.
     * @param version - Current version of Zabbix API.
     */
    constructor(message: string, version?: string) {
        if (version) {
            message = `${message} is unsupported for Zabbix ${version} version`;
        }
        super(message);
    }
}

export class ProcessingError extends ModuleBaseException {
    constructor(...args: any[]) {
        super(args.map(arg => String(arg)).join(' '));
    }
} 