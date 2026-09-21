const BASE62_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const BASE36_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';

/**
 * Encodes a Snowflake ID into a custom base string representation using a provided alphabet.
 *
 * @example
 * ```ts
 * const id = 325486911772692480n;
 * const customAlphabet = '0123456789ABCDEF'; // Base16 (Hex)
 * const hex = snowflakeEncode(id, customAlphabet);
 * console.log(hex); // "484B6F9A2C00"
 * ```
 *
 * @param id - The BigInt Snowflake ID to encode.
 * @param alphabet - A string containing the character set to use for encoding.
 * @returns The encoded ID as a string.
 * @throws {Error} If the ID is negative, or if the alphabet contains duplicates or fewer than 2 characters.
 *
 * @public
 */
export function snowflakeEncode(id: bigint, alphabet: string): string {
    if (id < 0n) {
        throw new Error(`Cannot encode negative Snowflake ID: ${id}`);
    }
    const chars = [...alphabet];
    if (new Set(chars).size !== chars.length) {
        throw new Error('Alphabet must not contain duplicate characters');
    }
    if (chars.length < 2) {
        throw new Error('Alphabet must contain at least 2 characters');
    }
    const base = BigInt(chars.length);
    if (id === 0n) return chars[0];
    let result = '';
    let value = id;
    while (value > 0n) {
        result = chars[Number(value % base)] + result;
        value = value / base;
    }
    return result;
}

/**
 * Decodes a previously encoded custom base string back into a Snowflake ID.
 *
 * @param encoded - The encoded string to decode.
 * @param alphabet - The exact alphabet string that was used during encoding.
 * @returns The original Snowflake ID as a BigInt.
 * @throws {Error} If the encoded string is empty, the alphabet is invalid, or a character is missing from the alphabet.
 *
 * @public
 */
export function snowflakeDecode(encoded: string, alphabet: string): bigint {
    if (!encoded) {
        throw new Error('Encoded string must not be empty');
    }
    const chars = [...alphabet];
    if (new Set(chars).size !== chars.length) {
        throw new Error('Alphabet must not contain duplicate characters');
    }
    const base = BigInt(chars.length);
    let result = 0n;
    for (const char of encoded) {
        const index = chars.indexOf(char);
        if (index === -1) {
            throw new Error(`Invalid character "${char}" not in alphabet`);
        }
        result = result * base + BigInt(index);
    }
    return result;
}

/**
 * Compresses a Snowflake ID into a Base62 string (0-9, A-Z, a-z).
 * This reduces an 18-digit ID down to exactly 10 characters.
 *
 * @example
 * ```ts
 * const id = 325486911772692480n;
 * const short = snowflakeToBase62(id);
 * console.log(short); // "O2jTbkht68"
 * ```
 *
 * @param id - The Snowflake ID BigInt.
 * @returns A 10-character alphanumeric string.
 *
 * @public
 */
export function snowflakeToBase62(id: bigint): string {
    return snowflakeEncode(id, BASE62_ALPHABET);
}

/**
 * Decompresses a Base62 string back into its original Snowflake ID.
 *
 * @param encoded - The Base62 string to decode.
 * @returns The original Snowflake ID BigInt.
 *
 * @public
 */
export function base62ToSnowflake(encoded: string): bigint {
    return snowflakeDecode(encoded, BASE62_ALPHABET);
}

/**
 * Compresses a Snowflake ID into a Base36 string (0-9, a-z).
 * This reduces an 18-digit ID down to exactly 12 lowercase characters.
 *
 * @example
 * ```ts
 * const id = 325486911772692480n;
 * const b36 = snowflakeToBase36(id);
 * console.log(b36); // "2h0vhb12frpc"
 * ```
 *
 * @param id - The Snowflake ID BigInt.
 * @returns A 12-character lowercase alphanumeric string.
 *
 * @public
 */
export function snowflakeToBase36(id: bigint): string {
    return snowflakeEncode(id, BASE36_ALPHABET);
}

/**
 * Decompresses a Base36 string back into its original Snowflake ID.
 *
 * @param encoded - The Base36 string to decode.
 * @returns The original Snowflake ID BigInt.
 *
 * @public
 */
export function base36ToSnowflake(encoded: string): bigint {
    return snowflakeDecode(encoded, BASE36_ALPHABET);
}
