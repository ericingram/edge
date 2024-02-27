declare module '@japa/assert' {
    interface Assert {
        stringEqual(actual: string, expected: string, message?: string): void;
    }
}
export {};
