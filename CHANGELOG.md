# Changelog - TypeScript Zabbix Utils

All notable changes to the TypeScript port of zabbix-utils will be documented in this file.

This project is a TypeScript adaptation of the original [python-zabbix-utils](https://github.com/zabbix/python-zabbix-utils) library by Zabbix SIA.

## [2.0.2-ts.1] - 2025-05-26

### Added
- **Complete TypeScript port** of python-zabbix-utils v2.0.2
- **Dual attribution** - Proper credit to original Zabbix SIA work and TypeScript adaptation by Han Yong Lim
- **Enhanced type safety** with comprehensive TypeScript type definitions
- **Improved error handling** with better error messages and graceful degradation
- **Modern async/await patterns** throughout the codebase
- **Comprehensive test suite** with Jest testing framework
- **Complete examples collection** ported to TypeScript with enhanced documentation
- **GitHub Actions workflows** adapted for Node.js/TypeScript CI/CD
- **Upstream synchronization system** to maintain parity with Python library

### TypeScript-Specific Features
- **Full type safety** with strict TypeScript compilation
- **Enhanced IDE support** with IntelliSense and auto-completion
- **Better debugging experience** with source maps and TypeScript stack traces
- **Modern Node.js compatibility** with ES modules and latest Node.js features
- **Improved logging** with structured logging and better error context

### Compatibility
- **Feature parity** with python-zabbix-utils v2.0.2
- **API compatibility** - Same method signatures and behavior as Python version
- **Zabbix version support** - Zabbix 5.0, 6.0, 7.0, 7.2, and latest
- **Node.js support** - Node.js 16+ with TypeScript 4.5+

### Infrastructure
- **Complete CI/CD pipeline** with GitHub Actions
- **Automated testing** across multiple Zabbix versions
- **Code quality tools** with ESLint and Prettier
- **Documentation** with comprehensive README and examples
- **Package management** with npm and proper dependency management

### Migration from Python
- **Drop-in replacement** for most use cases
- **Similar API structure** with TypeScript enhancements
- **Comprehensive migration guide** in documentation
- **Example conversions** showing Python to TypeScript patterns

---

## Original Python Library History

This TypeScript port is based on python-zabbix-utils v2.0.2. For the complete history of the original Python library, see:
- [Python zabbix-utils releases](https://github.com/zabbix/python-zabbix-utils/releases)
- [Python zabbix-utils changelog](https://github.com/zabbix/python-zabbix-utils/blob/main/CHANGELOG.md)

### Key Features Ported from Python v2.0.2:
- Support for Zabbix 7.2 with proxy groups
- Asynchronous modules (AsyncZabbixAPI, AsyncSender, AsyncGetter)
- SSL/TLS context support
- Cluster configuration for high availability
- Comprehensive error handling and logging
- Token-based authentication for modern Zabbix versions
- HTTP Basic Authentication (deprecated in Zabbix 7.2+)

---

## Contributing

This TypeScript port maintains feature parity with the upstream Python library. When contributing:

1. **Maintain compatibility** with the Python API where possible
2. **Add TypeScript enhancements** that improve developer experience
3. **Update tests** to cover new functionality
4. **Follow TypeScript best practices** for type safety and code quality
5. **Update documentation** including examples and README

## Links

- **TypeScript Repository**: https://github.com/leroylim/typescript-zabbix-utils
- **Original Python Repository**: https://github.com/zabbix/python-zabbix-utils
- **Zabbix Documentation**: https://www.zabbix.com/documentation
- **Issue Tracker**: https://github.com/leroylim/typescript-zabbix-utils/issues

## [2.0.2](https://github.com/zabbix/python-zabbix-utils/compare/v2.0.1...v2.0.2) (2024-12-12)

### Features:

- added support for Zabbix 7.2
- added support of proxy groups for Sender and AsyncSender

### Changes:

- discontinued support for HTTP authentication for Zabbix 7.2 and newer
- discontinued support for Zabbix 6.4
- added examples of deleting items
- added examples of how to clear item history
- added examples of how to pass get request parameters

### Bug fixes:

- fixed issue [#21](https://github.com/zabbix/python-zabbix-utils/issues/21) with non-obvious format of ID array passing
- fixed issue [#26](https://github.com/zabbix/python-zabbix-utils/issues/26) with Sender and AsyncSender working with proxy groups
- fixed small bugs and flaws

## [2.0.1](https://github.com/zabbix/python-zabbix-utils/compare/v2.0.0...v2.0.1) (2024-09-18)

### Features:

- added ssl_context argument to ZabbixAPI to allow more flexible configuration of SSL connections
- added support of SSL connection configuration to AsyncZabbixAPI

## [2.0.0](https://github.com/zabbix/python-zabbix-utils/compare/v1.1.1...v2.0.0) (2024-04-12)

### Features:

- added asynchronous modules: AsyncZabbixAPI, AsyncSender, AsyncGetter
- added examples of working with asynchronous modules

### Bug fixes:

- fixed issue [#7](https://github.com/zabbix/python-zabbix-utils/issues/7) in examples of PSK using on Linux
- fixed small bugs and flaws

## [1.1.1](https://github.com/zabbix/python-zabbix-utils/compare/v1.1.0...v1.1.1) (2024-03-06)

### Changes:

- removed external requirements

## [1.1.0](https://github.com/zabbix/python-zabbix-utils/compare/v1.0.3...v1.1.0) (2024-01-23)

### Breaking Changes: 

- changed the format of the Sender response
- changed the format of the Getter response

### Features:

- implemented support for specifying Zabbix clusters in Sender
- implemented pre-processing of the agent response

### Bug fixes:

- fixed issue with hiding private (sensitive) fields in the log
- fixed small bugs and flaws

## [1.0.3](https://github.com/zabbix/python-zabbix-utils/compare/v1.0.2...v1.0.3) (2024-01-09)

### Documentation

- added support for Python 3.12
- discontinued support for Python 3.7

### Bug fixes:

- fixed issue with hiding private (sensitive) information in the log.
- fixed small bugs and flaws.

## [1.0.2](https://github.com/zabbix/python-zabbix-utils/compare/v1.0.1...v1.0.2) (2023-12-15)

### Bug fixes:

- added trailing underscores as workaround to use Python keywords as names of API object or method
- changed TypeError to ValueError for the exception during version parsing.
- fixed compression support for Sender and Getter.
- made refactoring of some parts of the code.
- fixed small bugs and flaws.

## [1.0.1](https://github.com/zabbix/python-zabbix-utils/compare/v1.0.0...v1.0.1) (2023-11-27)

### Bug fixes:

- removed deprecated API fields from examples and README.
- removed "Get started" section from README for PyPI.
- fixed small flaws.

## [1.0.0](https://github.com/zabbix/python-zabbix-utils/tree/v1.0.0) (2023-11-17)

Initial release
