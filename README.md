<p align="center">
  <img src="https://raw.githubusercontent.com/Toolkit-F/Snowflake-Id/main/public/image.png" alt="Snowflake ID Logo" width="600" />
</p>


<p align="center">
  <a href="https://www.npmjs.com/package/@toolkit-f/snowflake-id"><img src="https://img.shields.io/npm/v/@toolkit-f/snowflake-id.svg" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@toolkit-f/snowflake-id"><img src="https://img.shields.io/npm/dm/@toolkit-f/snowflake-id.svg" alt="npm downloads"></a>
  <a href="https://github.com/Toolkit-F/Snowflake-Id/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@toolkit-f/snowflake-id.svg" alt="license"></a>
  <img src="https://img.shields.io/badge/TypeScript-Ready-blue.svg" alt="TypeScript">
</p>

<p align="center">
  A Snowflake ID generator for Node.js  •  No dependencies  •  TypeScript support
</p>

# Snowflake-ID

Snowflake IDs are 64-bit unique identifiers (63 usable bits, always positive). They are sortable by time and can be generated across multiple servers without coordination.

```
| 1 bit (unused/sign) | 41 bits - Timestamp | 10 bits - Machine ID | 12 bits - Sequence |
```

> **Note:** The sign bit is always `0`, so IDs stay positive in signed 64-bit systems (Java `long`, PostgreSQL `BIGINT`, etc.). Each epoch supports ~69.7 years of IDs before overflow.

## Table of Contents

- [Why Snowflake-ID?](#why-snowflake-id)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Batch Generation](#batch-generation)
- [Base62 / Base36 Encoding](#base62--base36-encoding)
- [Machine ID Resolvers](#machine-id-resolvers)
- [Custom Bit Layouts](#custom-bit-layouts)
- [Branded Generators](#branded-generators)
- [Pagination, Cursors and Sharding](#pagination-cursors-and-sharding)
- [Observability](#observability)
- [Production Guide](#production-guide)
- [API Reference](#api-reference)
- [TypeScript Types](#typescript-types)
- [Error Handling](#error-handling)
- [Contributing](#contributing)
- [License](#license)

---

## Why Snowflake-ID?

| Feature | Snowflake ID | UUID v7 | UUID v4 | Auto Increment |
|---------|-------------|---------|---------|----------------|
| **Sortable** | Yes (time) | Yes (time) | No | Yes |
| **Unique** | Distributed | Global | Global | Single DB |
| **DB Size** | **8 bytes** | 16 bytes | 16 bytes | 4/8 bytes |
| **Index** | Fast (B-Tree) | Fast (B-Tree) | Slow (fragmented) | Fast |
| **Performance** | ~4M ops/sec | ~2M ops/sec | ~5M ops/sec | Database limit |
| **Coordination** | None | None | None | Centralized |

This library generates about **4 million IDs per second** on a standard laptop.

---

## Installation

```bash
# npm
npm install @toolkit-f/snowflake-id

# yarn
yarn add @toolkit-f/snowflake-id

# pnpm
pnpm add @toolkit-f/snowflake-id

# bun
bun add @toolkit-f/snowflake-id
```

---

## Quick Start

### Generate IDs

```typescript
import { SnowflakeGenerator } from '@toolkit-f/snowflake-id';

// Create a generator with a unique machine ID (0-1023)
const generator = new SnowflakeGenerator({ machineId: 1 });

// Generate as BigInt
const id = generator.nextId();
console.log(id);  // 136941813297541120n

// Generate as string (recommended for JSON/APIs)
const idString = generator.nextIdString();
console.log(idString);  // "136941813297541121"
```

Or use the factory function:

```typescript
import { createGenerator } from '@toolkit-f/snowflake-id';

const generator = createGenerator({ machineId: 1 });
```

### Parse Existing IDs

```typescript
import { parseSnowflake } from '@toolkit-f/snowflake-id';

const parts = parseSnowflake('136941813297545217');
console.log(parts);
// {
//   id: 136941813297545217n,
//   timestamp: 2024-01-16T09:09:25.000Z,
//   timestampMs: 1737017365000,
//   machineId: 1,
//   sequence: 1
// }
```

### CommonJS

```javascript
const { SnowflakeGenerator } = require('@toolkit-f/snowflake-id');

const generator = new SnowflakeGenerator({ machineId: 1 });
console.log(generator.nextIdString());
```

---

## Batch Generation

Generate many IDs at once. This is faster than calling `nextId()` in a loop because it avoids per-call overhead.

```typescript
import { SnowflakeGenerator } from '@toolkit-f/snowflake-id';

const generator = new SnowflakeGenerator({ machineId: 1 });

// Generate 1000 IDs as BigInt
const ids = generator.nextBatch(1000);
console.log(ids.length);  // 1000

// Generate 1000 IDs as strings
const idStrings = generator.nextBatchString(1000);
console.log(idStrings[0]);  // "325486911772692480"
```

Maximum batch size is 100,000. All IDs in a batch are unique and monotonically increasing.

---

## Base62 / Base36 Encoding

Snowflake IDs are 18-digit decimal numbers. You can encode them into shorter strings for URLs, short codes, or compact storage.

```typescript
import {
  snowflakeToBase62,
  base62ToSnowflake,
  snowflakeToBase36,
  base36ToSnowflake,
} from '@toolkit-f/snowflake-id';

const id = 325486911772692480n;

// Base62: 10 characters, alphanumeric (0-9, A-Z, a-z)
const short = snowflakeToBase62(id);
console.log(short);  // "O2jTbkht68"

// Decode it back
const original = base62ToSnowflake(short);
console.log(original === id);  // true

// Base36: 12 characters, lowercase alphanumeric (0-9, a-z)
const b36 = snowflakeToBase36(id);
console.log(b36);  // "2h0vhb12frpc"
```

**Size comparison:**

| Format | Example | Length |
|--------|---------|--------|
| Decimal | `325486911772692480` | 18 chars |
| Base36 | `2h0vhb12frpc` | 12 chars |
| Base62 | `O2jTbkht68` | 10 chars |
| UUID v4 | `550e8400-e29b-41d4-a716-446655440000` | 36 chars |

### Custom Alphabet

You can use any alphabet with at least 2 characters:

```typescript
import { snowflakeEncode, snowflakeDecode } from '@toolkit-f/snowflake-id';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const encoded = snowflakeEncode(id, alphabet);
const decoded = snowflakeDecode(encoded, alphabet);
console.log(decoded === id);  // true
```

---

## Machine ID Resolvers

In production, every running instance needs a unique `machineId` (0-1023). These helpers figure out the right value automatically.

```typescript
import {
  resolveFromHostname,
  resolveFromEnv,
  resolveFromNetworkInterface,
  resolveFromProcessId,
  SnowflakeGenerator,
} from '@toolkit-f/snowflake-id';

// From hostname — extracts trailing number (e.g., "web-3" -> 3)
const id1 = resolveFromHostname();

// From environment variable — throws if missing (unless you set a fallback)
const id2 = resolveFromEnv('MACHINE_ID', { fallback: 0 });

// From network interface — uses last two octets of IPv4 address
const id3 = resolveFromNetworkInterface();

// From process ID — uses process.pid % 1024
const id4 = resolveFromProcessId();

// Use any of these with the generator
const generator = new SnowflakeGenerator({ machineId: id2 });
```

All resolvers clamp the result to the 0-1023 range automatically.

---

## Custom Bit Layouts

The default layout is `41|10|12` (41 timestamp bits, 10 machine bits, 12 sequence bits). You can change this to fit your needs. The three fields must add up to 63 bits.

```typescript
import { defineLayout, SnowflakeGenerator } from '@toolkit-f/snowflake-id';

// Sonyflake-style: more machines, fewer sequences per tick
const sonyflake = defineLayout({
  timestamp: { bits: 39, resolution: 10 },  // 10ms ticks, ~174 years
  machine:   { bits: 16 },                  // 65,535 machines
  sequence:  { bits: 8 },                   // 256 IDs per tick
});

const generator = new SnowflakeGenerator({
  machineId: 42,
  layout: sonyflake,
});

console.log(generator.nextId());

// Check layout properties
console.log(sonyflake.maxMachineId);   // 65535
console.log(sonyflake.lifespanYears);  // ~174
console.log(sonyflake.idsPerMs);       // 25.6
```

### Layout Examples

| Use Case | Timestamp | Machine | Sequence | Lifespan | Max Machines | IDs/ms |
|----------|-----------|---------|----------|----------|-------------|--------|
| Default | 41 bits | 10 bits | 12 bits | ~69 years | 1,024 | 4,096 |
| IoT (many devices) | 39 bits, 10ms | 16 bits | 8 bits | ~174 years | 65,535 | 25 |
| Single server | 42 bits | 8 bits | 13 bits | ~139 years | 256 | 8,192 |

---

## Branded Generators

If you use TypeScript and want to prevent mixing up IDs from different tables (like passing a `UserId` where an `OrderId` is expected), use branded generators.

```typescript
import { createBrandedGenerator } from '@toolkit-f/snowflake-id';
import type { BrandedSnowflake } from '@toolkit-f/snowflake-id';

// Create typed generators
const userIdGen = createBrandedGenerator<'User'>({ machineId: 1 });
const orderIdGen = createBrandedGenerator<'Order'>({ machineId: 1 });

const userId = userIdGen.nextId();    // type: BrandedSnowflake<'User'>
const orderId = orderIdGen.nextId();  // type: BrandedSnowflake<'Order'>

// TypeScript will catch this mistake at compile time:
function getUser(id: BrandedSnowflake<'User'>) { /* ... */ }
getUser(userId);   // OK
// getUser(orderId);  // Type error — 'Order' is not assignable to 'User'

// String variants work the same way
const userIdStr = userIdGen.nextIdString();  // type: BrandedSnowflakeString<'User'>
```

Branded generators have all the same methods as `SnowflakeGenerator` — `nextId()`, `nextIdString()`, `nextBatch()`, `nextBatchString()`, `status()`, `parseId()`.

---

## Pagination, Cursors and Sharding

### Time-Range Queries

Find all Snowflake IDs generated within a time window. Useful for `WHERE id BETWEEN min AND max` queries.

```typescript
import { snowflakeRange } from '@toolkit-f/snowflake-id';

const range = snowflakeRange(
  new Date('2024-06-15T00:00:00Z'),
  new Date('2024-06-15T23:59:59Z'),
);

console.log(range.min);  // smallest possible ID at start of day
console.log(range.max);  // largest possible ID at end of day

// Use in a database query
// SELECT * FROM orders WHERE id >= $1 AND id <= $2
```

### Cursor-Based Pagination

Encode a Snowflake ID into an opaque cursor for API pagination. The cursor is a base64url-encoded string that clients can pass back to your API.

```typescript
import { createCursor, parseCursor } from '@toolkit-f/snowflake-id';

// After fetching a page of results, create a cursor from the last ID
const cursor = createCursor(325486911772692480n);
console.log(cursor);  // "eyJpZCI6IjMyNTQ4NjkxMTc3MjY5MjQ4MCJ9"

// When the client sends the cursor back, decode it
const { id } = parseCursor(cursor);
console.log(id);  // 325486911772692480n

// Use it in your query
// SELECT * FROM items WHERE id > $1 ORDER BY id LIMIT 20
```

### Shard Key

Derive a consistent shard number from any Snowflake ID:

```typescript
import { shardKey } from '@toolkit-f/snowflake-id';

const shard = shardKey(325486911772692480n, { shards: 16 });
console.log(shard);  // 0-15 — always the same for the same ID
```

---

## Observability

### Generator Status

Check the current state of a generator at any time:

```typescript
import { SnowflakeGenerator } from '@toolkit-f/snowflake-id';

const generator = new SnowflakeGenerator({ machineId: 1 });

// Generate some IDs
for (let i = 0; i < 10000; i++) generator.nextId();

const status = generator.status();
console.log(status);
// {
//   machineId: 1,
//   epoch: 1704067200000,
//   epochExpiresAt: 2093-09-06T...,
//   remainingYears: 67.2,
//   totalIdsGenerated: 10000n,
//   lastGeneratedAt: 2024-06-15T...,
//   sequenceUtilization: 0.24
// }
```

### Instance-Level Parsing

The generator can parse IDs using its own layout and epoch, which matters when you use custom layouts:

```typescript
const parts = generator.parseId(someId);
console.log(parts.timestamp);
console.log(parts.machineId);
console.log(parts.sequence);
```

### Event Hooks

Monitor clock drift and sequence overflow in real time:

```typescript
const generator = new SnowflakeGenerator({
  machineId: 1,
  clockMoveBackAction: 'wait',
  onClockDrift: (driftMs) => {
    console.warn(`Clock moved back by ${driftMs}ms`);
    metrics.increment('snowflake.clock_drift');
  },
  onSequenceOverflow: () => {
    console.warn('Sequence overflowed, waiting for next millisecond');
    metrics.increment('snowflake.sequence_overflow');
  },
});
```

The `onClockDrift` hook fires whenever the system clock goes backwards. The `onSequenceOverflow` hook fires when more than 4,096 IDs are generated in the same millisecond and the generator has to wait for the next tick.

---

## Production Guide

### 1. Database Storage

**Always use `.nextIdString()` for databases and APIs.** JavaScript's `Number` type cannot hold 64-bit integers accurately. IDs will lose precision and become incorrect if you cast them to `Number`.

```javascript
// Wrong — precision loss
const id = generator.nextId();
const numericId = Number(id);  // data corruption

// Right — keep as string
const stringId = generator.nextIdString();
```

#### PostgreSQL

Use `BIGINT` to store IDs:

```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY,
  username TEXT
);
```

```javascript
const id = generator.nextIdString();
await db.query('INSERT INTO users (id, username) VALUES ($1, $2)', [id, 'alice']);
```

#### MySQL

Use `BIGINT`:

```sql
CREATE TABLE orders (
  id BIGINT PRIMARY KEY,
  amount DECIMAL(10, 2)
);
```

#### MongoDB

Store as `String`:

```javascript
const id = generator.nextIdString();
await collection.insertOne({ _id: id, ... });
```

### Common Mistakes

| Mistake | What happens | Fix |
|---------|-------------|-----|
| `Number(id)` | Data corruption | Use `String(id)` or `BigInt` |
| `machineId: 0` on all servers | ID collisions | Give each instance a unique ID |
| `Math.random()` for IDs | No sorting, no parsing | Use Snowflake |

### 2. Distributed Deployment (machineId)

Every running instance must have a unique `machineId` (0-1023) to prevent collisions.

#### Kubernetes (StatefulSet)

Use the pod ordinal from the hostname (e.g., `web-0`, `web-1`):

```javascript
import { resolveFromHostname, SnowflakeGenerator } from '@toolkit-f/snowflake-id';

const generator = new SnowflakeGenerator({
  machineId: resolveFromHostname(),  // "web-3" -> 3
});
```

#### Docker / Environment Variable

```yaml
services:
  api:
    environment:
      - MACHINE_ID={{.Task.Slot}}
```

```javascript
import { resolveFromEnv, SnowflakeGenerator } from '@toolkit-f/snowflake-id';

const generator = new SnowflakeGenerator({
  machineId: resolveFromEnv('MACHINE_ID', { fallback: 0 }),
});
```

#### Multi-Region

Split the `machineId` range by region:

| Region | machineId Range |
|--------|----------------|
| us-east | 0-255 |
| us-west | 256-511 |
| eu-west | 512-767 |
| ap-south | 768-1023 |

### 3. Security

Snowflake IDs expose the creation timestamp. Anyone with the ID can calculate when a record was created:

```javascript
import { parseSnowflake } from '@toolkit-f/snowflake-id';

console.log(parseSnowflake('136941813297545217').timestamp);
// 2024-01-16T09:09:25.000Z
```

- Do not use Snowflake IDs if the creation time must stay secret.
- Do not trust the embedded timestamp for security checks — a client generating its own IDs can put any time in there.
- For public-facing URLs where you want to hide volume or timing, use a separate random slug (UUID or NanoID) instead.

### Framework Integrations

#### NestJS

```typescript
// snowflake.provider.ts
import { Provider } from '@nestjs/common';
import { SnowflakeGenerator, resolveFromEnv } from '@toolkit-f/snowflake-id';

export const SNOWFLAKE_PROVIDER = 'SNOWFLAKE_GENERATOR';

export const snowflakeProvider: Provider = {
  provide: SNOWFLAKE_PROVIDER,
  useFactory: () => {
    return new SnowflakeGenerator({
      machineId: resolveFromEnv('MACHINE_ID', { fallback: 0 }),
    });
  },
};
```

#### Prisma

```prisma
model User {
  id        BigInt   @id
  username  String
}
```

Generate the ID in code before inserting:

```typescript
const id = BigInt(generator.nextIdString());
await prisma.user.create({ data: { id, username: 'alice' } });
```

#### TypeORM

```typescript
@Entity()
export class User {
  @PrimaryColumn('bigint')
  id: string;  // TypeORM handles BigInt as string
}
```

---

## API Reference

### SnowflakeGenerator

| Method | Returns | Description |
|--------|---------|-------------|
| `nextId()` | `bigint` | Generate a unique ID |
| `nextIdString()` | `string` | Generate a unique ID as a string |
| `nextBatch(count)` | `bigint[]` | Generate `count` IDs (max 100,000) |
| `nextBatchString(count)` | `string[]` | Generate `count` IDs as strings |
| `parseId(id)` | `SnowflakeParts` | Decompose an ID using this generator's layout |
| `status()` | `GeneratorStatus` | Current stats (total generated, epoch expiry, etc.) |
| `getMachineId()` | `number` | The configured machine ID |
| `getEpoch()` | `number` | The configured epoch timestamp |
| `getSequence()` | `number` | Current sequence counter |
| `getLastTimestamp()` | `number` | Timestamp of last generated ID |

### Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `machineId` | `number` | required | Unique ID for this instance (0-1023) |
| `epoch` | `number` | `1704067200000` | Custom epoch in ms (Jan 1, 2024) |
| `clockMoveBackAction` | `'throw' \| 'wait'` | `'throw'` | What to do if the clock goes backwards |
| `onClockDrift` | `(ms: number) => void` | - | Called when clock drift is detected |
| `onSequenceOverflow` | `() => void` | - | Called when sequence overflows within a tick |
| `layout` | `SnowflakeLayout` | default 41\|10\|12 | Custom bit layout from `defineLayout()` |

### Utility Functions

| Function | Description |
|----------|-------------|
| `parseSnowflake(id, epoch?)` | Decompose an ID into timestamp, machineId, sequence |
| `stringifySnowflakeParts(parts)` | Convert parts to JSON-safe format (BigInt to string) |
| `getTimestamp(id, epoch?)` | Extract the `Date` from an ID |
| `getMachineId(id)` | Extract the machine ID from an ID |
| `getSequence(id)` | Extract the sequence from an ID |
| `isValidSnowflake(id, epoch?, relaxed?)` | Check if a value is a valid Snowflake ID |
| `snowflakeToString(id)` | Convert BigInt ID to string |
| `stringToSnowflake(str)` | Convert string ID to BigInt |
| `compareSnowflakes(a, b)` | Compare two IDs: returns -1, 0, or 1 |
| `snowflakeFromTimestamp(date, machineId?, seq?, epoch?)` | Build an ID from a specific timestamp |

### Encoding Functions

| Function | Description |
|----------|-------------|
| `snowflakeToBase62(id)` | Encode to base62 (0-9, A-Z, a-z) |
| `base62ToSnowflake(str)` | Decode from base62 |
| `snowflakeToBase36(id)` | Encode to base36 (0-9, a-z) |
| `base36ToSnowflake(str)` | Decode from base36 |
| `snowflakeEncode(id, alphabet)` | Encode with a custom alphabet |
| `snowflakeDecode(str, alphabet)` | Decode with a custom alphabet |

### Resolver Functions

| Function | Description |
|----------|-------------|
| `resolveFromHostname()` | Extract number from hostname (e.g., "web-3" -> 3) |
| `resolveFromEnv(name, opts?)` | Read from environment variable |
| `resolveFromNetworkInterface()` | Derive from IPv4 address |
| `resolveFromProcessId()` | Use `process.pid % 1024` |

### Pagination Functions

| Function | Description |
|----------|-------------|
| `snowflakeRange(start, end, epoch?)` | Get min/max IDs for a time window |
| `createCursor(id)` | Encode an ID as an opaque cursor string |
| `parseCursor(cursor)` | Decode a cursor back to `{ id: bigint }` |
| `shardKey(id, { shards })` | Derive a shard number (0 to shards-1) |

### Layout

| Function | Description |
|----------|-------------|
| `defineLayout(config)` | Create a custom bit layout (must sum to 63) |
| `createBrandedGenerator(config)` | Create a type-safe generator for a specific entity |

### Exported Constants

```typescript
import {
  DEFAULT_EPOCH,      // 1704067200000 (Jan 1, 2024 UTC)
  MAX_MACHINE_ID,     // 1023
  MAX_SEQUENCE,       // 4095n
  MACHINE_ID_SHIFT,   // 12n
  TIMESTAMP_SHIFT,    // 22n
  MAX_TIMESTAMP,      // 2199023255551n (~69.7 years)
  MAX_SNOWFLAKE_ID,   // 9223372036854775807n (2^63 - 1)
  MAX_BATCH_SIZE,     // 100_000
} from '@toolkit-f/snowflake-id';
```

---

## TypeScript Types

```typescript
import type {
  SnowflakeConfig,
  SnowflakeParts,
  SnowflakePartsJSON,
  GeneratorStatus,
  SnowflakeLayout,
  LayoutConfig,
  SnowflakeRange,
  BrandedSnowflake,
  BrandedSnowflakeString,
} from '@toolkit-f/snowflake-id';

import type { BrandedGenerator } from '@toolkit-f/snowflake-id';
```

### Key Interfaces

```typescript
interface SnowflakeConfig {
  machineId: number;
  epoch?: number;
  clockMoveBackAction?: 'throw' | 'wait';
  onClockDrift?: (driftMs: number) => void;
  onSequenceOverflow?: () => void;
  layout?: SnowflakeLayout;
}

interface SnowflakeParts {
  id: bigint;
  timestamp: Date;
  timestampMs: number;
  machineId: number;
  sequence: number;
}

interface GeneratorStatus {
  machineId: number;
  epoch: number;
  epochExpiresAt: Date;
  remainingYears: number;
  totalIdsGenerated: bigint;
  lastGeneratedAt: Date | null;
  sequenceUtilization: number;
}

interface LayoutConfig {
  timestamp: { bits: number; resolution?: number };
  machine: { bits: number };
  sequence: { bits: number };
}
```

---

## Error Handling

The library throws plain `Error` objects with descriptive messages:

```typescript
import { SnowflakeGenerator, stringToSnowflake, parseSnowflake } from '@toolkit-f/snowflake-id';

// Invalid machine ID
try {
  new SnowflakeGenerator({ machineId: 2000 });
} catch (e) {
  console.log(e.message);
  // "machineId must be integer 0-1023, got 2000"
}

// Future epoch
try {
  new SnowflakeGenerator({ machineId: 1, epoch: Date.now() + 100000 });
} catch (e) {
  console.log(e.message);
  // "epoch cannot be in the future"
}

// Invalid string
try {
  stringToSnowflake('not-a-number');
} catch (e) {
  console.log(e.message);
  // 'Invalid Snowflake ID string: "not-a-number"'
}

// Invalid parse input
try {
  parseSnowflake('abc123');
} catch (e) {
  console.log(e.message);
  // 'Invalid Snowflake ID: "abc123"'
}

// Batch too large
try {
  generator.nextBatch(200_000);
} catch (e) {
  console.log(e.message);
  // "count must not exceed 100000, got 200000"
}
```

---

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup instructions and guidelines.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'feat: add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## License

[MIT](https://github.com/Toolkit-F/Snowflake-Id/blob/main/LICENSE) - [Toolkit-F](https://github.com/Toolkit-F)
