declare module "kbpgp" {
    export function unbox(args: any): any;

    export class KeyManager {
        public static import_from_armored_pgp(v: { armored: string }): KeyManager;
        public key: any;
        public export_pgp_keys_to_keyring(): any;
        public fetch(ids: any[], ops: any, cb: (err: Error | null, km?: any, keyId?: number) => void): any;
    }

    export class Buffer {
        constructor(content: any);

        public toString(encoding: string): string;
    }

    export class KeyFetcher {
        public fetch(ids: any, ops: any, cb: (err: Error | null, km?: any, keyId?: number) => void): void;
    }
}
