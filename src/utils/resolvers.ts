import os from 'node:os';
import { MAX_MACHINE_ID } from '../core/generator';

/**
 * Ensures a derived machine ID is a valid non-negative integer and clamps it
 * to fit within the allowed maximum machine ID range.
 *
 * @param value - The raw numeric value to clamp.
 * @returns An integer strictly within the 0 to MAX_MACHINE_ID bounds.
 * @throws {Error} If the input is negative or not an integer.
 * @internal
 */
function clampMachineId(value: number): number {
    if (!Number.isInteger(value) || value < 0) {
        throw new Error(`Resolved machineId must be a non-negative integer, got ${value}`);
    }
    return value % (MAX_MACHINE_ID + 1);
}

/**
 * Automatically derives a machine ID by extracting the trailing number from the operating system's hostname.
 * Very useful for StatefulSets in Kubernetes (e.g., extracting `3` from `web-pod-3`).
 *
 * @example
 * ```ts
 * // If os.hostname() returns "api-worker-5"
 * const machineId = resolveFromHostname();
 * console.log(machineId); // 5
 * ```
 *
 * @returns The extracted integer, or `0` if the hostname contains no trailing numbers.
 *
 * @public
 */
export function resolveFromHostname(): number {
    const hostname = os.hostname();
    const match = hostname.match(/(\d+)$/);
    if (!match) return 0;
    return clampMachineId(parseInt(match[1], 10));
}

/**
 * Automatically derives a machine ID by reading an environment variable.
 *
 * @example
 * ```ts
 * // Assuming process.env.WORKER_ID = "42"
 * const machineId = resolveFromEnv('WORKER_ID', { fallback: 0 });
 * console.log(machineId); // 42
 * ```
 *
 * @param envVar - The exact name of the environment variable to read (e.g., 'MACHINE_ID').
 * @param options - Configuration options, including an optional fallback if the variable is missing.
 * @returns The parsed integer from the environment variable.
 * @throws {Error} If the variable is unset or invalid and no fallback is provided.
 *
 * @public
 */
export function resolveFromEnv(envVar: string, options?: { fallback?: number }): number {
    const value = process.env[envVar];
    if (value === undefined || value === '') {
        if (options?.fallback !== undefined) {
            return clampMachineId(options.fallback);
        }
        throw new Error(`Environment variable "${envVar}" is not set and no fallback provided`);
    }
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || !Number.isInteger(parsed)) {
        if (options?.fallback !== undefined) {
            return clampMachineId(options.fallback);
        }
        throw new Error(`Environment variable "${envVar}" is not a valid integer: "${value}"`);
    }
    return clampMachineId(parsed);
}

/**
 * Automatically derives a machine ID by inspecting the server's network interfaces.
 * It targets the first active, non-internal IPv4 address and computes a number using its last two octets.
 *
 * @example
 * ```ts
 * // If the server's IP is 192.168.1.100
 * const machineId = resolveFromNetworkInterface();
 * console.log(machineId); // (1 * 256 + 100) % 1024 = 356
 * ```
 *
 * @returns The computed integer based on the IP address, or `0` if no suitable network interface is found.
 *
 * @public
 */
export function resolveFromNetworkInterface(): number {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        const addrs = interfaces[name];
        if (!addrs) continue;
        for (const addr of addrs) {
            if (addr.family === 'IPv4' && !addr.internal) {
                const octets = addr.address.split('.').map(Number);
                return (octets[2] * 256 + octets[3]) % (MAX_MACHINE_ID + 1);
            }
        }
    }
    return 0;
}

/**
 * Automatically derives a machine ID using the current Node.js process ID (PID).
 *
 * @example
 * ```ts
 * // If process.pid is 12345
 * const machineId = resolveFromProcessId();
 * console.log(machineId); // 12345 % 1024 = 57
 * ```
 *
 * @returns The integer result of `process.pid % 1024`.
 *
 * @public
 */
export function resolveFromProcessId(): number {
    return process.pid % (MAX_MACHINE_ID + 1);
}
