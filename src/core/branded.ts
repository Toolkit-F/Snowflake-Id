import type {
    SnowflakeConfig,
    SnowflakeParts,
    BrandedSnowflake,
    BrandedSnowflakeString,
    GeneratorStatus,
} from '../types/type';
import { SnowflakeGenerator } from './generator';

/**
 * A strictly typed interface for a generator that produces domain-specific IDs.
 *
 * @typeParam Brand - The exact string literal type used to tag the generated IDs.
 * @public
 */
export interface BrandedGenerator<Brand extends string> {
    /** Generates a uniquely branded BigInt ID. */
    nextId(): BrandedSnowflake<Brand>;
    /** Generates a uniquely branded string ID. */
    nextIdString(): BrandedSnowflakeString<Brand>;
    /** Generates an array of branded BigInt IDs. */
    nextBatch(count: number): BrandedSnowflake<Brand>[];
    /** Generates an array of branded string IDs. */
    nextBatchString(count: number): BrandedSnowflakeString<Brand>[];
    /** Returns the underlying machine ID. */
    getMachineId(): number;
    /** Returns the underlying epoch. */
    getEpoch(): number;
    /** Returns the current sequence counter. */
    getSequence(): number;
    /** Returns the last generated timestamp. */
    getLastTimestamp(): number;
    /** Returns the operational status of the underlying generator. */
    status(): GeneratorStatus;
    /** Deconstructs a BigInt ID into its components using this generator's layout. */
    parseId(id: bigint): SnowflakeParts;
}

/**
 * Initializes a new Snowflake generator that produces strictly typed "branded" IDs.
 * This prevents developers from accidentally passing IDs between different domains.
 *
 * @example
 * ```ts
 * const userGen = createBrandedGenerator<'User'>({ machineId: 1 });
 * const orderGen = createBrandedGenerator<'Order'>({ machineId: 1 });
 *
 * const userId = userGen.nextId(); // Type: BrandedSnowflake<'User'>
 * const orderId = orderGen.nextId(); // Type: BrandedSnowflake<'Order'>
 *
 * function deleteUser(id: BrandedSnowflake<'User'>) {}
 * deleteUser(userId); // OK
 * deleteUser(orderId); // TypeScript Error!
 * ```
 *
 * @param config - The generator configuration object.
 * @returns A strictly typed {@link BrandedGenerator} instance.
 *
 * @public
 */
export function createBrandedGenerator<Brand extends string>(
    config: SnowflakeConfig,
): BrandedGenerator<Brand> {
    const generator = new SnowflakeGenerator(config);
    return {
        nextId: () => generator.nextId() as BrandedSnowflake<Brand>,
        nextIdString: () => generator.nextIdString() as BrandedSnowflakeString<Brand>,
        nextBatch: (count: number) => generator.nextBatch(count) as BrandedSnowflake<Brand>[],
        nextBatchString: (count: number) =>
            generator.nextBatchString(count) as BrandedSnowflakeString<Brand>[],
        getMachineId: () => generator.getMachineId(),
        getEpoch: () => generator.getEpoch(),
        getSequence: () => generator.getSequence(),
        getLastTimestamp: () => generator.getLastTimestamp(),
        status: () => generator.status(),
        parseId: (id: bigint) => generator.parseId(id),
    };
}
