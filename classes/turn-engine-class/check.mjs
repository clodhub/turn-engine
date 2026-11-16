import { assert, load } from './runtime.mjs';
const m = await load('server/index.ts');
assert.equal(m.asErrorCode('unknownPlayer'), 'unknownPlayer');
assert.equal(m.asErrorCode('unrecognised'), 'notAllowed');
assert.equal(m.checkSettings({ decisionSeconds: 5, settleMs: 0 }).decisionSeconds, 5);
assert.equal(m.checkSettings({ settleMs: 0 }).settleMs, 0);
for (const input of [{ decisionSeconds: 0 }, { settleMs: -1 }, { staleMinutes: 0 }, { standingsSeconds: 0 }, { lobbyDropSeconds: 0 }]) assert.throws(() => m.checkSettings(input));
assert.deepEqual(m.noComputers.create(), {});
assert.deepEqual(m.noComputers.fill({ seats: [] }), { state: { seats: [] }, added: [] });
const parts = {
  seating: { create: () => [], validName: name => typeof name === 'string' && name.trim().length > 0,
    join: (seats, id, name) => seats.length === 2 ? { ok: false, code: 'roomFull' } : { ok: true, state: [...seats, { id, name, seat: seats.length, computer: false }] },
    find: (seats, id) => seats.find(row => row.id === id) },
  presence: { create: () => [], register: (state, id, at, kind) => [...state, { id, at, kind }], seen: state => state },
  clock: { create: at => ({ at, action: 0, level: 0 }) },
  tournament: { create: () => ({}) }, history: { create: () => [] },
  settings: { value: () => undefined }, rules: {}, views: {},
};
const engine = m.createEngine(parts);
const lobby = engine.create(100);
assert.equal(engine.validState(lobby), true);
assert.equal(engine.validState({ ...lobby, schema: 2 }), false);
assert.equal(engine.join(lobby, 'a', '', 200).code, 'badName');
const joined = engine.join(lobby, 'a', 'Ada', 200);
assert.equal(joined.ok, true);
assert.equal(joined.game.presence[0].at, 200);
assert.equal(joined.game.lastActionAt, 200);
assert.equal(lobby.seats.length, 0);
const two = engine.join(joined.game, 'b', 'Bob', 300).game;
assert.equal(engine.join(two, 'c', 'Cy', 400).code, 'roomFull');
assert.equal(engine.join({ ...two, status: 'running' }, 'c', 'Cy', 400).code, 'wrongPhase');
assert.equal(engine.seen(lobby, 'missing', 500), lobby);
