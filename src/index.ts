export {
    SnowflakeGenerator,
    createGenerator,
    MAX_SEQUENCE,
    MACHINE_ID_SHIFT,
    TIMESTAMP_SHIFT,
    DEFAULT_EPOCH,
    MAX_MACHINE_ID,
    MAX_TIMESTAMP,
    MAX_SNOWFLAKE_ID,
    MAX_BATCH_SIZE,
} from './core/generator';

export type {
    SnowflakeConfig,
    SnowflakeParts,
    SnowflakePartsJSON,
    GeneratorStatus,
    SnowflakeLayout,
    LayoutConfig,
    SnowflakeRange,
    BrandedSnowflake,
    BrandedSnowflakeString,
} from './types/type';

export {
    parseSnowflake,
    stringifySnowflakeParts,
    getTimestamp,
    getMachineId,
    getSequence,
    isValidSnowflake,
    snowflakeToString,
    stringToSnowflake,
    compareSnowflakes,
    snowflakeFromTimestamp,
} from './utils';

export {
    snowflakeToBase62,
    base62ToSnowflake,
    snowflakeToBase36,
    base36ToSnowflake,
    snowflakeEncode,
    snowflakeDecode,
} from './utils/encoding';

export {
    resolveFromHostname,
    resolveFromEnv,
    resolveFromNetworkInterface,
    resolveFromProcessId,
} from './utils/resolvers';

export { createBrandedGenerator } from './core/branded';
export type { BrandedGenerator } from './core/branded';

export { snowflakeRange, createCursor, parseCursor, shardKey } from './utils/pagination';

export { defineLayout } from './core/layout';
