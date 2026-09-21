import type { SnowflakeConfig, SnowflakeParts, GeneratorStatus } from '../types/type';

/** Maximum value for the machine identifier in the default layout (1023). */
const MAX_MACHINE_ID = 1023;
/** Maximum value for the sequence counter in the default layout (4095). */
const MAX_SEQUENCE = 4095n;
/** Bit shift required for the machine ID in the default layout (12 bits). */
const MACHINE_ID_SHIFT = 12n;
/** Bit shift required for the timestamp in the default layout (22 bits). */
const TIMESTAMP_SHIFT = 22n;
/** Default epoch timestamp in milliseconds (Jan 1, 2024 00:00:00 UTC). */
const DEFAULT_EPOCH = 1704067200000;
/** Maximum milliseconds the generator will block waiting for a backward clock drift. */
const MAX_CLOCK_WAIT_MS = 50;
/** Maximum theoretical timestamp value for the default 41-bit allocation. */
const MAX_TIMESTAMP = 2199023255551n;
/** Maximum positive integer value for a signed 64-bit integer. */
const MAX_SNOWFLAKE_ID = 9223372036854775807n;
/** The hard limit on the number of IDs that can be generated in a single batch request. */
const MAX_BATCH_SIZE = 100_000;

/**
 * Generates unique, time-sortable 64-bit Snowflake identifiers.
 *
 * @public
 */
export class SnowflakeGenerator {
    private readonly machineIdShifted: bigint;
    private readonly epoch: number;
    private readonly clockMoveBackAction: 'throw' | 'wait';
    private sequence = 0n;
    private lastTimestamp = -1;

    private _totalIdsGenerated = 0n;
    private _lastGeneratedAt: number | null = null;
    private readonly _onClockDrift?: (driftMs: number) => void;
    private readonly _onSequenceOverflow?: () => void;

    private readonly _timestampShift: bigint;
    private readonly _machineIdShift: bigint;
    private readonly _maxSequence: bigint;
    private readonly _maxTimestamp: bigint;
    private readonly _maxSnowflakeId: bigint;
    private readonly _maxMachineId: number;
    private readonly _resolution: number;

    /**
     * Initializes a new Snowflake generator instance.
     *
     * @param config - The configuration object defining the machine ID, epoch, and layout.
     * @throws {Error} If the machine ID is negative, not an integer, or exceeds the maximum layout limit.
     * @throws {Error} If the epoch is in the future or not a valid number.
     */
    constructor(config: SnowflakeConfig) {
        const {
            machineId,
            epoch = DEFAULT_EPOCH,
            clockMoveBackAction = 'throw',
            onClockDrift,
            onSequenceOverflow,
            layout,
        } = config;

        this._onClockDrift = onClockDrift;
        this._onSequenceOverflow = onSequenceOverflow;

        if (layout) {
            this._timestampShift = layout.timestampShift;
            this._machineIdShift = layout.machineIdShift;
            this._maxSequence = layout.maxSequence;
            this._maxTimestamp = layout.maxTimestamp;
            this._maxSnowflakeId = layout.maxSnowflakeId;
            this._maxMachineId = layout.maxMachineId;
            this._resolution = layout.resolution;
        } else {
            this._timestampShift = TIMESTAMP_SHIFT;
            this._machineIdShift = MACHINE_ID_SHIFT;
            this._maxSequence = MAX_SEQUENCE;
            this._maxTimestamp = MAX_TIMESTAMP;
            this._maxSnowflakeId = MAX_SNOWFLAKE_ID;
            this._maxMachineId = MAX_MACHINE_ID;
            this._resolution = 1;
        }

        if (machineId < 0 || machineId > this._maxMachineId || !Number.isInteger(machineId)) {
            throw new Error(`machineId must be integer 0-${this._maxMachineId}, got ${machineId}`);
        }

        if (!Number.isInteger(epoch)) {
            throw new Error(`epoch must be a non-negative integer, got ${epoch}`);
        }

        if (epoch < 0 || epoch > Date.now()) {
            throw new Error(`epoch cannot be in the future`);
        }

        this.machineIdShifted = BigInt(machineId) << this._machineIdShift;
        this.epoch = epoch;
        this.clockMoveBackAction = clockMoveBackAction;
    }

    private _currentTimeUnit(): number {
        return this._resolution > 1
            ? Math.floor((Date.now() - this.epoch) / this._resolution)
            : Date.now();
    }

    /**
     * Generates the next unique Snowflake ID as a BigInt.
     *
     * @example
     * ```ts
     * const generator = new SnowflakeGenerator({ machineId: 1 });
     * const id = generator.nextId();
     * console.log(id); // 136941813297541120n
     * ```
     *
     * @returns A unique 64-bit integer representing the ID.
     * @throws {Error} If the clock moves backwards and the configured action is 'throw'.
     * @throws {Error} If the timestamp exceeds the theoretical maximum for the configured layout.
     */
    nextId(): bigint {
        let ts = this._currentTimeUnit();

        if (ts < this.lastTimestamp) {
            const drift = this.lastTimestamp - ts;
            const driftMs = this._resolution > 1 ? drift * this._resolution : drift;

            this._onClockDrift?.(driftMs);

            if (this.clockMoveBackAction === 'wait' && driftMs <= MAX_CLOCK_WAIT_MS) {
                while (ts <= this.lastTimestamp) {
                    ts = this._currentTimeUnit();
                }
            } else {
                throw new Error(`Clock moved backwards by ${driftMs}ms`);
            }
        }

        if (ts === this.lastTimestamp) {
            this.sequence = (this.sequence + 1n) & this._maxSequence;
            if (this.sequence === 0n) {
                this._onSequenceOverflow?.();
                while (ts <= this.lastTimestamp) {
                    ts = this._currentTimeUnit();
                }
            }
        } else {
            this.sequence = 0n;
        }

        this.lastTimestamp = ts;

        const elapsed = this._resolution > 1 ? BigInt(ts) : BigInt(ts - this.epoch);
        if (elapsed > this._maxTimestamp) {
            throw new Error(
                `Timestamp overflow: elapsed ${elapsed}ms exceeds 41-bit max (${this._maxTimestamp}). Epoch is too old.`,
            );
        }

        const id = (elapsed << this._timestampShift) | this.machineIdShifted | this.sequence;
        if (id < 0n || id > this._maxSnowflakeId) {
            throw new Error(`Generated ID ${id} exceeds safe 63-bit positive range`);
        }

        this._totalIdsGenerated += 1n;
        this._lastGeneratedAt = Date.now();

        return id;
    }

    /**
     * Generates the next unique Snowflake ID as a string.
     * This is the recommended method when interacting with JSON or databases that do not support 64-bit integers natively.
     *
     * @example
     * ```ts
     * const generator = new SnowflakeGenerator({ machineId: 1 });
     * const id = generator.nextIdString();
     * console.log(id); // "136941813297541120"
     * ```
     *
     * @returns A unique string representing the ID.
     */
    nextIdString(): string {
        return this.nextId().toString();
    }

    /**
     * Retrieves the machine identifier configured for this generator instance.
     *
     * @returns The integer machine ID.
     */
    getMachineId(): number {
        return Number(this.machineIdShifted >> this._machineIdShift);
    }

    /**
     * Retrieves the base epoch configured for this generator instance.
     *
     * @returns The epoch timestamp in milliseconds.
     */
    getEpoch(): number {
        return this.epoch;
    }

    /**
     * Retrieves the current sequence counter value.
     *
     * @returns The integer sequence value.
     */
    getSequence(): number {
        return Number(this.sequence);
    }

    /**
     * Retrieves the timestamp used during the last ID generation.
     *
     * @returns The timestamp value in the layout's resolution unit.
     */
    getLastTimestamp(): number {
        return this.lastTimestamp;
    }

    /**
     * Computes the current operational status and lifecycle metrics of the generator.
     *
     * @example
     * ```ts
     * const generator = new SnowflakeGenerator({ machineId: 1 });
     * const stats = generator.status();
     * console.log(stats.remainingYears); // 67.2
     * ```
     *
     * @returns A {@link GeneratorStatus} object detailing usage and limits.
     */
    status(): GeneratorStatus {
        const maxTimestampMs = Number(this._maxTimestamp) * this._resolution;
        const epochExpiresAt = new Date(this.epoch + maxTimestampMs);
        const remainingMs = this.epoch + maxTimestampMs - Date.now();
        const remainingYears = remainingMs / (365.25 * 24 * 60 * 60 * 1000);

        return {
            machineId: this.getMachineId(),
            epoch: this.epoch,
            epochExpiresAt,
            remainingYears: Math.max(0, remainingYears),
            totalIdsGenerated: this._totalIdsGenerated,
            lastGeneratedAt:
                this._lastGeneratedAt !== null ? new Date(this._lastGeneratedAt) : null,
            sequenceUtilization: Number(this.sequence) / Number(this._maxSequence + 1n),
        };
    }

    /**
     * Deconstructs a generated Snowflake ID into its respective components
     * using the specific layout and epoch of this generator.
     *
     * @param id - The Snowflake ID BigInt.
     * @returns A {@link SnowflakeParts} object detailing the time, machine, and sequence.
     */
    parseId(id: bigint): SnowflakeParts {
        const timestampRaw = Number(id >> this._timestampShift);
        const timestampMs =
            this._resolution > 1
                ? timestampRaw * this._resolution + this.epoch
                : timestampRaw + this.epoch;

        return {
            id,
            timestamp: new Date(timestampMs),
            timestampMs,
            machineId: Number((id >> this._machineIdShift) & BigInt(this._maxMachineId)),
            sequence: Number(id & this._maxSequence),
        };
    }

    /**
     * Generates a batch of unique Snowflake IDs simultaneously.
     *
     * @param count - The total number of IDs to generate.
     * @returns An array of BigInt IDs.
     * @throws {Error} If count is not a positive integer or exceeds 100,000.
     */
    nextBatch(count: number): bigint[] {
        if (!Number.isInteger(count) || count < 1) {
            throw new Error(`count must be a positive integer, got ${count}`);
        }
        if (count > MAX_BATCH_SIZE) {
            throw new Error(`count must not exceed ${MAX_BATCH_SIZE}, got ${count}`);
        }
        const ids = new Array<bigint>(count);
        for (let i = 0; i < count; i++) {
            ids[i] = this.nextId();
        }
        return ids;
    }

    /**
     * Generates a batch of unique Snowflake IDs simultaneously as strings.
     *
     * @param count - The total number of IDs to generate.
     * @returns An array of string IDs.
     * @throws {Error} If count is not a positive integer or exceeds 100,000.
     */
    nextBatchString(count: number): string[] {
        if (!Number.isInteger(count) || count < 1) {
            throw new Error(`count must be a positive integer, got ${count}`);
        }
        if (count > MAX_BATCH_SIZE) {
            throw new Error(`count must not exceed ${MAX_BATCH_SIZE}, got ${count}`);
        }
        const ids = new Array<string>(count);
        for (let i = 0; i < count; i++) {
            ids[i] = this.nextId().toString();
        }
        return ids;
    }
}

/**
 * Factory function to initialize a new Snowflake generator.
 * Identical to calling `new SnowflakeGenerator(config)`.
 *
 * @param config - The generator configuration object.
 * @returns A fresh {@link SnowflakeGenerator} instance.
 * @public
 */
export function createGenerator(config: SnowflakeConfig): SnowflakeGenerator {
    return new SnowflakeGenerator(config);
}

export {
    MAX_SEQUENCE,
    MACHINE_ID_SHIFT,
    TIMESTAMP_SHIFT,
    DEFAULT_EPOCH,
    MAX_MACHINE_ID,
    MAX_TIMESTAMP,
    MAX_SNOWFLAKE_ID,
    MAX_BATCH_SIZE,
};
