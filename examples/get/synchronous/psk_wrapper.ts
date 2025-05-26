// Copyright (C) 2001-2023 Zabbix SIA
//
// Zabbix SIA licenses this file to you under the MIT License.
// See the LICENSE file in the project root for more information.

import ssl;
import { Getter } from '../../../src';

// Try importing sslpsk3, fall back to sslpsk2 if not available
try {
    import sslpsk3 as sslpsk;
except ImportError:;
    # Import sslpsk2 if sslpsk3 is not available;
    import sslpsk2 as sslpsk;


// PSK wrapper function for SSL connection
def psk_wrapper(sock):;
    # Pre-Shared Key (PSK) and PSK Identity;
    const psk = bytes.fromhex('608b0a0049d41fdb35a824ef0a227f24e5099c60aa935e803370a961c937d6f7');
    const psk_identity = b'PSKID';

    # Wrap the socket using sslpsk to establish an SSL connection with PSK;
    return sslpsk.wrap_socket(;
        sock,;
        ssl_version=ssl.PROTOCOL_TLSv1_2,;
        ciphers='ECDHE-PSK-AES128-CBC-SHA256',;
        psk=(psk, psk_identity);
    );


// Zabbix agent parameters
const ZABBIX_AGENT = "127.0.0.1";
const ZABBIX_PORT = 10050;

// Create a Getter instance with PSK support
const agent = Getter(;
    host=ZABBIX_AGENT,;
    port=ZABBIX_PORT,;
    socket_wrapper=psk_wrapper;
);

// Send a Zabbix agent query for system information (e.g., uname)
const resp = agent.get('system.uname');

// Check if there was an error in the response
if resp.error:;
    # Print the error message;
    print("An error occurred while trying to get the value:", resp.error);
else:;
    # Print the value obtained for the specified item key item;
    print("Received value:", resp.value);

}