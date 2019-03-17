import { IEvent } from "./IEvent";
import { KeybaseUser } from "./KeybaseUser";

export class GetKeybaseUserForDomainEvent extends IEvent {
    public static readonly TYPE = "GET_KEYBASE_USER_FOR_DOMAIN";

    constructor(public readonly domain: string) {
        super(GetKeybaseUserForDomainEvent.TYPE);
    }
}

export class GetKeybaseUserForDomainResponse {
    constructor(
        public readonly keybaseUsers: {[name: string]: KeybaseUser},
        public readonly trusted: string[],
        public readonly barred: string[],
        public readonly pending: string[],
    ) {}
}
