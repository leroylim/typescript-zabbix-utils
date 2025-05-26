#!/usr/bin/env node
// Copyright (C) 2001-2023 Zabbix SIA
//
// Zabbix SIA licenses this file under the MIT License.
// See the LICENSE file in the project root for more information.

import * as fs from 'fs';
import * as https from 'https';

const chatId = process.env.TBOT_CHAT;             // chat id. env TBOT_CHAT must be set!
const token = process.env.TBOT_TOKEN;             // bot token. env TBOT_TOKEN must be set!
const parseMode = process.env.TBOT_FORMAT || '';  // HTML, MarkdownV2 or empty

// Check required environment variables
const requiredEnvVars = ['TBOT_CHAT', 'TBOT_TOKEN'];
for (const key of requiredEnvVars) {
    if (!process.env[key]) {
        console.error(`Please set environmental variable "${key}"`);
        process.exit(1);
    }
}

interface TelegramResponse {
    ok: boolean;
    error_code?: number;
    description?: string;
}

function sendMessage(msg: string, passthrough: boolean = true): Promise<string> {
    return new Promise((resolve, reject) => {
        if (passthrough) {
            console.log(msg);
        }

        if (msg.length === 0) {
            resolve('{"ok":true}');
            return;
        }

        let message = msg;
        if (message.length > 4096) {
            message = "Message output is too long. Please check the GitHub action log.";
        }

        if (process.env.SUBJECT) {
            message = `${process.env.SUBJECT}\n\n${message}`;
        }

        if (process.env.GH_JOB) {
            message += `\n\n<a href="${process.env.GH_JOB}">${process.env.GH_JOB}</a>`;
        }

        const payload = {
            text: message,
            parse_mode: parseMode,
            disable_web_page_preview: false,
            disable_notification: false,
            reply_to_message_id: null,
            chat_id: chatId
        };

        const postData = JSON.stringify(payload);
        const options = {
            hostname: 'api.telegram.org',
            port: 443,
            path: `/bot${token}/sendMessage`,
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'User-Agent': 'Node.js script',
                'content-type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve(data);
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

async function main(): Promise<void> {
    let message: string;

    if (process.argv.length === 3) {
        message = process.argv[2];
    } else {
        // Read from stdin
        const chunks: Buffer[] = [];
        for await (const chunk of process.stdin) {
            chunks.push(chunk);
        }
        message = Buffer.concat(chunks).toString('utf8').trim();
    }

    if (!message) {
        process.exit(0);
    }

    try {
        const result = await sendMessage(message);
        const response: TelegramResponse = JSON.parse(result);
        
        if (!response.ok) {
            console.error(response.error_code, response.description);
            process.exit(1);
        }
    } catch (error) {
        console.error('Error sending telegram message:', error);
        process.exit(1);
    }
}

// Run the main function
main().catch(console.error); 