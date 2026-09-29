/* Bốc Thăm Vị Trí — thuật toán xếp vị trí.
   Dùng chung cho trang (window.LineupCore) và cho test chạy bằng Node (module.exports). */
(function (root) {
'use strict';

// Weight of a player's k-th most recent appearance (0 = last match they played).
var W_APPEAR = [100, 30, 10, 4, 1.5];

// Min-cost perfect assignment on a square matrix (Kuhn–Munkres). Returns col index per row.
function hungarian(a){
  var n = a.length, m = n, INF = 1e18;
  var u = new Array(n + 1).fill(0), v = new Array(m + 1).fill(0);
  var p = new Array(m + 1).fill(0), way = new Array(m + 1).fill(0);
  for (var i = 1; i <= n; i++){
    p[0] = i; var j0 = 0;
    var minv = new Array(m + 1).fill(INF), used = new Array(m + 1).fill(false);
    do {
      used[j0] = true; var i0 = p[j0], delta = INF, j1 = 0;
      for (var j = 1; j <= m; j++) if (!used[j]){
        var cur = a[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]){ minv[j] = cur; way[j] = j0; }
        if (minv[j] < delta){ delta = minv[j]; j1 = j; }
      }
      for (var k = 0; k <= m; k++){
        if (used[k]){ u[p[k]] += delta; v[k] -= delta; } else minv[k] -= delta;
      }
      j0 = j1;
    } while (p[j0] !== 0);
    do { var jj = way[j0]; p[j0] = p[jj]; j0 = jj; } while (j0);
  }
  var ans = new Array(n);
  for (var c = 1; c <= m; c++) if (p[c]) ans[p[c] - 1] = c - 1;
  return ans;
}

// Seeded PRNG so a scheduled draw gives the same result in every browser.
function mulberry32(seed){
  var a = seed >>> 0;
  return function(){
    a = (a + 0x6D2B79F5) >>> 0;
    var t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// How much we'd rather NOT put a player in this slot, given their recent appearances.
function positionCost(apps, slot, shared, formation){
  var c = 0;
  for (var k = 0; k < Math.min(apps.length, W_APPEAR.length); k++){
    var a = apps[k], w = W_APPEAR[k];
    if (shared && (a.sh || a.b)) c += w * 0.5;
    if (a.b) continue;
    if (a.r === slot.role) c += w * (a.r === 'GK' ? 1.5 : 1);
    if (a.s === slot.id && a.f === formation) c += w * 0.3;
  }
  return c;
}

// history is newest-first; returns {pid: [appearance, ...]} newest-first per player.
function pastByPlayer(history){
  var out = {};
  history.forEach(function(m){
    Object.keys(m.picks || {}).forEach(function(pid){
      var pk = m.picks[pid];
      (out[pid] = out[pid] || []).push({ f: m.f, s: pk.s, r: pk.r, b: pk.b ? 1 : 0, sh: pk.sh ? 1 : 0 });
    });
  });
  return out;
}

// Which slots take one extra player when there are more players than slots. Spreads extras across lines.
function pickExtras(pool, r, rand){
  var out = {}, used = {}, size = {};
  pool.forEach(function(s){ size[s.role] = (size[s.role] || 0) + 1; });
  var cands = pool.filter(function(s){ return s.role !== 'GK'; });
  if (cands.length < r) cands = pool.slice();
  for (var i = 0; i < r; i++){
    var best = null, bestScore = Infinity;
    cands.forEach(function(s){
      if (out[s.id]) return;
      var sc = (used[s.role] || 0) / size[s.role] + rand() * 0.5;
      if (sc < bestScore){ bestScore = sc; best = s; }
    });
    if (!best) break;
    out[best.id] = 1; used[best.role] = (used[best.role] || 0) + 1;
  }
  return out;
}

// opts: {slots:[{id,role}], players:[{id,pref}], fixed:{slotId:[pid]}, past, formation, rand}
// pref: 'any' | 'gk' (dedicated keeper, never rolled) | 'nogk' (never put in goal)
// Returns {slots:{slotId:[pid,...]}, waiting:[pid]}. A slot holds 2+ players when there are more players than slots.
function computeLineup(opts){
  var rand = opts.rand || Math.random, past = opts.past || {}, fixed = opts.fixed || {};
  var out = {}, used = {};
  Object.keys(fixed).forEach(function(sid){ out[sid] = fixed[sid].slice(); fixed[sid].forEach(function(p){ used[p] = 1; }); });
  var cands = opts.players.filter(function(p){ return !used[p.id]; });
  var gk = opts.slots.filter(function(s){ return s.role === 'GK'; })[0];
  var keepers = cands.filter(function(p){ return p.pref === 'gk'; });
  if (gk && keepers.length){
    out[gk.id] = (out[gk.id] || []).concat(keepers.map(function(p){ return p.id; }));
    cands = cands.filter(function(p){ return p.pref !== 'gk'; });
  }
  var pool = opts.slots.filter(function(s){ return !out[s.id]; });
  var n = cands.length, m = pool.length;
  if (!n) return { slots: out, waiting: [] };
  if (!m) return { slots: out, waiting: cands.map(function(p){ return p.id; }) };
  var EMPTY_COST = { GK: 500, DF: 2, MF: 1, FW: 0 };
  // One try = pick which positions take 2 people, then the best assignment for that pick.
  function attempt(extra){
    var cols = [];
    if (n <= m) pool.forEach(function(s){ cols.push({ slot: s, shared: false }); });
    else {
      var q = Math.floor(n / m);
      pool.forEach(function(s){
        var cap = q + (extra[s.id] ? 1 : 0);
        for (var i = 0; i < cap; i++) cols.push({ slot: s, shared: cap > 1 });
      });
    }
    var rows = cands.slice();
    while (rows.length < cols.length) rows.push(null);
    var M = rows.map(function(p){
      return cols.map(function(c){
        if (!p) return EMPTY_COST[c.slot.role] || 0;
        return positionCost(past[p.id] || [], c.slot, c.shared, opts.formation) +
          (c.slot.role === 'GK' && p.pref === 'nogk' ? 1000 : 0) + rand() * 3;
      });
    });
    var ans = hungarian(M), total = 0;
    rows.forEach(function(p, i){ total += M[i][ans[i]]; });
    return { rows: rows, cols: cols, ans: ans, total: total };
  }
  var best = null, tries = n > m ? 16 : 1;
  for (var t = 0; t < tries; t++){
    var a = attempt(n > m ? pickExtras(pool, n - Math.floor(n / m) * m, rand) : {});
    if (!best || a.total < best.total) best = a;
  }
  best.rows.forEach(function(p, i){
    if (!p) return;
    var c = best.cols[best.ans[i]];
    (out[c.slot.id] = out[c.slot.id] || []).push(p.id);
  });
  return { slots: out, waiting: [] };
}

// Switch formation without a new draw: each occupied position (with whoever is on it, pairs stay
// together) moves to the closest spot in the new formation, staying in its line when it can.
// Distances are in pitch metres (x spans 58 m, y spans 100 m); changing line costs 12 m; the keeper never moves.
// Returns {slots:{slotId:[pid]}, waiting:[pid]} — waiting only when the new formation has fewer spots.
function remapLineup(fromSlots, toSlots, assigned){
  var units = fromSlots.filter(function(s){ return (assigned[s.id] || []).length; });
  var n = Math.max(units.length, toSlots.length), M = [];
  for (var i = 0; i < n; i++){
    var row = [];
    for (var j = 0; j < n; j++){
      var u = units[i], t = toSlots[j];
      if (!u || !t){ row.push(0); continue; }
      var dx = (u.x - t.x) * 29, dy = (u.y - t.y) * 100, c = Math.sqrt(dx * dx + dy * dy);
      if (u.role !== t.role) c += (u.role === 'GK' || t.role === 'GK') ? 1000 : 12;
      row.push(c);
    }
    M.push(row);
  }
  var ans = hungarian(M), out = {}, waiting = [];
  units.forEach(function(u, i){
    var t = toSlots[ans[i]];
    if (t) out[t.id] = assigned[u.id].slice(); else waiting = waiting.concat(assigned[u.id]);
  });
  return { slots: out, waiting: waiting };
}

var api = { W_APPEAR: W_APPEAR, remapLineup: remapLineup, hungarian: hungarian, mulberry32: mulberry32, positionCost: positionCost, pastByPlayer: pastByPlayer, pickExtras: pickExtras, computeLineup: computeLineup };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
else root.LineupCore = api;
})(this);
