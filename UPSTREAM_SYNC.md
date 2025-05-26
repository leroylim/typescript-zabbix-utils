# Upstream Synchronization Guide

This document outlines the strategy and tools for maintaining feature parity with the upstream [zabbix/python-zabbix-utils](https://github.com/zabbix/python-zabbix-utils) repository.

## Current Status

- **TypeScript Version**: 2.0.2
- **Upstream Version**: 2.0.2 (Latest Release)
- **Feature Parity**: ✅ Complete
- **Last Sync Check**: Manual verification shows no library changes since v2.0.2

## Monitoring Strategy

### 1. Automated Monitoring

We have implemented automated monitoring through GitHub Actions:

**Workflow**: `.github/workflows/upstream-monitor.yml`
- **Schedule**: Daily at 6 AM UTC
- **Triggers**: 
  - Scheduled runs
  - Manual dispatch
- **Actions**:
  - Clones upstream repository
  - Checks for commits since v2.0.2
  - Analyzes if library code changed
  - Creates GitHub issues for new changes
  - Prioritizes issues based on change type

**Issue Labels**:
- `upstream-sync`: All upstream-related issues
- `high-priority`: Library code changes requiring immediate attention
- `low-priority`: Non-library changes (CI, docs, etc.)

### 2. Manual Synchronization

**Script**: `scripts/sync-upstream.js`

```bash
# Basic check
node scripts/sync-upstream.js

# Generate detailed report
node scripts/sync-upstream.js -o sync-report.md

# Generate diff files for analysis
node scripts/sync-upstream.js -d -o report.md
```

**Features**:
- Analyzes upstream changes since current version
- Generates detailed reports
- Creates diff files for library changes
- Provides actionable recommendations

## Synchronization Process

### When Library Changes Are Detected

1. **Immediate Assessment**
   - Review the GitHub issue created by automation
   - Check the priority level (high/low)
   - Examine changed files list

2. **Detailed Analysis**
   ```bash
   # Generate comprehensive analysis
   node scripts/sync-upstream.js -d -o analysis.md
   
   # Review diff files in ./diffs/ directory
   ls diffs/
   ```

3. **Implementation Steps**
   - [ ] Review each changed Python file
   - [ ] Update corresponding TypeScript files
   - [ ] Maintain API compatibility
   - [ ] Update type definitions if needed
   - [ ] Add/update tests for new functionality
   - [ ] Update version number in `src/version.ts`
   - [ ] Update documentation and examples
   - [ ] Run full test suite
   - [ ] Update CHANGELOG.md

4. **Validation**
   ```bash
   # Build and test
   npm run build
   npm test
   
   # Run examples to verify functionality
   npm run examples
   ```

5. **Release Process**
   - Update version numbers
   - Create release notes
   - Tag new version
   - Publish to npm (if applicable)

### When Non-Library Changes Are Detected

For CI, documentation, or configuration changes:
1. Review the changes for any insights
2. Consider if similar improvements apply to TypeScript port
3. Update monitoring scripts if needed
4. Close the issue with summary

## File Mapping

| Python File | TypeScript File | Notes |
|-------------|-----------------|-------|
| `zabbix_utils/__init__.py` | `src/index.ts` | Main exports |
| `zabbix_utils/api.py` | `src/api.ts` | Synchronous API |
| `zabbix_utils/aioapi.py` | `src/aioapi.ts` | Asynchronous API |
| `zabbix_utils/sender.py` | `src/sender.ts` | Synchronous sender |
| `zabbix_utils/aiosender.py` | `src/aiosender.ts` | Asynchronous sender |
| `zabbix_utils/getter.py` | `src/getter.ts` | Synchronous getter |
| `zabbix_utils/aiogetter.py` | `src/aiogetter.ts` | Asynchronous getter |
| `zabbix_utils/types.py` | `src/types.ts` | Type definitions |
| `zabbix_utils/common.py` | `src/common.ts` | Utilities |
| `zabbix_utils/exceptions.py` | `src/exceptions.ts` | Error classes |
| `zabbix_utils/logger.py` | `src/logger.ts` | Logging utilities |
| `zabbix_utils/version.py` | `src/version.ts` | Version constants |

## Code Conversion Patterns

### Python to TypeScript Conversion Guidelines

1. **Class Definitions**
   ```python
   # Python
   class ZabbixAPI:
       def __init__(self, url=None, user=None):
           self.url = url
   ```
   ```typescript
   // TypeScript
   class ZabbixAPI {
       private url?: string;
       
       constructor(url?: string, user?: string) {
           this.url = url;
       }
   }
   ```

2. **Method Signatures**
   ```python
   # Python
   def send_value(self, host, key, value, clock=None):
   ```
   ```typescript
   // TypeScript
   sendValue(host: string, key: string, value: any, clock?: number): TrapperResponse
   ```

3. **Error Handling**
   ```python
   # Python
   raise APIRequestError("Message")
   ```
   ```typescript
   // TypeScript
   throw new APIRequestError("Message");
   ```

4. **Async/Await**
   ```python
   # Python
   async def login(self, user, password):
       response = await self.request(...)
   ```
   ```typescript
   // TypeScript
   async login(user: string, password: string): Promise<void> {
       const response = await this.request(...);
   }
   ```

## Testing Strategy

### Test Parity Requirements

1. **Maintain Test Coverage**
   - Each Python test should have TypeScript equivalent
   - Test same functionality and edge cases
   - Maintain similar test structure

2. **Test Categories**
   - Unit tests for individual methods
   - Integration tests for API interactions
   - Error handling tests
   - Type validation tests

3. **Test Execution**
   ```bash
   # Run all tests
   npm test
   
   # Run specific test suite
   npm test -- tests/api.test.ts
   
   # Run with coverage
   npm test -- --coverage
   ```

## Version Management

### Version Synchronization

1. **Version Number Format**
   - Follow upstream version exactly: `X.Y.Z`
   - Add TypeScript-specific suffix if needed: `X.Y.Z-ts.N`

2. **Version Update Process**
   ```typescript
   // Update src/version.ts
   export const __version__ = "2.0.3";
   export const __min_supported__ = 5.0;
   export const __max_supported__ = 7.2;
   ```

3. **Package.json Updates**
   ```json
   {
     "version": "2.0.3",
     "description": "TypeScript port of zabbix-utils (v2.0.3)"
   }
   ```

## Monitoring Schedule

### Recommended Sync Schedule

- **Daily**: Automated monitoring (GitHub Actions)
- **Weekly**: Manual review of any open sync issues
- **Monthly**: Comprehensive sync check and documentation review
- **On Release**: Immediate sync when new upstream releases are published

### Manual Checks

```bash
# Weekly manual check
node scripts/sync-upstream.js -o weekly-report.md

# Before any major changes
node scripts/sync-upstream.js -d -o pre-change-analysis.md
```

## Troubleshooting

### Common Issues

1. **Merge Conflicts in Automated PRs**
   - Review conflicts manually
   - Update conversion patterns if needed
   - Test thoroughly before merging

2. **Breaking Changes in Upstream**
   - Assess impact on TypeScript API
   - Plan migration strategy
   - Update documentation
   - Consider deprecation warnings

3. **New Dependencies**
   - Evaluate TypeScript equivalents
   - Update package.json
   - Test compatibility

### Emergency Sync Process

For critical security fixes or urgent updates:

1. **Immediate Response**
   ```bash
   # Quick analysis
   node scripts/sync-upstream.js
   
   # Focus on security-related changes
   git diff v2.0.2..HEAD -- zabbix_utils/ | grep -i security
   ```

2. **Fast-Track Implementation**
   - Prioritize security fixes
   - Minimal testing for urgent patches
   - Full testing in follow-up release

## Contributing to Sync Process

### Improving Automation

1. **Enhance Monitoring Script**
   - Add new analysis features
   - Improve change detection
   - Better reporting format

2. **Update Conversion Patterns**
   - Document new Python→TypeScript patterns
   - Add automated conversion helpers
   - Improve type mapping

### Documentation Updates

- Keep this guide current with process changes
- Document lessons learned from sync operations
- Update file mapping as structure evolves

## Links and Resources

- [Upstream Repository](https://github.com/zabbix/python-zabbix-utils)
- [Upstream Issues](https://github.com/zabbix/python-zabbix-utils/issues)
- [Upstream Releases](https://github.com/zabbix/python-zabbix-utils/releases)
- [Compare with Latest](https://github.com/zabbix/python-zabbix-utils/compare/v2.0.2...HEAD)

---

*This document is maintained as part of the TypeScript zabbix-utils port. Last updated: 2025-05-26* 