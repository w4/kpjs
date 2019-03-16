import { IEvent } from "./IEvent";

export class GetUsersAwaitingConsentEvent extends IEvent {
    public static readonly TYPE = "GET_USERS_AWAITING_CONSENT_EVENT";

    constructor(public readonly domain: string) {
        super(GetUsersAwaitingConsentEvent.TYPE);
    }
}

type KeybaseUser = string;

export class GetUsersAwaitingConsentResponse {
    constructor(
        public readonly keybaseUsers: KeybaseUser[]
    ) {}
}

export class AllowUserEvent extends IEvent {
    public static readonly TYPE = "ALLOW_USER_EVENT";

    constructor(public readonly domain: string, public readonly user: KeybaseUser) {
        super(AllowUserEvent.TYPE);
    }
}

export class DeniedUserEvent extends IEvent {
    public static readonly TYPE = "DENIED_USER_EVENT";

    constructor(public readonly domain: string, public readonly user: KeybaseUser) {
        super(DeniedUserEvent.TYPE);
    }
}