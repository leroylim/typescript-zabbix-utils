# TypeScript Zabbix Utils

[![tests](https://github.com/leroylim/typescript-zabbix-utils/actions/workflows/tests.yaml/badge.svg)](https://github.com/leroylim/typescript-zabbix-utils/actions/workflows/tests.yaml)
[![api](https://github.com/leroylim/typescript-zabbix-utils/actions/workflows/integration_api.yaml/badge.svg)](https://github.com/leroylim/typescript-zabbix-utils/actions/workflows/integration_api.yaml)
[![sender](https://github.com/leroylim/typescript-zabbix-utils/actions/workflows/integration_sender.yaml/badge.svg)](https://github.com/leroylim/typescript-zabbix-utils/actions/workflows/integration_sender.yaml)
[![get](https://github.com/leroylim/typescript-zabbix-utils/actions/workflows/integration_getter.yaml/badge.svg)](https://github.com/leroylim/typescript-zabbix-utils/actions/workflows/integration_getter.yaml)
[![zabbix_50](https://github.com/leroylim/typescript-zabbix-utils/actions/workflows/compatibility_50.yaml/badge.svg)](https://github.com/leroylim/typescript-zabbix-utils/actions/workflows/compatibility_50.yaml)
[![zabbix_60](https://github.com/leroylim/typescript-zabbix-utils/actions/workflows/compatibility_60.yaml/badge.svg)](https://github.com/leroylim/typescript-zabbix-utils/actions/workflows/compatibility_60.yaml)
[![zabbix_70](https://github.com/leroylim/typescript-zabbix-utils/actions/workflows/compatibility_70.yaml/badge.svg)](https://github.com/leroylim/typescript-zabbix-utils/actions/workflows/compatibility_70.yaml)
[![zabbix_72](https://github.com/leroylim/typescript-zabbix-utils/actions/workflows/compatibility_72.yaml/badge.svg)](https://github.com/leroylim/typescript-zabbix-utils/actions/workflows/compatibility_72.yaml)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/zabbix-utils.svg)](https://badge.fury.io/js/zabbix-utils)

A TypeScript port of the official [zabbix-utils](https://github.com/zabbix/python-zabbix-utils) Python library for working with Zabbix API, Zabbix sender, and Zabbix getter protocols.

**Author**: Han Yong Lim <hanyong.lim@gmail.com>  
**Original Python Library**: [Zabbix SIA](https://github.com/zabbix/python-zabbix-utils)

## Features

- **Complete Feature Parity**: One-to-one port of the Python library maintaining identical API
- **TypeScript Support**: Full type safety with comprehensive type definitions
- **Synchronous & Asynchronous**: Both sync and async implementations for all components
- **Zabbix API**: Dynamic method creation with full API coverage
- **Zabbix Sender**: Send values to Zabbix server/proxy with cluster support
- **Zabbix Getter**: Retrieve values from Zabbix agents
- **Version Compatibility**: Supports Zabbix 5.0+ (tested up to 7.2)

## Installation

```bash
npm install zabbix-utils
```

## Quick Start

### Zabbix API (Synchronous)

```typescript
import { ZabbixAPI } from 'zabbix-utils';

const api = new ZabbixAPI({
    url: 'https://zabbix.example.com',
    user: 'Admin',
    password: 'zabbix'
});

// Get all hosts
const hosts = api.host.get({
    output: ['hostid', 'name']
});

console.log(hosts);
api.logout();
```

### Zabbix API (Asynchronous)

```typescript
import { AsyncZabbixAPI } from 'zabbix-utils';

async function main() {
    const api = new AsyncZabbixAPI({
        url: 'https://zabbix.example.com',
        token: 'your-api-token'
    });

    const hosts = await api.host.get({
        output: ['hostid', 'name']
    });

    console.log(hosts);
}
```

### Zabbix Sender

```typescript
import { Sender, ItemValue } from 'zabbix-utils';

const sender = new Sender({
    server: '127.0.0.1',
    port: 10051
});

// Send single value
const response = sender.sendValue('host1', 'item.key', 'value', Date.now());

// Send multiple values
const items = [
    new ItemValue('host1', 'item.key1', 10),
    new ItemValue('host1', 'item.key2', 'test message'),
    new ItemValue('host2', 'item.key1', -1, Date.now())
];

const bulkResponse = sender.send(items);
console.log(bulkResponse);
```

### Zabbix Getter

```typescript
import { Getter } from 'zabbix-utils';

const agent = new Getter({
    host: '127.0.0.1',
    port: 10050
});

const response = agent.get('system.uname');
console.log(response.value);
```

## Documentation

### API Reference

- [ZabbixAPI](./docs/api.md) - Synchronous API client
- [AsyncZabbixAPI](./docs/aioapi.md) - Asynchronous API client
- [Sender](./docs/sender.md) - Send values to Zabbix
- [AsyncSender](./docs/aiosender.md) - Asynchronous sender
- [Getter](./docs/getter.md) - Get values from agents
- [AsyncGetter](./docs/aiogetter.md) - Asynchronous getter

### Examples

See the [examples](./examples/) directory for comprehensive usage examples:

- **Basic Usage**: Simple API, sender, and getter examples
- **API Examples**: Authentication, template export, context management
- **Sender Examples**: Single sending, bulk sending, cluster usage
- **Getter Examples**: Agent data retrieval

## Environment Variables

The library supports the following environment variables:

- `ZABBIX_URL` - Zabbix server URL
- `ZABBIX_USER` - Username for authentication
- `ZABBIX_PASSWORD` - Password for authentication  
- `ZABBIX_TOKEN` - API token for authentication (Zabbix 5.4+)

## Version Compatibility

| Zabbix Version | Support Status |
|----------------|----------------|
| 5.0 LTS        | ✅ Supported   |
| 6.0 LTS        | ✅ Supported   |
| 7.0            | ✅ Supported   |
| 7.2            | ✅ Supported   |

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test suite
npm test -- tests/api.test.ts

# Watch mode for development
npm run test:watch
```

Current test coverage: **103 tests** across 9 test suites, all passing.

## Building

```bash
# Build TypeScript to JavaScript
npm run build

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## Upstream Synchronization

This TypeScript port maintains feature parity with the upstream Python library through automated monitoring and synchronization processes.

### Current Status
- **TypeScript Version**: 2.0.2
- **Upstream Version**: 2.0.2 (Latest)
- **Feature Parity**: ✅ Complete

### Monitoring
```bash
# Check for upstream changes
npm run sync:check

# Generate detailed sync report
npm run sync:report

# Full analysis with diff files
npm run sync:full
```

For detailed information about maintaining upstream parity, see [UPSTREAM_SYNC.md](./UPSTREAM_SYNC.md).

## License

This project is licensed under the MIT License - the same license as the upstream Python library.

```
MIT License

Copyright (C) 2001-2023 Zabbix SIA (Original Python library)
Copyright (C) 2024-2025 Han Yong Lim <hanyong.lim@gmail.com> (TypeScript adaptation)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Maintain feature parity with upstream Python library
- Follow TypeScript best practices
- Add tests for new functionality
- Update documentation as needed
- Run the full test suite before submitting

## Acknowledgments

- **Original Python Library**: [zabbix/python-zabbix-utils](https://github.com/zabbix/python-zabbix-utils)
- **Zabbix SIA**: For creating and maintaining the original library
- **TypeScript Adaptation**: Han Yong Lim <hanyong.lim@gmail.com>
- **Contributors**: All contributors to both the original and TypeScript versions

## Links

- [Upstream Python Repository](https://github.com/zabbix/python-zabbix-utils)
- [Zabbix Documentation](https://www.zabbix.com/documentation)
- [Zabbix API Documentation](https://www.zabbix.com/documentation/current/en/manual/api)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

---

**Note**: This is an unofficial TypeScript port created by Han Yong Lim. For the official Python library, please visit [zabbix/python-zabbix-utils](https://github.com/zabbix/python-zabbix-utils).
