export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  // TODO: 실제로는 DB 적재(사용자ID, IP, UA, 어떤 레코드/필드인지 등)
  console.log("[AUDIT]", {
    ...body,
    ip: getRequestIP(event),
    ua: getHeader(event, "user-agent"),
  });

  return { ok: true };
});
