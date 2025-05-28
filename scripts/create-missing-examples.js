#!/usr/bin/env node

/**
 * Script to create missing TypeScript examples from Python examples
 * Ensures complete feature parity between Python and TypeScript examples
 */

const fs = require('fs');
const path = require('path');

class ExampleConverter {
    constructor() {
        this.upstreamDir = 'upstream-examples/examples';
        this.examplesDir = 'examples';
    }

    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = {
            'info': '📋',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌'
        };
        console.log(`${prefix[level]} [${timestamp}] ${message}`);
    }

    convertPythonToTypeScript(pythonCode, filename) {
        let tsCode = pythonCode;

        // Replace copyright header
        tsCode = tsCode.replace(/^# Copyright.*?\n# See the LICENSE file.*?\n\n/ms, 
            '// Copyright (C) 2001-2023 Zabbix SIA\n//\n// Zabbix SIA licenses this file to you under the MIT License.\n// See the LICENSE file in the project root for more information.\n\n');

        // Replace imports
        tsCode = tsCode.replace(/from zabbix_utils import (.+)/g, "import { $1 } from '../../../src';");
        
        // Replace Python comments with TypeScript comments
        tsCode = tsCode.replace(/^#(.*)$/gm, '//$1');

        // Replace Python variable declarations
        tsCode = tsCode.replace(/^([A-Z_]+) = /gm, 'const $1 = ');
        
        // Replace Python dictionaries with TypeScript objects
        tsCode = tsCode.replace(/\{([^}]+)\}/g, (match, content) => {
            return match.replace(/"/g, '"').replace(/'/g, '"');
        });

        // Fix session ID property names (Python snake_case to TypeScript camelCase)
        tsCode = tsCode.replace(/\.__session_id\b/g, '.__sessionId');
        tsCode = tsCode.replace(/\.__use_token\b/g, '.__useToken');
        tsCode = tsCode.replace(/\.__basic_cred\b/g, '.__basicCred');

        // Replace Python function calls with TypeScript
        tsCode = tsCode.replace(/api\.([a-z_]+)\.([a-z_]+)\(\*([A-Z_]+)\)/g, '(api as any).$1.$2(...$3)');
        tsCode = tsCode.replace(/api\.([a-z_]+)\.([a-z_]+)\(([^)]+)\)/g, '(api as any).$1.$2($3)');

        // Replace Python exception handling
        tsCode = tsCode.replace(/except (\w+) as (\w+):/g, '} catch ($2) {\n    if ($2 instanceof $1) {');
        tsCode = tsCode.replace(/try:/g, 'try {');
        
        // Replace print statements
        tsCode = tsCode.replace(/print\(f"([^"]+)"\)/g, 'console.log(`$1`)');
        tsCode = tsCode.replace(/print\("([^"]+)"\)/g, 'console.log("$1")');

        // Add proper TypeScript syntax
        tsCode = tsCode.replace(/^(\s*)([a-z_]+) = /gm, '$1const $2 = ');
        
        // Fix API instantiation
        tsCode = tsCode.replace(/= ZabbixAPI\(\*\*([A-Z_]+)\)/g, '= new ZabbixAPI($1)');
        tsCode = tsCode.replace(/= AsyncZabbixAPI\(\*\*([A-Z_]+)\)/g, '= new AsyncZabbixAPI($1)');

        // Add missing closing braces and semicolons
        if (tsCode.includes('try {') && !tsCode.includes('} catch')) {
            tsCode = tsCode.replace(/(\n[^}]*$)/s, '$1\n}');
        }
        
        // Add semicolons to statements
        tsCode = tsCode.replace(/^(\s*[^/\n{}]+[^;{}\n])$/gm, '$1;');

        return tsCode;
    }

    async createMissingExamples() {
        this.log('Starting to create missing TypeScript examples...');

        const missingExamples = [
            // API Synchronous
            'api/synchronous/custom_ssl_context.py',
            'api/synchronous/disabling_validate_certs.py',
            'api/synchronous/get_request_parameters.py',
            'api/synchronous/token_auth_if_supported.py',
            
            // API Asynchronous
            'api/asynchronous/check_auth_state.py',
            'api/asynchronous/clear_history.py',
            'api/asynchronous/custom_client_session.py',
            'api/asynchronous/custom_ssl_context.py',
            'api/asynchronous/delete_items.py',
            'api/asynchronous/disabling_validate_certs.py',
            'api/asynchronous/export_templates.py',
            'api/asynchronous/get_request_parameters.py',
            'api/asynchronous/use_context_manager.py',
            'api/asynchronous/using_http_auth.py',

            // Sender Synchronous
            'sender/synchronous/agent_config_using.py',
            'sender/synchronous/custom_source_ip.py',
            'sender/synchronous/psk_wrapper.py',
            'sender/synchronous/psk_wrapper_from_config.py',
            'sender/synchronous/tls_cert_wrapper.py',
            'sender/synchronous/tls_cert_wrapper_from_config.py',

            // Sender Asynchronous
            'sender/asynchronous/agent_clusters_using.py',
            'sender/asynchronous/agent_config_using.py',
            'sender/asynchronous/bulk_sending.py',
            'sender/asynchronous/custom_source_ip.py',
            'sender/asynchronous/tls_cert_context.py',
            'sender/asynchronous/tls_cert_context_from_config.py',

            // Getter Synchronous
            'get/synchronous/custom_source_ip.py',
            'get/synchronous/psk_wrapper.py',

            // Getter Asynchronous
            'get/asynchronous/custom_source_ip.py'
        ];

        let created = 0;
        let skipped = 0;

        for (const examplePath of missingExamples) {
            const pythonFile = path.join(this.upstreamDir, examplePath);
            const tsFile = path.join(this.examplesDir, examplePath.replace('.py', '.ts'));

            // Check if TypeScript file already exists
            if (fs.existsSync(tsFile)) {
                this.log(`Skipping ${examplePath} - TypeScript version already exists`, 'warning');
                skipped++;
                continue;
            }

            // Check if Python file exists
            if (!fs.existsSync(pythonFile)) {
                this.log(`Python file not found: ${pythonFile}`, 'error');
                continue;
            }

            try {
                // Read Python file
                const pythonCode = fs.readFileSync(pythonFile, 'utf8');
                
                // Convert to TypeScript
                const tsCode = this.convertPythonToTypeScript(pythonCode, path.basename(examplePath));

                // Ensure directory exists
                const tsDir = path.dirname(tsFile);
                if (!fs.existsSync(tsDir)) {
                    fs.mkdirSync(tsDir, { recursive: true });
                }

                // Write TypeScript file
                fs.writeFileSync(tsFile, tsCode);
                
                this.log(`Created ${tsFile}`, 'success');
                created++;

            } catch (error) {
                this.log(`Error creating ${tsFile}: ${error.message}`, 'error');
            }
        }

        this.log(`\nSummary: Created ${created} examples, skipped ${skipped} existing examples`);
        
        if (created > 0) {
            this.log('Note: You may need to manually review and adjust the generated TypeScript examples for proper syntax and imports.');
        }
    }
}

// Run the converter
const converter = new ExampleConverter();
converter.createMissingExamples().catch(console.error); 