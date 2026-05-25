// Minimal stubs for Cloudflare Worker global types used in the Env interface.
// These are replaced by @cloudflare/workers-types in the worker-api app.
/* eslint-disable @typescript-eslint/no-explicit-any */

declare global {
  interface D1Database {
    prepare(query: string): D1PreparedStatement
    exec(query: string): Promise<D1ExecResult>
    batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>
    dump(): Promise<ArrayBuffer>
  }
  interface D1PreparedStatement {
    bind(...values: unknown[]): D1PreparedStatement
    first<T = unknown>(colName?: string): Promise<T | null>
    run<T = unknown>(): Promise<D1Result<T>>
    all<T = unknown>(): Promise<D1Result<T>>
    raw<T = unknown>(): Promise<T[]>
  }
  interface D1Result<T = unknown> {
    results: T[]
    success: boolean
    meta: Record<string, unknown>
  }
  interface D1ExecResult {
    count: number
    duration: number
  }
  interface R2Bucket {
    get(key: string): Promise<R2ObjectBody | null>
    put(key: string, value: ReadableStream | ArrayBuffer | string | null, options?: Record<string, unknown>): Promise<R2Object>
    delete(key: string | string[]): Promise<void>
    list(options?: Record<string, unknown>): Promise<R2Objects>
    head(key: string): Promise<R2Object | null>
  }
  interface R2Object {
    key: string
    size: number
    etag: string
    httpMetadata?: Record<string, string>
    customMetadata?: Record<string, string>
  }
  interface R2ObjectBody extends R2Object {
    body: ReadableStream
    arrayBuffer(): Promise<ArrayBuffer>
    text(): Promise<string>
    json<T>(): Promise<T>
  }
  interface R2Objects {
    objects: R2Object[]
    truncated: boolean
    cursor?: string
    delimitedPrefixes: string[]
  }
  interface Queue<Body = unknown> {
    send(message: Body, options?: Record<string, unknown>): Promise<void>
    sendBatch(messages: { body: Body }[], options?: Record<string, unknown>): Promise<void>
  }
}

export {}
