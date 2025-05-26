# Zabbix Utils Examples

This directory contains comprehensive examples demonstrating how to use the zabbix-utils library for Node.js/TypeScript.

## Directory Structure

```
examples/
├── README.md                           # This file
├── basic-usage.ts                      # Simple API usage example
├── async-api-usage.ts                  # Async API usage example
├── sender-usage.ts                     # Sender usage example
├── async-sender-usage.ts               # Async sender usage example
├── getter-usage.ts                     # Getter usage example
├── async-getter-usage.ts               # Async getter usage example
├── api/                                # API examples
│   ├── synchronous/                    # Synchronous API examples
│   │   ├── auth_by_token.ts           # Token authentication
│   │   ├── check_auth_state.ts        # Authentication state checking
│   │   ├── export_templates.ts        # Template export
│   │   ├── use_context_manager.ts     # Proper resource management
│   │   └── using_http_auth.ts         # HTTP Basic Authentication
│   └── asynchronous/                   # Asynchronous API examples
│       └── auth_by_token.ts           # Async token authentication
├── sender/                             # Sender examples
│   ├── synchronous/                    # Synchronous sender examples
│   │   ├── single_sending.ts          # Send single value
│   │   ├── bulk_sending.ts            # Send multiple values
│   │   └── agent_clusters_using.ts    # Using clusters
│   └── asynchronous/                   # Asynchronous sender examples
│       └── single_sending.ts          # Async single value sending
└── get/                                # Getter examples
    ├── synchronous/                    # Synchronous getter examples
    │   └── getting_value.ts           # Get agent values
    └── asynchronous/                   # Asynchronous getter examples
        └── getting_value.ts           # Async get agent values
```

## Quick Start Examples

### 1. Basic API Usage
```bash
npx ts-node examples/basic-usage.ts
```

### 2. Async API Usage
```bash
npx ts-node examples/async-api-usage.ts
```

### 3. Sender Usage
```bash
npx ts-node examples/sender-usage.ts
```

### 4. Getter Usage
```bash
npx ts-node examples/getter-usage.ts
```

## Environment Variables

Many examples support environment variables:

```bash
export ZABBIX_URL="http://your-zabbix-server/zabbix"
export ZABBIX_USER="Admin"
export ZABBIX_PASSWORD="your-password"
export ZABBIX_TOKEN="your-api-token"
```

## Running Examples

1. Install dependencies: `npm install`
2. Build the project: `npm run build`
3. Run any example: `npx ts-node examples/path/to/example.ts` 