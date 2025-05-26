// Copyright (C) 2001-2023 Zabbix SIA
//
// Zabbix SIA licenses this file to you under the MIT License.
// See the LICENSE file in the project root for more information.

import { ZabbixAPI } from '../../../src';
import * as fs from 'fs';

// Zabbix server details and authentication credentials
const ZABBIX_AUTH = {
    url: "127.0.0.1",    // Zabbix server URL or IP address
    user: "Admin",       // Zabbix user name for authentication
    password: "zabbix"   // Zabbix user password for authentication
};

// Template IDs to be exported
const TEMPLATE_IDS = [10050];

// File path and format for exporting configuration
const FILE_PATH = "templates_export_example.{}";

async function main() {
    // Create an instance of the ZabbixAPI class with the specified authentication details
    const api = new ZabbixAPI(ZABBIX_AUTH);

    try {
        // Determine the export file format based on the Zabbix API version
        let exportFormat = "yaml";
        if (api.version.lessThan(5.4)) {
            exportFormat = "xml";
        }

        // Export configuration for specified template IDs
        const configuration = await (api as any).configuration.export({
            options: {
                templates: TEMPLATE_IDS
            },
            format: exportFormat
        });

        // Write the exported configuration to a file
        const filePath = FILE_PATH.replace('{}', exportFormat);
        fs.writeFileSync(filePath, configuration, { encoding: 'utf-8' });
        
        console.log(`Configuration exported to ${filePath}`);

        // Logout to release the Zabbix API session
        await api.logout();
    } catch (error) {
        console.error('Error:', error);
    }
}

// Run the example
if (require.main === module) {
    main().catch(console.error);
} 