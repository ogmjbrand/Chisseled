/**
 * Dependency-free equivalent of the `server-only` package: throws if a
 * server module is ever evaluated in a browser bundle.
 */
export function assertServer(moduleName: string): void {
  if (typeof window !== "undefined") {
    throw new Error(`${moduleName} must never be imported into client code.`);
  }
}
