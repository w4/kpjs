export interface Proof {
    type: string,
    name: string,
    state: number, // TODO: make this enum
    url: string,
    tag: string,
}

export interface KeybaseUser {
    name: string,
    avatar: string,
    realName: string,
    location: string,
    proofs: {[name: string]: Proof[]}
}