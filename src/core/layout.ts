import type { LayoutConfig, SnowflakeLayout } from '../types/type';

/**
 * Internal implementation of the SnowflakeLayout interface.
 * Pre-calculates bit shifts and maximum capacities during initialization to avoid doing math on every ID generation.
 *
 * @internal
 */
class SnowflakeLayoutImpl implements SnowflakeLayout {
    readonly timestampBits: number;
    readonly machineBits: number;
    readonly sequenceBits: number;
    readonly resolution: number;
    readonly timestampShift: bigint;
    readonly machineIdShift: bigint;
    readonly maxTimestamp: bigint;
    readonly maxMachineId: number;
    readonly maxSequence: bigint;
    readonly maxSnowflakeId: bigint;
    readonly lifespanYears: number;
    readonly idsPerMs: number;

    constructor(config: LayoutConfig) {
        this.timestampBits = config.timestamp.bits;
        this.machineBits = config.machine.bits;
        this.sequenceBits = config.sequence.bits;
        this.resolution = config.timestamp.resolution ?? 1;

        const totalBits = this.timestampBits + this.machineBits + this.sequenceBits;
        if (totalBits !== 63) {
            throw new Error(
                `Bit widths must sum to 63 (sign bit excluded), got ${totalBits} ` +
                    `(${this.timestampBits} + ${this.machineBits} + ${this.sequenceBits})`,
            );
        }

        for (const [name, bits] of Object.entries({
            timestamp: this.timestampBits,
            machine: this.machineBits,
            sequence: this.sequenceBits,
        })) {
            if (!Number.isInteger(bits) || bits < 1) {
                throw new Error(`${name} bits must be a positive integer, got ${bits}`);
            }
        }

        if (!Number.isInteger(this.resolution) || this.resolution < 1) {
            throw new Error(`resolution must be a positive integer, got ${this.resolution}`);
        }

        this.machineIdShift = BigInt(this.sequenceBits);
        this.timestampShift = BigInt(this.machineBits + this.sequenceBits);
        this.maxSequence = (1n << BigInt(this.sequenceBits)) - 1n;
        this.maxMachineId = Number((1n << BigInt(this.machineBits)) - 1n);
        this.maxTimestamp = (1n << BigInt(this.timestampBits)) - 1n;
        this.maxSnowflakeId = (1n << 63n) - 1n;

        const lifespanMs = Number(this.maxTimestamp) * this.resolution;
        this.lifespanYears = lifespanMs / (365.25 * 24 * 60 * 60 * 1000);
        this.idsPerMs = Number(this.maxSequence + 1n) / this.resolution;
    }
}

/**
 * Defines a custom bit layout for a Snowflake generator.
 * A standard Snowflake ID consists of 64 bits (1 sign bit + 63 usable bits).
 * This function allows you to redistribute the 63 usable bits among the timestamp, machine ID, and sequence fields.
 *
 * @example
 * ```ts
 * // Defining a Sonyflake-style layout (39 bits for time, 16 for machine, 8 for sequence)
 * const sonyflake = defineLayout({
 *   timestamp: { bits: 39, resolution: 10 }, // 10ms resolution
 *   machine: { bits: 16 }, // Up to 65,535 machines
 *   sequence: { bits: 8 }, // Up to 256 IDs per 10ms tick
 * });
 *
 * const generator = new SnowflakeGenerator({ machineId: 1, layout: sonyflake });
 * ```
 *
 * @param config - An object detailing exactly how many bits to allocate to each segment.
 * @returns A frozen {@link SnowflakeLayout} object containing pre-calculated offsets and limits.
 * @throws {Error} If the combined bits do not equal exactly 63.
 * @throws {Error} If any bit allocation is less than 1 or not an integer.
 *
 * @public
 */
export function defineLayout(config: LayoutConfig): SnowflakeLayout {
    return new SnowflakeLayoutImpl(config);
}
