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

export class EmptyHandler {
    /**
     * Empty logging handler.
     */
    emit(...args: any[]): void {
        // Do nothing
    }
}

export class SensitiveFilter {
    /**
     * Filter to hide sensitive Zabbix info (password, auth) in logs
     */

    private hideData(rawData: Record<string, any>): string {
        return JSON.stringify(ModuleUtils.hidePrivate(rawData), null, 4);
    }

    filter(record: any): boolean {
        if (Array.isArray(record.args)) {
            record.args = record.args.map((arg: any) => 
                typeof arg === 'object' && arg !== null && !Array.isArray(arg) 
                    ? this.hideData(arg) 
                    : arg
            );
        }
        if (typeof record.args === 'object' && record.args !== null && !Array.isArray(record.args)) {
            record.args = this.hideData(record.args);
        }

        return true;
    }
}

export class Logger {
    private static debugEnabled: boolean = process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true';

    static debug(...args: any[]): void {
        if (this.debugEnabled) {
            console.debug(...args);
        }
    }

    static enableDebug(): void {
        this.debugEnabled = true;
    }

    static disableDebug(): void {
        this.debugEnabled = false;
    }

    static isDebugEnabled(): boolean {
        return this.debugEnabled;
    }
} 