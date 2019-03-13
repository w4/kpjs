/* tslint:disable:no-namespace */
declare function XPCNativeWrapper<T>(obj: T): T;
declare namespace window {
    const wrappedJSObject: {
        fetch: (url: string) => Promise<any>;
    };
}

/**
 * Fetch that runs in the context of the webpage so relative urls can be
 * fetched.
 *
 * @param args args to pass to fetch
 */
export function fetch(...args: any[]) {
    const fetchWrapped = XPCNativeWrapper((window as any).wrappedJSObject.fetch) || fetch;

    // Promise.resolve so the thens don't run in the webpage context
    return Promise.resolve(fetchWrapped(...args));
}
