export abstract class IEvent {
    public static readonly TYPE: string;

    constructor(public readonly TYPE: string) {}
}
