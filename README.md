<p align="center">
  <img src="https://raw.githubusercontent.com/maulik-mk/Snowflake-Id/main/public/image.png" alt="Snowflake ID Logo" width="600" />
</p>


<p align="center">
  <a href="https://www.npmjs.com/package/@toolkit-f/snowflake-id"><img src="https://img.shields.io/npm/v/@toolkit-f/snowflake-id.svg" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@toolkit-f/snowflake-id"><img src="https://img.shields.io/npm/dm/@toolkit-f/snowflake-id.svg" alt="npm downloads"></a>
  <a href="https://github.com/maulik-mk/Snowflake-Id/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@toolkit-f/snowflake-id.svg" alt="license"></a>
  <img src="https://img.shields.io/badge/TypeScript-Ready-blue.svg" alt="TypeScript">
</p>

<p align="center">
  A Snowflake ID generator for Node.js  •  No dependencies  •  TypeScript support
</p>

# Snowflake-ID

Snowflake IDs are 64-bit unique identifiers. Sortable by time and can be generated across multiple servers without coordination and collision.

```
| 41 bits - Timestamp | 10 bits - Machine ID | 12 bits - Sequence |
```

### Features

- Generates unique IDs across distributed systems
- Works with CommonJS and ESM
- Full TypeScript support
- Parse IDs to extract timestamp, machine ID, and sequence

---

## Installation

### npm
```bash
npm install @toolkit-f/snowflake-id
```

### Yarn
```bash
yarn add @toolkit-f/snowflake-id
```

### pnpm
```bash
pnpm add @toolkit-f/snowflake-id
```

### Bun
```bash
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

// Generate as String (recommended for JSON/APIs)
const idString = generator.nextIdString();
console.log(idString);  // "136941813297541121"
```

### Parse Existing IDs

```typescript
import { parseSnowflake } from '@toolkit-f/snowflake-id';

const parts = parseSnowflake('136941813297545217');
console.log(parts);
// {
//   id: 136941813297545217n,
//   timestamp: 2024-01-16T09:09:25.000Z,
//   machineId: 1,
//   sequence: 1
// }
```

### CommonJS Support

```javascript
const { SnowflakeGenerator } = require('@toolkit-f/snowflake-id');

const generator = new SnowflakeGenerator({ machineId: 1 });
console.log(generator.nextIdString());
```

---

## API Reference

### Core Class: `SnowflakeGenerator`

#### Constructor

```typescript
new SnowflakeGenerator(config: SnowflakeConfig)
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `machineId` | `number` | Yes | - | Unique ID for this machine/worker (0-1023) |
| `epoch` | `number` | No | `1704067200000` (Jan 1, 2024) | Custom epoch in milliseconds |
| `clockMoveBackAction` | `'throw'` \| `'wait'` | No | `'throw'` | Behavior when system clock drifts backwards |

**Example:**
```typescript
import { SnowflakeGenerator } from '@toolkit-f/snowflake-id';

const generator = new SnowflakeGenerator({
  machineId: 5,
  epoch: 1609459200000,        // Jan 1, 2021
  clockMoveBackAction: 'wait'  // Wait instead of throwing error
});
```

---

#### `nextId(): bigint`

Generates the next unique ID as a `bigint`.

```typescript
const generator = new SnowflakeGenerator({ machineId: 1 });

console.log(generator.nextId());
// 136941813297541120n

console.log(generator.nextId());
// 136941813297541121n

console.log(generator.nextId());
// 136941813297545216n
```

---

#### `nextIdString(): string`

Generates the next unique ID as a `string`.

```typescript
const generator = new SnowflakeGenerator({ machineId: 1 });

console.log(generator.nextIdString());
// "136941813297541120"

console.log(generator.nextIdString());
// "136941813297541121"
```

---

#### `getMachineId(): number`

Returns the configured machine ID.

```typescript
const generator = new SnowflakeGenerator({ machineId: 42 });

console.log(generator.getMachineId());
// 42
```

---

#### `getEpoch(): number`

Returns the configured epoch timestamp.

```typescript
const generator = new SnowflakeGenerator({ machineId: 1 });

console.log(generator.getEpoch());
// 1704067200000
```

---

#### `getSequence(): number`

Returns the current sequence number.

```typescript
const generator = new SnowflakeGenerator({ machineId: 1 });

generator.nextId();
console.log(generator.getSequence());
// 0

generator.nextId();
console.log(generator.getSequence());
// 1
```

---

#### `getLastTimestamp(): number`

Returns the timestamp of the last generated ID.

```typescript
const generator = new SnowflakeGenerator({ machineId: 1 });

generator.nextId();
console.log(generator.getLastTimestamp());
// 1737017365000
```

---

### Factory Function: `createGenerator`

```typescript
createGenerator(config: SnowflakeConfig): SnowflakeGenerator
```

Alternative way to create a generator instance.

```typescript
import { createGenerator } from '@toolkit-f/snowflake-id';

const generator = createGenerator({ machineId: 1 });

console.log(generator.nextId());
// 136941813297541120n
```

---

### Utility Functions

#### `parseSnowflake(id, epoch?): SnowflakeParts`

Deconstructs a Snowflake ID into its components.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `id` | `bigint` \| `string` | Yes | - | The Snowflake ID to parse |
| `epoch` | `number` | No | `1704067200000` | Custom epoch used during generation |

**Returns:** `SnowflakeParts`

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

const parts2 = parseSnowflake(136941813297545217n);
console.log(parts2);
// {
//   id: 136941813297545217n,
//   timestamp: 2024-01-16T09:09:25.000Z,
//   timestampMs: 1737017365000,
//   machineId: 1,
//   sequence: 1
// }
```

---

#### `stringifySnowflakeParts(parts): SnowflakePartsJSON`

Converts SnowflakeParts to a JSON-serializable format.

```typescript
import { parseSnowflake, stringifySnowflakeParts } from '@toolkit-f/snowflake-id';

const parts = parseSnowflake('136941813297545217');
const json = stringifySnowflakeParts(parts);

console.log(json);
// {
//   id: "136941813297545217",
//   timestamp: "2024-01-16T09:09:25.000Z",
//   timestampMs: 1737017365000,
//   machineId: 1,
//   sequence: 1
// }

console.log(JSON.stringify(json));
// '{"id":"136941813297545217","timestamp":"2024-01-16T09:09:25.000Z","timestampMs":1737017365000,"machineId":1,"sequence":1}'
```

---

#### `getTimestamp(id, epoch?): Date`

Extracts the Date object from a Snowflake ID.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `id` | `bigint` \| `string` | Yes | - | The Snowflake ID |
| `epoch` | `number` | No | `1704067200000` | Custom epoch |

```typescript
import { getTimestamp } from '@toolkit-f/snowflake-id';

console.log(getTimestamp('136941813297545217'));
// 2024-01-16T09:09:25.000Z

console.log(getTimestamp(136941813297545217n));
// 2024-01-16T09:09:25.000Z
```

---

#### `getMachineId(id): number`

Extracts the machine ID from a Snowflake ID.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `bigint` \| `string` | Yes | The Snowflake ID |

```typescript
import { getMachineId } from '@toolkit-f/snowflake-id';

console.log(getMachineId('136941813297545217'));
// 1

console.log(getMachineId(136941813297545217n));
// 1
```

---

#### `getSequence(id): number`

Extracts the sequence number from a Snowflake ID.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `bigint` \| `string` | Yes | The Snowflake ID |

```typescript
import { getSequence } from '@toolkit-f/snowflake-id';

console.log(getSequence('136941813297545217'));
// 1

console.log(getSequence(136941813297545217n));
// 1
```

---

#### `isValidSnowflake(id, epoch?, relaxed?): boolean`

Validates if a value is a valid Snowflake ID.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `id` | `unknown` | Yes | - | Value to validate |
| `epoch` | `number` | No | `1704067200000` | Custom epoch |
| `relaxed` | `boolean` | No | `false` | Skip timestamp range check |

```typescript
import { isValidSnowflake } from '@toolkit-f/snowflake-id';

console.log(isValidSnowflake('136941813297545217'));
// true

console.log(isValidSnowflake(136941813297545217n));
// true

console.log(isValidSnowflake('invalid'));
// false

console.log(isValidSnowflake('abc123'));
// false

console.log(isValidSnowflake(-1n));
// false

// Relaxed mode (skip timestamp validation)
console.log(isValidSnowflake('999999999999999999999', undefined, true));
// true
```

---

#### `snowflakeToString(id): string`

Converts a bigint Snowflake ID to string.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `bigint` | Yes | The Snowflake ID |

```typescript
import { snowflakeToString } from '@toolkit-f/snowflake-id';

console.log(snowflakeToString(136941813297545217n));
// "136941813297545217"
```

---

#### `stringToSnowflake(str): bigint`

Converts a string Snowflake ID to bigint.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `str` | `string` | Yes | The Snowflake ID string |

```typescript
import { stringToSnowflake } from '@toolkit-f/snowflake-id';

console.log(stringToSnowflake('136941813297545217'));
// 136941813297545217n

// Throws error for invalid input
stringToSnowflake('invalid');
// Error: Invalid Snowflake ID string: "invalid"
```

---

#### `compareSnowflakes(a, b): -1 | 0 | 1`

Compares two Snowflake IDs. Useful for sorting.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `a` | `bigint` \| `string` | Yes | First Snowflake ID |
| `b` | `bigint` \| `string` | Yes | Second Snowflake ID |

**Returns:** `-1` if a < b, `0` if a === b, `1` if a > b

```typescript
import { compareSnowflakes } from '@toolkit-f/snowflake-id';

console.log(compareSnowflakes('136941813297545216', '136941813297545217'));
// -1

console.log(compareSnowflakes('136941813297545217', '136941813297545217'));
// 0

console.log(compareSnowflakes('136941813297545218', '136941813297545217'));
// 1

// Sorting example
const ids = ['136941813297545218', '136941813297545216', '136941813297545217'];
ids.sort(compareSnowflakes);
console.log(ids);
// ['136941813297545216', '136941813297545217', '136941813297545218']
```

---

#### `snowflakeFromTimestamp(date, machineId?, sequence?, epoch?): bigint`

Creates a Snowflake ID from a specific timestamp. Useful for database range queries.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `date` | `Date` \| `number` | Yes | - | Timestamp to create ID from |
| `machineId` | `number` | No | `0` | Machine ID (0-1023) |
| `sequence` | `number` | No | `0` | Sequence number (0-4095) |
| `epoch` | `number` | No | `1704067200000` | Custom epoch |

```typescript
import { snowflakeFromTimestamp } from '@toolkit-f/snowflake-id';

// From Date object
const id1 = snowflakeFromTimestamp(new Date('2024-06-15T12:00:00.000Z'));
console.log(id1);
// 59918327808000000n

// From timestamp number
const id2 = snowflakeFromTimestamp(1718452800000);
console.log(id2);
// 59918327808000000n

// With machine ID and sequence
const id3 = snowflakeFromTimestamp(new Date('2024-06-15T12:00:00.000Z'), 5, 10);
console.log(id3);
// 59918327808020490n

// Database range query example
const startOfDay = snowflakeFromTimestamp(new Date('2024-06-15T00:00:00.000Z'));
const endOfDay = snowflakeFromTimestamp(new Date('2024-06-15T23:59:59.999Z'));
console.log(`SELECT * FROM items WHERE id >= ${startOfDay} AND id <= ${endOfDay}`);
// SELECT * FROM items WHERE id >= 59914215014400000 AND id <= 60010106326016000
```

---

### Exported Constants

```typescript
import {
  DEFAULT_EPOCH,
  MAX_MACHINE_ID,
  MAX_SEQUENCE,
  MACHINE_ID_SHIFT,
  TIMESTAMP_SHIFT
} from '@toolkit-f/snowflake-id';

console.log(DEFAULT_EPOCH);
// 1704067200000 (Jan 1, 2024 00:00:00 UTC)

console.log(MAX_MACHINE_ID);
// 1023

console.log(MAX_SEQUENCE);
// 4095n

console.log(MACHINE_ID_SHIFT);
// 12n

console.log(TIMESTAMP_SHIFT);
// 22n
```

---

### TypeScript Types

```typescript
import type {
  SnowflakeConfig,
  SnowflakeParts,
  SnowflakePartsJSON
} from '@toolkit-f/snowflake-id';

// SnowflakeConfig
interface SnowflakeConfig {
  machineId: number;              // 0-1023
  epoch?: number;                 // Custom epoch (ms)
  clockMoveBackAction?: 'throw' | 'wait';
}

// SnowflakeParts
interface SnowflakeParts {
  id: bigint;
  timestamp: Date;
  timestampMs: number;
  machineId: number;
  sequence: number;
}

// SnowflakePartsJSON
interface SnowflakePartsJSON {
  id: string;
  timestamp: string;
  timestampMs: number;
  machineId: number;
  sequence: number;
}
```

---

## Error Handling

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

// Invalid string ID
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
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a [Pull Request](https://github.com/maulik-mk/Snowflake-Id/pulls).

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 🪪 License

[MIT](https://github.com/maulik-mk/Snowflake-Id/blob/main/LICENSE) © [Maulik M. K.](https://github.com/maulik-mk)
