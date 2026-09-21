import type { SnowflakeParts, SnowflakePartsJSON } from '../types/type';
import {
    MACHINE_ID_SHIFT,
    TIMESTAMP_SHIFT,
    DEFAULT_EPOCH,
    MAX_SEQUENCE,
    MAX_MACHINE_ID,
    MAX_SNOWFLAKE_ID,
    MAX_TIMESTAMP,
} from '../core/generator';

const SEQUENCE_MASK = MAX_SEQUENCE;
const MACHINE_ID_MASK = BigInt(MAX_MACHINE_ID);

/**
 * Validates and converts a string or BigInt ID into a BigInt.
 *
 * @param id - The ID to convert.
 * @returns The converted BigInt.
 * @throws {Error} If the string is not composed entirely of digits.
 * @internal
 */
function toSnowflakeBigInt(id: bigint | string): bigint {
    if (typeof id === 'string') {
        if (!/^\d+$/.test(id)) {
            throw new Error(`Invalid Snowflake ID: "${id}"`);
        }
        return BigInt(id);
    }
    return id;
}

/**
 * Validates that an epoch is a non-negative integer.
 *
 * @param epoch - The epoch value to check.
 * @throws {Error} If the epoch is not a non-negative integer.
 * @internal
 */
function validateEpoch(epoch: number): void {
    if (!Number.isInteger(epoch) || epoch < 0) {
        throw new Error(`epoch must be a non-negative integer, got ${epoch}`);
    }
}

/**
 * Deconstructs a Snowflake ID into its exact components (timestamp, machine ID, sequence).
 *
 * @remarks
 * This function extracts the raw bit fields from the 64-bit integer. It performs zero memory
 * allocations beyond the returned object and strictly validates inputs.
 *
 * @example
 * ```ts
 * const parts = parseSnowflake('136941813297545217');
 * console.log(parts.timestamp); // 2024-01-16T09:09:25.000Z
 * console.log(parts.machineId); // 1
 * ```
 *
 * @param id - The Snowflake ID to parse. Can be a `bigint` or a string representation.
 * @param epoch - Optional custom epoch in milliseconds. Defaults to January 1, 2024.
 *
 * @returns A {@link SnowflakeParts} object containing the parsed bit fields.
 * @throws {Error} If the provided ID string is malformed, negative, or exceeds 63 bits.
 *
 * @public
 */
export function parseSnowflake(id: bigint | string, epoch = DEFAULT_EPOCH): SnowflakeParts {
    validateEpoch(epoch);

    if (typeof id === 'string' && !/^\d+$/.test(id)) {
        throw new Error(`Invalid Snowflake ID: "${id}"`);
    }

    const sfId = typeof id === 'string' ? BigInt(id) : id;

    if (sfId < 0n) {
        throw new Error(`Invalid Snowflake ID: negative value`);
    }

    if (sfId > MAX_SNOWFLAKE_ID) {
        throw new Error(`Invalid Snowflake ID: exceeds 63-bit positive range`);
    }

    const timestampMs = Number(sfId >> TIMESTAMP_SHIFT) + epoch;

    return {
        id: sfId,
        timestamp: new Date(timestampMs),
        timestampMs,
        machineId: Number((sfId >> MACHINE_ID_SHIFT) & MACHINE_ID_MASK),
        sequence: Number(sfId & SEQUENCE_MASK),
    };
}

/**
 * Serializes a SnowflakeParts object into a JSON-safe format.
 * Converts the BigInt ID to a string to prevent JSON precision loss.
 *
 * @param parts - The parsed Snowflake parts.
 * @returns A strictly typed, JSON-serializable object.
 *
 * @public
 */
export function stringifySnowflakeParts(parts: SnowflakeParts): SnowflakePartsJSON {
    return {
        id: parts.id.toString(),
        timestamp: parts.timestamp.toISOString(),
        timestampMs: parts.timestampMs,
        machineId: parts.machineId,
        sequence: parts.sequence,
    };
}

/**
 * Extracts only the timestamp Date object from a Snowflake ID.
 *
 * @example
 * ```ts
 * const date = getTimestamp('136941813297545217');
 * console.log(date.toISOString());
 * ```
 *
 * @param id - The Snowflake ID string or BigInt.
 * @param epoch - The base epoch used when generating the ID.
 * @returns A JavaScript Date object representing when the ID was generated.
 *
 * @public
 */
export function getTimestamp(id: bigint | string, epoch = DEFAULT_EPOCH): Date {
    validateEpoch(epoch);
    const sfId = toSnowflakeBigInt(id);
    return new Date(Number(sfId >> TIMESTAMP_SHIFT) + epoch);
}

/**
 * Extracts only the machine ID integer from a Snowflake ID.
 *
 * @param id - The Snowflake ID string or BigInt.
 * @returns The machine ID as a number (0-1023 by default).
 *
 * @public
 */
export function getMachineId(id: bigint | string): number {
    const sfId = toSnowflakeBigInt(id);
    return Number((sfId >> MACHINE_ID_SHIFT) & MACHINE_ID_MASK);
}

/**
 * Extracts only the sequence counter from a Snowflake ID.
 *
 * @param id - The Snowflake ID string or BigInt.
 * @returns The sequence number (0-4095 by default).
 *
 * @public
 */
export function getSequence(id: bigint | string): number {
    const sfId = toSnowflakeBigInt(id);
    return Number(sfId & SEQUENCE_MASK);
}

/**
 * Validates whether a given variable is a correctly formatted Snowflake ID.
 *
 * @param id - The value to check (string or BigInt).
 * @param epoch - The epoch to validate against.
 * @param relaxed - If true, skips the chronological timestamp validation (checking if it is from the future).
 * @returns `true` if it is a valid Snowflake ID, `false` otherwise.
 *
 * @public
 */
export function isValidSnowflake(id: unknown, epoch = DEFAULT_EPOCH, relaxed = false): boolean {
    if (typeof id === 'number') return false;

    if (typeof id === 'string') {
        if (!/^\d+$/.test(id)) return false;
        try {
            id = BigInt(id);
        } catch {
            return false;
        }
    }

    if (typeof id !== 'bigint' || id < 0n || id > MAX_SNOWFLAKE_ID) return false;
    if (relaxed) return true;

    const ts = Number(id >> TIMESTAMP_SHIFT) + epoch;
    return ts >= epoch && ts <= Date.now() + 1000;
}

/**
 * Converts a BigInt Snowflake ID into a string safely.
 *
 * @param id - The BigInt ID.
 * @returns A string representation of the ID.
 *
 * @public
 */
export function snowflakeToString(id: bigint): string {
    return id.toString();
}

/**
 * Converts a string Snowflake ID into a BigInt safely.
 *
 * @param str - The string ID.
 * @returns A BigInt representation of the ID.
 * @throws {Error} If the string contains non-numeric characters.
 *
 * @public
 */
export function stringToSnowflake(str: string): bigint {
    if (!/^\d+$/.test(str)) {
        throw new Error(`Invalid Snowflake ID string: "${str}"`);
    }
    return BigInt(str);
}

/**
 * Compares two Snowflake IDs chronologically.
 *
 * @param a - The first ID to compare.
 * @param b - The second ID to compare.
 * @returns `-1` if `a < b`, `1` if `a > b`, and `0` if they are equal.
 *
 * @public
 */
export function compareSnowflakes(a: bigint | string, b: bigint | string): -1 | 0 | 1 {
    const idA = toSnowflakeBigInt(a);
    const idB = toSnowflakeBigInt(b);
    return idA < idB ? -1 : idA > idB ? 1 : 0;
}

/**
 * Constructs a custom Snowflake ID from a specific timestamp, machine ID, and sequence.
 *
 * @example
 * ```ts
 * const customId = snowflakeFromTimestamp(new Date('2024-06-01T00:00:00Z'), 1, 0);
 * ```
 *
 * @param date - The target Date object or Unix timestamp in milliseconds.
 * @param machineId - The machine ID component (defaults to 0).
 * @param sequence - The sequence counter component (defaults to 0).
 * @param epoch - The base epoch (defaults to January 1, 2024).
 * @returns The generated Snowflake ID as a BigInt.
 * @throws {Error} If inputs fall outside their strictly allowed integer boundaries.
 *
 * @public
 */
export function snowflakeFromTimestamp(
    date: Date | number,
    machineId = 0,
    sequence = 0,
    epoch = DEFAULT_EPOCH,
): bigint {
    if (machineId < 0 || machineId > MAX_MACHINE_ID || !Number.isInteger(machineId)) {
        throw new Error(`machineId must be integer 0-${MAX_MACHINE_ID}, got ${machineId}`);
    }
    if (sequence < 0 || sequence > Number(MAX_SEQUENCE) || !Number.isInteger(sequence)) {
        throw new Error(`sequence must be integer 0-${Number(MAX_SEQUENCE)}, got ${sequence}`);
    }
    validateEpoch(epoch);
    const ts = typeof date === 'number' ? date : date.getTime();
    if (!Number.isInteger(ts)) {
        throw new Error(`date must resolve to a valid integer timestamp, got ${ts}`);
    }
    const elapsed = BigInt(ts - epoch);
    if (elapsed < 0n) {
        throw new Error(`timestamp (${ts}) must not be before epoch (${epoch})`);
    }
    if (elapsed > MAX_TIMESTAMP) {
        throw new Error(
            `Timestamp overflow: elapsed ${elapsed}ms exceeds 41-bit max (${MAX_TIMESTAMP}). Epoch is too old.`,
        );
    }
    return (
        (elapsed << TIMESTAMP_SHIFT) | (BigInt(machineId) << MACHINE_ID_SHIFT) | BigInt(sequence)
    );
}
