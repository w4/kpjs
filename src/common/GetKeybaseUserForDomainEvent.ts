import { IEvent } from "./IEvent";

export class GetKeybaseUserForDomainEvent extends IEvent {
    public static readonly TYPE = "GET_KEYBASE_USER_FOR_DOMAIN";

    constructor(public readonly domain: string) {
        super(GetKeybaseUserForDomainEvent.TYPE);
    }
}

type KeybaseUser = string;

export class GetKeybaseUserForDomainResponse {
    constructor(
        public readonly keybaseUsers: KeybaseUser[],
        public readonly trusted: KeybaseUser[],
        public readonly barred: KeybaseUser[]
    ) {}
}
