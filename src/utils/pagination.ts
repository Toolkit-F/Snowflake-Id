import type { SnowflakeRange } from '../types/type';
import {
    TIMESTAMP_SHIFT,
    DEFAULT_EPOCH,
    MAX_SEQUENCE,
    MAX_MACHINE_ID,
    MACHINE_ID_SHIFT,
} from '../core/generator';

/**
 * Calculates the absolute minimum and maximum possible Snowflake IDs for a given time window.
 * This is primarily used for constructing efficient database queries (e.g., `WHERE id BETWEEN min AND max`).
 *
 * @example
 * ```ts
 * const start = new Date('2024-06-01T00:00:00Z');
 * const end = new Date('2024-06-01T23:59:59Z');
 * const range = snowflakeRange(start, end);
 * console.log(range.min); // Smallest possible ID on June 1st
 * console.log(range.max); // Largest possible ID on June 1st
 * ```
 *
 * @param start - The beginning of the time window (Date object or timestamp in milliseconds).
 * @param end - The end of the time window (Date object or timestamp in milliseconds).
 * @param epoch - The base epoch used when generating the IDs. Defaults to January 1, 2024.
 * @returns A {@link SnowflakeRange} object containing `min` and `max` BigInts.
 * @throws {Error} If `start` or `end` are invalid, or if `start` occurs after `end`.
 *
 * @public
 */
export function snowflakeRange(
    start: Date | number,
    end: Date | number,
    epoch = DEFAULT_EPOCH,
): SnowflakeRange {
    const startMs = typeof start === 'number' ? start : start.getTime();
    const endMs = typeof end === 'number' ? end : end.getTime();
    if (!Number.isInteger(startMs) || !Number.isInteger(endMs)) {
        throw new Error('start and end must resolve to valid integer timestamps');
    }
    if (startMs > endMs) {
        throw new Error(`start (${startMs}) must not be after end (${endMs})`);
    }
    const min = BigInt(startMs - epoch) << TIMESTAMP_SHIFT;
    const max =
        (BigInt(endMs - epoch) << TIMESTAMP_SHIFT) |
        (BigInt(MAX_MACHINE_ID) << MACHINE_ID_SHIFT) |
        MAX_SEQUENCE;
    return { min, max };
}

/**
 * Encodes a Snowflake ID into a Base64URL string for use as an opaque pagination cursor in APIs.
 *
 * @example
 * ```ts
 * const cursor = createCursor(325486911772692480n);
 * console.log(cursor); // "eyJpZCI6IjMyNTQ4NjkxMTc3MjY5MjQ4MCJ9"
 * ```
 *
 * @param id - The Snowflake ID to encode.
 * @returns A base64url-encoded string containing a JSON representation of the ID.
 *
 * @public
 */
export function createCursor(id: bigint | string): string {
    const sfId = typeof id === 'string' ? id : id.toString();
    return Buffer.from(JSON.stringify({ id: sfId })).toString('base64url');
}

/**
 * Decodes a previously generated pagination cursor back into its original Snowflake ID.
 *
 * @param cursor - The base64url-encoded cursor string.
 * @returns An object containing the extracted ID as a BigInt.
 * @throws {Error} If the cursor string is malformed or cannot be parsed.
 *
 * @public
 */
export function parseCursor(cursor: string): { id: bigint } {
    try {
        const json = Buffer.from(cursor, 'base64url').toString('utf-8');
        const decoded = JSON.parse(json) as { id?: string };
        if (!decoded.id || typeof decoded.id !== 'string') {
            throw new Error('Invalid cursor structure');
        }
        return { id: BigInt(decoded.id) };
    } catch (e: unknown) {
        if (e instanceof Error && e.message === 'Invalid cursor structure') {
            throw e;
        }
        throw new Error(`Invalid cursor: "${cursor}"`);
    }
}

/**
 * Derives a consistent, zero-indexed database shard number from a Snowflake ID.
 * This is computed using a simple modulo operation (`id % shards`).
 *
 * @example
 * ```ts
 * // Assuming we have 16 database shards
 * const shard = shardKey(325486911772692480n, { shards: 16 });
 * console.log(shard); // Returns an integer between 0 and 15
 * ```
 *
 * @param id - The Snowflake ID to evaluate.
 * @param options - Configuration object requiring the total number of shards.
 * @returns An integer representing the target shard index.
 * @throws {Error} If the number of shards is less than 1 or not an integer.
 *
 * @public
 */
export function shardKey(id: bigint | string, options: { shards: number }): number {
    const { shards } = options;
    if (!Number.isInteger(shards) || shards < 1) {
        throw new Error(`shards must be a positive integer, got ${shards}`);
    }
    const sfId = typeof id === 'string' ? BigInt(id) : id;
    return Number(sfId % BigInt(shards));
}
