#!/usr/bin/env node
// Script to convert missing Python scripts to TypeScript

const fs = require('fs');
const path = require('path');

// List of Python scripts that need to be converted to TypeScript
const scriptsToConvert = [
    'additional_api_tests.py',
    'check_new_zabbx_release.py', 
    'compatibility_api_test_5.py',
    'compatibility_api_test_6.py',
    'compatibility_api_test_7.py',
    'compatibility_api_test_latest.py',
    'depricated_tests.py',
    'release_notification.py'
];

// Python to TypeScript conversion mappings
const conversionMappings = {
    // Imports
    'import sys': '',
    'import json': '',
    'import time': '',
    'import unittest': '',
    'import asyncio': '',
    'import smtplib': 'import * as nodemailer from "nodemailer";',
    'from email.mime.text import MIMEText': '',
    'from email.mime.multipart import MIMEMultipart': '',
    'sys.path.append(\'.\')': '',
    
    // Zabbix imports
    'from zabbix_utils.api import ZabbixAPI': 'import { ZabbixAPI } from "../../src";',
    'from zabbix_utils.aioapi import AsyncZabbixAPI': 'import { AsyncZabbixAPI } from "../../src";',
    'from zabbix_utils.sender import Sender': 'import { Sender } from "../../src";',
    'from zabbix_utils.aiosender import AsyncSender': 'import { AsyncSender } from "../../src";',
    'from zabbix_utils.getter import Getter': 'import { Getter } from "../../src";',
    'from zabbix_utils.aiogetter import AsyncGetter': 'import { AsyncGetter } from "../../src";',
    'from zabbix_utils.exceptions import APIRequestError': 'import { APIRequestError } from "../../src";',
    'from zabbix_utils.types import AgentResponse, ItemValue, TrapperResponse, APIVersion': 'import { AgentResponse, ItemValue, TrapperResponse, APIVersion } from "../../src";',
    
    // Class definitions
    'class (.+)\\(unittest\\.TestCase\\):': 'class $1 {',
    'def setUp\\(self\\):': 'async setUp(): Promise<void> {',
    'def tearDown\\(self\\):': 'async tearDown(): Promise<void> {',
    'def test_(.+)\\(self\\):': 'async test$1(): Promise<void> {',
    'def (.+)\\(self(.*)\\):': 'async $1($2): Promise<void> {',
    
    // Python syntax to TypeScript
    'self\\.': 'this.',
    'True': 'true',
    'False': 'false',
    'None': 'null',
    'print\\((.+)\\)': 'console.log($1);',
    'self\\.assertEqual\\((.+), (.+), (.+)\\)': 'if ($1 !== $2) throw new Error($3);',
    'self\\.assertIsNotNone\\((.+), (.+)\\)': 'if ($1 === null || $1 === undefined) throw new Error($2);',
    'self\\.fail\\((.+)\\)': 'throw new Error($1);',
    
    // Exception handling
    'try:': 'try {',
    'except (.+):': '} catch (error) {',
    'raise (.+)': 'throw new $1;',
    
    // Async/await
    'await (.+)': 'await $1',
    
    // Environment variables
    'os\\.environ\\.get\\((.+)\\)': 'process.env[$1]',
    
    // JSON
    'json\\.loads\\((.+)\\)': 'JSON.parse($1)',
    'json\\.dumps\\((.+)\\)': 'JSON.stringify($1)',
    
    // Time
    'time\\.sleep\\((.+)\\)': 'await new Promise(resolve => setTimeout(resolve, $1 * 1000));',
    'time\\.time\\(\\)': 'Math.floor(Date.now() / 1000)',
    
    // String formatting
    'f"(.+)"': '`$1`',
    '\\.format\\((.+)\\)': '',
    
    // Main execution
    'if __name__ == \'__main__\':': '// Run the tests',
    'unittest\\.main\\(\\)': 'const test = new $CLASS_NAME();\ntest.runAllTests().catch(console.error);'
};

function convertPythonToTypeScript(pythonCode, filename) {
    let tsCode = pythonCode;
    
    // Add TypeScript header
    tsCode = `#!/usr/bin/env node
// Copyright (C) 2001-2023 Zabbix SIA
//
// Zabbix SIA licenses this file under the MIT License.
// See the LICENSE file in the project root for more information.

` + tsCode;

    // Extract class name for later use
    const classMatch = tsCode.match(/class\s+(\w+)/);
    const className = classMatch ? classMatch[1] : 'TestClass';
    
    // Apply conversion mappings
    for (const [pythonPattern, tsReplacement] of Object.entries(conversionMappings)) {
        const regex = new RegExp(pythonPattern, 'g');
        let replacement = tsReplacement;
        
        // Replace $CLASS_NAME placeholder
        replacement = replacement.replace('$CLASS_NAME', className);
        
        tsCode = tsCode.replace(regex, replacement);
    }
    
    // Fix indentation (Python uses 4 spaces, TypeScript uses 4 spaces too)
    // Convert Python-style method calls to TypeScript
    tsCode = tsCode.replace(/(\w+)\.(\w+)\(/g, '$1.$2(');
    
    // Add runAllTests method for test classes
    if (tsCode.includes('class ') && tsCode.includes('test')) {
        const testMethods = [...tsCode.matchAll(/async (test\w+)\(/g)].map(match => match[1]);
        
        if (testMethods.length > 0) {
            const runAllTestsMethod = `
    async runAllTests(): Promise<void> {
        try {
            await this.setUp();
            ${testMethods.map(method => `await this.${method}();`).join('\n            ')}
            console.log('All ${filename.replace('.py', '')} tests passed - OK');
        } catch (error) {
            console.error('${filename.replace('.py', '')} test failed:', error);
            process.exit(1);
        } finally {
            await this.tearDown();
        }
    }`;
            
            // Insert before the last closing brace
            const lastBraceIndex = tsCode.lastIndexOf('}');
            tsCode = tsCode.slice(0, lastBraceIndex) + runAllTestsMethod + '\n' + tsCode.slice(lastBraceIndex);
        }
    }
    
    // Add main execution for test classes
    if (tsCode.includes('class ') && tsCode.includes('test')) {
        tsCode += `\n\n// Run the tests\nconst test = new ${className}();\ntest.runAllTests().catch(console.error);`;
    }
    
    return tsCode;
}

function convertScript(scriptName) {
    const pythonPath = path.join(__dirname, scriptName);
    const tsPath = path.join(__dirname, scriptName.replace('.py', '.ts'));
    
    if (!fs.existsSync(pythonPath)) {
        console.log(`⚠️  Python script not found: ${scriptName}`);
        return;
    }
    
    try {
        const pythonCode = fs.readFileSync(pythonPath, 'utf8');
        const tsCode = convertPythonToTypeScript(pythonCode, scriptName);
        
        fs.writeFileSync(tsPath, tsCode);
        console.log(`✓ Converted ${scriptName} -> ${scriptName.replace('.py', '.ts')}`);
    } catch (error) {
        console.error(`❌ Error converting ${scriptName}:`, error.message);
    }
}

// Convert all scripts
console.log('Converting missing Python scripts to TypeScript...\n');

scriptsToConvert.forEach(convertScript);

console.log('\n✅ Conversion completed!');
console.log('\nNote: The converted scripts may need manual adjustments for:');
console.log('- Complex Python-specific syntax');
console.log('- Library-specific method calls');
console.log('- Error handling patterns');
console.log('- Type annotations'); 