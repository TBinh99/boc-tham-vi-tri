// Kiểm tra thuật toán xếp vị trí trong lineup-core.js.
// Chạy: npm test   (thoát mã 0 = đạt)

const { computeLineup, pastByPlayer, mulberry32 } = require('../lineup-core.js');

let failures = 0;
function check(ok, msg) { if (!ok) { failures++; console.log('FAIL ' + msg); } }

const SEVEN = [
  { id: 'gk', role: 'GK' }, { id: 'cbl', role: 'DF' }, { id: 'cbr', role: 'DF' },
  { id: 'lm', role: 'MF' }, { id: 'cm', role: 'MF' }, { id: 'rm', role: 'MF' }, { id: 'st', role: 'FW' },
];
const ELEVEN = [
  { id: 'gk', role: 'GK' }, { id: 'lb', role: 'DF' }, { id: 'cbl', role: 'DF' }, { id: 'cbr', role: 'DF' }, { id: 'rb', role: 'DF' },
  { id: 'lm', role: 'MF' }, { id: 'cml', role: 'MF' }, { id: 'cmr', role: 'MF' }, { id: 'rm', role: 'MF' },
  { id: 'stl', role: 'FW' }, { id: 'str', role: 'FW' },
];
const team = (n, prefs = {}) => Array.from({ length: n }, (_, i) => ({ id: 'p' + (i + 1), pref: prefs['p' + (i + 1)] || 'any' }));
const roleOf = (slots, sid) => slots.find(s => s.id === sid).role;
const placed = res => Object.values(res.slots).flat();
const sharedPids = res => Object.values(res.slots).filter(a => a.length > 1).flat();

function toMatch(slots, res, f) {
  const picks = {};
  for (const sid in res.slots) for (const pid of res.slots[sid]) picks[pid] = res.slots[sid].length > 1 ? { s: sid, r: roleOf(slots, sid), sh: 1 } : { s: sid, r: roleOf(slots, sid) };
  return { f, picks };
}
function everyoneOnce(res, players, slots) {
  const all = placed(res).concat(res.waiting);
  const filled = Object.keys(res.slots).length;
  return all.length === players.length && new Set(all).size === all.length && res.waiting.length === 0 &&
    filled === Math.min(slots.length, players.length);
}

// 1. No history: 9 players, 7 positions -> every position filled, 2 positions have 2 people, goal has 1.
{
  const players = team(9);
  const res = computeLineup({ slots: SEVEN, players, fixed: {}, past: {}, formation: '7' });
  check(everyoneOnce(res, players, SEVEN), 'no history: everyone gets exactly one position');
  check(Object.values(res.slots).filter(a => a.length === 2).length === 2, 'no history: exactly 2 shared positions');
  check(res.slots.gk.length === 1, 'no history: goal is not shared');
}

// 2. Match after match: nobody repeats their last role; sharing rotates as much as numbers allow.
// Seeded so the run is reproducible; several seeds so one lucky run can't hide a problem.
for (const seed of [1, 7, 42, 2026, 99991])
for (const [label, slots, n] of [['sân 7', SEVEN, 9], ['sân 11', ELEVEN, 15]]) {
  const players = team(n);
  const history = [];
  const rand = mulberry32(seed);
  let shareRepeats = 0;
  for (let match = 0; match < 12; match++) {
    const past = pastByPlayer(history);
    const res = computeLineup({ slots, players, fixed: {}, past, formation: label, rand });
    check(everyoneOnce(res, players, slots), `${label} match ${match}: everyone placed once`);
    for (const sid in res.slots) for (const pid of res.slots[sid]) {
      const last = (past[pid] || [])[0];
      if (last) check(last.r !== roleOf(slots, sid), `${label} match ${match}: ${pid} repeated role ${last.r}`);
    }
    const lastSharers = new Set(history[0] ? Object.keys(history[0].picks).filter(p => history[0].picks[p].sh) : []);
    const nowSharers = sharedPids(res);
    const unavoidable = Math.max(0, nowSharers.length - (n - lastSharers.size));
    shareRepeats += Math.max(0, nowSharers.filter(p => lastSharers.has(p)).length - unavoidable);
    history.unshift(toMatch(slots, res, label));
  }
  check(shareRepeats <= 2, `${label} seed ${seed}: people shared a position twice in a row ${shareRepeats} times more than needed`);
}

// 3. Dedicated keeper always in goal, never rolled; two keepers share the goal; nobody else goes there.
{
  const players = team(9, { p3: 'gk' });
  for (let i = 0; i < 20; i++) {
    const res = computeLineup({ slots: SEVEN, players, fixed: {}, past: {}, formation: '7' });
    check(res.slots.gk.length === 1 && res.slots.gk[0] === 'p3', 'dedicated keeper p3 is the only one in goal');
  }
  const two = computeLineup({ slots: SEVEN, players: team(9, { p3: 'gk', p5: 'gk' }), fixed: {}, past: {}, formation: '7' });
  check(two.slots.gk.length === 2 && two.slots.gk.includes('p3') && two.slots.gk.includes('p5'), 'two dedicated keepers share the goal');
}

// 4. "Không bắt gôn" players never go in goal while someone else can.
{
  const prefs = {}; for (let i = 1; i <= 8; i++) prefs['p' + i] = 'nogk';
  for (let i = 0; i < 20; i++) {
    const res = computeLineup({ slots: SEVEN, players: team(9, prefs), fixed: {}, past: {}, formation: '7' });
    check(res.slots.gk[0] === 'p9', 'only p9 may keep goal');
  }
}

// 5. Scheduled draw: same seed -> identical lineup (every viewer sees the same result).
{
  const players = team(11, { p1: 'gk' });
  const a = computeLineup({ slots: SEVEN, players, fixed: {}, past: {}, formation: '7', rand: mulberry32(123456789) });
  const b = computeLineup({ slots: SEVEN, players, fixed: {}, past: {}, formation: '7', rand: mulberry32(123456789) });
  check(JSON.stringify(a) === JSON.stringify(b), 'same seed gives the same lineup');
}

// 6. Locked player stays put; short-handed still fills the goal first.
{
  const res = computeLineup({ slots: SEVEN, players: team(8), fixed: { cm: ['p4'] }, past: {}, formation: '7' });
  check(res.slots.cm.length === 1 && res.slots.cm[0] === 'p4', 'locked player keeps their position alone');
  const short = computeLineup({ slots: SEVEN, players: team(5), fixed: {}, past: {}, formation: '7' });
  check(short.slots.gk && short.slots.gk.length === 1, 'short-handed: goal is filled');
  check(placed(short).length === 5 && Object.keys(short.slots).length === 5, 'short-handed: 5 positions filled, none shared');
}

if (failures) { console.log(failures + ' check(s) failed'); process.exit(1); }
console.log('all lineup checks passed');
