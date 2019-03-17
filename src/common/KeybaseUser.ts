export interface Proof {
    type: string,
    name: string,
    state: number, // TODO: make this enum
    url: string,
}

export interface KeybaseUser {
    name: string,
    avatar: string,
    proofs: {[name: string]: Proof}
}