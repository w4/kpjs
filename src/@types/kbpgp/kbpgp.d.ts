declare module 'kbpgp' {
    export function unbox(args: any): any;

    export class KeyManager {
        key: any;

        static import_from_armored_pgp(v: {armored: string}): KeyManager;
        export_pgp_keys_to_keyring(): any;
        fetch(ids: any[], ops: any, cb: (err: Error | null, km?: any, keyId?: number) => void): any;
    }

    export class Buffer {
        constructor(content: any);

        toString(encoding: string): string;
    }

    export class KeyFetcher {
        fetch(ids: any, ops: any, cb: (err: Error | null, km?: any, keyId?: number) => void): void;
    }
}
