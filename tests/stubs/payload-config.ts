// Stub for `@payload-config` under Vitest. The real config pulls in the
// Postgres adapter, sharp, and the rest of the Payload runtime — which would
// load fine but is unnecessary weight for unit tests that never invoke
// `getPayload({ config })`. Tests that need a Payload instance inject one.
export default {};
