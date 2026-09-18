import assert from "node:assert/strict";
import { test } from "node:test";
import { sessionStore } from "../src/services/sessionStore";

test("pass lookup and publishing handle API responses correctly", async () => {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) },
  });
  const originalFetch = globalThis.fetch;
  const session = { accessCode: "RP-ABC234", title: "Session", isExpired: false, published: true, expiresAt: "2099-01-01", sections: [], qaList: [] };
  try {
    globalThis.fetch = async (url) => {
      assert.equal(url, "/api/sessions/RP-ABC234");
      return Response.json(session);
    };
    assert.deepEqual(await sessionStore.getSessionByCode(" abc234 "), session);
    assert.deepEqual(await sessionStore.getSessionByCode(" rp-abc234 "), session);

    values.set("recallpass_sessions_v1", JSON.stringify([session]));
    globalThis.fetch = async () => Response.json({ error: "Pass not found" }, { status: 404 });
    await assert.rejects(sessionStore.getSessionByCode("ABC234"), /Pass not found/);

    globalThis.fetch = async () => new Response("<html>App</html>");
    assert.equal((await sessionStore.getSessionByCode("ABC234")).accessCode, session.accessCode);
    await assert.rejects(sessionStore.getSessionByCode("ZZZZZZ"), /service is unavailable/);
    await assert.rejects(sessionStore.createSession({ title: "Test", sections: [], qaList: [] }), /Unable to publish/);

    globalThis.fetch = async () => Response.json({ text: "not a session" });
    await assert.rejects(sessionStore.createSession({ title: "Test", sections: [], qaList: [] }), /valid pass ID/);

    globalThis.fetch = async () => Response.json(session, { status: 201 });
    assert.deepEqual(await sessionStore.createSession({ title: "Test", sections: [], qaList: [] }), session);
  } finally {
    globalThis.fetch = originalFetch;
    Reflect.deleteProperty(globalThis, "localStorage");
  }
});
