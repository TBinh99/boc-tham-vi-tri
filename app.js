/* Bốc Thăm Vị Trí — giao diện. Thuật toán xếp vị trí nằm ở lineup-core.js. */
(function () {
'use strict';

var Core = window.LineupCore;
var computeLineup = Core.computeLineup, pastByPlayer = Core.pastByPlayer, mulberry32 = Core.mulberry32, remapLineup = Core.remapLineup;

// ---------- formations ----------
var FORMATS = [
  { id: '5', label: 'Sân 5', scale: 0.95 },
  { id: '7', label: 'Sân 7', scale: 0.88 },
  { id: '11', label: 'Sân 11', scale: 0.74 }
];
function S(id, code, name, role, x, y){ return { id: id, code: code, name: name, role: role, x: x, y: y }; }
var GK = S('gk', 'GK', 'Thủ môn', 'GK', 0, .035);
var LB = S('lb', 'LB', 'Hậu vệ trái', 'DF', -.8, .25), RB = S('rb', 'RB', 'Hậu vệ phải', 'DF', .8, .25);
var CBL = S('cbl', 'CB', 'Trung vệ trái', 'DF', -.28, .21), CBR = S('cbr', 'CB', 'Trung vệ phải', 'DF', .28, .21);
var FORMATIONS = {
  '5-122':  { fmt: '5', name: '2-2', slots: [GK, S('cbl','CB','Hậu vệ trái','DF',-.42,.24), S('cbr','CB','Hậu vệ phải','DF',.42,.24), S('stl','ST','Tiền đạo trái','FW',-.42,.5), S('str','ST','Tiền đạo phải','FW',.42,.5)] },
  '5-1121': { fmt: '5', name: '1-2-1', slots: [GK, S('cb','CB','Trung vệ','DF',0,.28), S('lw','LW','Cánh trái','MF',-.62,.42), S('rw','RW','Cánh phải','MF',.62,.42), S('st','ST','Tiền đạo','FW',0,.58)] },
  '7-1231': { fmt: '7', name: '2-3-1', slots: [GK, S('cbl','CB','Trung vệ trái','DF',-.36,.225), S('cbr','CB','Trung vệ phải','DF',.36,.225), S('lm','LM','Tiền vệ trái','MF',-.78,.4), S('cm','CM','Tiền vệ trung tâm','MF',0,.38), S('rm','RM','Tiền vệ phải','MF',.78,.4), S('st','ST','Tiền đạo','FW',0,.65)] },
  '7-1321': { fmt: '7', name: '3-2-1', slots: [GK, S('lb','LB','Hậu vệ trái','DF',-.66,.27), S('cb','CB','Trung vệ','DF',0,.25), S('rb','RB','Hậu vệ phải','DF',.66,.27), S('cml','CM','Tiền vệ trung tâm trái','MF',-.34,.42), S('cmr','CM','Tiền vệ trung tâm phải','MF',.34,.42), S('st','ST','Tiền đạo','FW',0,.62)] },
  '7-1312': { fmt: '7', name: '3-1-2', slots: [GK, S('lb','LB','Hậu vệ trái','DF',-.66,.27), S('cb','CB','Trung vệ','DF',0,.25), S('rb','RB','Hậu vệ phải','DF',.66,.27), S('cm','CM','Tiền vệ trung tâm','MF',0,.48), S('stl','ST','Tiền đạo trái','FW',-.38,.66), S('str','ST','Tiền đạo phải','FW',.38,.66)] },
  '11-442': { fmt: '11', name: '4-4-2', slots: [GK, LB, CBL, CBR, RB, S('lm','LM','Tiền vệ trái','MF',-.8,.46), S('cml','CM','Tiền vệ trung tâm trái','MF',-.27,.43), S('cmr','CM','Tiền vệ trung tâm phải','MF',.27,.43), S('rm','RM','Tiền vệ phải','MF',.8,.46), S('stl','ST','Tiền đạo trái','FW',-.25,.67), S('str','ST','Tiền đạo phải','FW',.25,.67)] },
  '11-433': { fmt: '11', name: '4-3-3', slots: [GK, LB, CBL, CBR, RB, S('cml','CM','Tiền vệ trung tâm trái','MF',-.46,.45), S('dm','DM','Tiền vệ phòng ngự','MF',0,.38), S('cmr','CM','Tiền vệ trung tâm phải','MF',.46,.45), S('lw','LW','Tiền đạo cánh trái','FW',-.72,.66), S('st','ST','Tiền đạo cắm','FW',0,.7), S('rw','RW','Tiền đạo cánh phải','FW',.72,.66)] },
  '11-4231': { fmt: '11', name: '4-2-3-1', slots: [GK, LB, CBL, CBR, RB, S('dml','DM','Tiền vệ phòng ngự trái','MF',-.3,.4), S('dmr','DM','Tiền vệ phòng ngự phải','MF',.3,.4), S('lw','LW','Tiền vệ cánh trái','MF',-.72,.57), S('am','AM','Tiền vệ tấn công','MF',0,.57), S('rw','RW','Tiền vệ cánh phải','MF',.72,.57), S('st','ST','Tiền đạo cắm','FW',0,.78)] }
};
var DEFAULT_F = '7-1231';
var ROLE_NAME = { GK: 'Thủ môn', DF: 'Hậu vệ', MF: 'Tiền vệ', FW: 'Tiền đạo' };
var ROLES = ['GK', 'DF', 'MF', 'FW'];
var PREFS = [['any', 'Xoay vòng'], ['gk', 'Thủ môn chuyên'], ['nogk', 'Không bắt gôn']];
var PREF_NAME = { any: 'Xoay vòng', gk: 'Thủ môn chuyên', nogk: 'Không bắt gôn' };
var DATA_PATH = 'data/team.json';
// Teammates never see the captain button; the captain opens the page with this at the end of the link.
var CAPTAIN_HASH = 'doi-truong';
function captainLink(){ return location.hash.replace('#', '') === CAPTAIN_HASH; }
// This browser has captain access saved (token or local edits). It only takes effect on the captain link.
function hasCaptainSetup(){ return !!(lsGet(LS_GH) || lsGet(LS_LOCAL)); }
var LS_VIEW = 'bttv-3d', LS_ME = 'bttv-me', LS_GH = 'bttv-github', LS_LOCAL = 'bttv-local-state', LS_DRAFT = 'bttv-draft', SS_UI = 'bttv-ui';

// ---------- helpers ----------
function $(s, r){ return (r || document).querySelector(s); }
function each(list, fn){ Array.prototype.forEach.call(list, fn); }
function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function uid(){ return 'x' + Math.random().toString(36).slice(2, 9); }
function r2(v){ return Math.round(v * 100) / 100; }
function lsGet(k){ try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v){ try { localStorage.setItem(k, v); } catch (e) {} }
function lsDel(k){ try { localStorage.removeItem(k); } catch (e) {} }
function ssGet(k){ try { return sessionStorage.getItem(k); } catch (e) { return null; } }
function ssSet(k, v){ try { sessionStorage.setItem(k, v); } catch (e) {} }
function pad(n){ return (n < 10 ? '0' : '') + n; }
function todayISO(){ var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function reducedMotion(){ return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; }

// ---------- dates (shown in the viewer's local time) ----------
var WD = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
function parseKick(s){ var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(s || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) : null; }
function toInput(d){ return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
function hm(d){ return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
function dm(d, withYear){ return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + (withYear ? '/' + d.getFullYear() : ''); }
function dayShort(d){ return WD[d.getDay()] + ' ' + dm(d); }
function whenFull(d){ return hm(d) + ' ' + dayShort(d); }
function isoDay(s){ var p = String(s || '').split('-'); return p.length === 3 ? p[2] + '/' + p[1] : ''; }
function countdown(ms){
  if (ms <= 0) return 'đang bốc…';
  var s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), mi = Math.floor(s % 3600 / 60);
  if (d) return 'còn ' + d + ' ngày ' + h + ' giờ';
  if (h) return 'còn ' + h + ' giờ ' + mi + ' phút';
  return 'còn ' + mi + ' phút ' + pad(s % 60) + ' giây';
}
function entryWhen(m){ var d = parseKick(m.kickoff); return d ? dayShort(d) + ' ' + hm(d) : isoDay(m.date); }

// ---------- state ----------
function blankLineup(){ return { f: DEFAULT_F, slots: {}, waiting: [], locked: [], status: 'draft', matchId: null, editOf: null, rolledAt: null, auto: false, kickoff: '', venue: '', schedule: null }; }
function blankState(){ return { v: 2, sample: false, team: 'Đội bóng', matchNo: 0, updatedAt: null, players: [], lineup: blankLineup(), history: [] }; }
function strArr(a){ return Array.isArray(a) ? a.filter(function(x){ return typeof x === 'string'; }) : []; }
function sanitize(s){
  if (!s || typeof s !== 'object' || !Array.isArray(s.players)) return null;
  var src = s.lineup || {}, L = blankLineup();
  if (FORMATIONS[src.f]) L.f = src.f;
  // v1 stored one pid per slot and a separate bench; v2 stores arrays and has no bench.
  if (src.slots && typeof src.slots === 'object') Object.keys(src.slots).forEach(function(k){
    var v = src.slots[k], arr = Array.isArray(v) ? strArr(v) : (typeof v === 'string' ? [v] : []);
    if (arr.length) L.slots[k] = arr;
  });
  L.waiting = strArr(src.waiting).concat(strArr(src.bench));
  L.locked = strArr(src.locked);
  L.status = src.status === 'confirmed' ? 'confirmed' : 'draft';
  L.matchId = typeof src.matchId === 'string' ? src.matchId : null;
  L.editOf = typeof src.editOf === 'string' ? src.editOf : null;
  L.rolledAt = isFinite(src.rolledAt) && src.rolledAt ? +src.rolledAt : null;
  L.auto = !!src.auto;
  L.kickoff = parseKick(src.kickoff) ? String(src.kickoff).slice(0, 16) : '';
  L.venue = typeof src.venue === 'string' ? src.venue.slice(0, 60) : '';
  var sc = src.schedule;
  L.schedule = sc && isFinite(sc.at) && isFinite(sc.seed) ? { at: +sc.at, seed: sc.seed >>> 0, done: !!sc.done } : null;
  return {
    v: 2, sample: !!s.sample,
    team: typeof s.team === 'string' && s.team.trim() ? s.team.slice(0, 40) : 'Đội bóng',
    matchNo: +s.matchNo || 0,
    updatedAt: isFinite(s.updatedAt) && s.updatedAt ? +s.updatedAt : null,
    players: s.players.filter(function(p){ return p && p.id; }).map(function(p){
      return { id: String(p.id), num: Math.max(0, Math.min(99, parseInt(p.num, 10) || 0)), name: String(p.name || '').slice(0, 40) || 'Không tên', here: p.here !== false, pref: PREF_NAME[p.pref] ? p.pref : 'any' };
    }),
    lineup: L,
    history: Array.isArray(s.history) ? s.history.filter(function(m){ return m && m.id && m.picks; }) : []
  };
}

var state = blankState();
// kind: loading | view (anh em xem) | github (đội trưởng, lưu vào repo) | local (đội trưởng, lưu trên máy này)
var store = { kind: 'loading', sha: null, error: '' };
var dirty = false, saving = false;
var selected = null;           // pid being moved on the pitch
var ui = { tab: 'match', armedDel: null, copyText: null, rosterErr: '', schedErr: '', rolling: false, animCards: false, dirtyMsg: '', me: lsGet(LS_ME) || '', capOpen: false };
try { var su = JSON.parse(ssGet(SS_UI) || 'null'); if (su && su.tab) ui.tab = su.tab; } catch (e) {}
var view3d = lsGet(LS_VIEW) !== '0';

function lu(){ return state.lineup; }
function F(){ return FORMATIONS[lu().f]; }
function fmtOf(fid){ var f = FORMATIONS[fid]; for (var i = 0; i < FORMATS.length; i++) if (FORMATS[i].id === f.fmt) return FORMATS[i]; return FORMATS[1]; }
function player(pid){ for (var i = 0; i < state.players.length; i++) if (state.players[i].id === pid) return state.players[i]; return null; }
function slotDef(fid, sid){ var f = FORMATIONS[fid]; if (!f) return null; for (var i = 0; i < f.slots.length; i++) if (f.slots[i].id === sid) return f.slots[i]; return null; }
function slotOfPid(pid){ var s = lu().slots; for (var k in s) if (s[k].indexOf(pid) >= 0) return k; return null; }
function locOf(pid){ var s = lu().slots; for (var k in s){ var i = s[k].indexOf(pid); if (i >= 0) return { slot: k, i: i }; } var w = lu().waiting.indexOf(pid); return w >= 0 ? { wait: true, i: w } : null; }
function editable(){ return store.kind === 'github' || store.kind === 'local'; }
function isPending(){ var sc = lu().schedule; return !!(sc && !sc.done); }
function entryById(id){ return id ? state.history.filter(function(m){ return m.id === id; })[0] || null : null; }
function currentEntry(){ return entryById(lu().matchId || lu().editOf); }
function currentNo(){ var e = currentEntry(); return e ? e.no : (state.matchNo || 0) + 1; }
function maxNo(){ return state.history.reduce(function(a, m){ return Math.max(a, m.no || 0); }, 0); }
function shortName(n, max){ n = String(n); max = max || 12; return n.length > max ? n.slice(0, max - 1) + '…' : n; }

function normalize(){
  var L0 = lu(), before = JSON.stringify([L0.slots, L0.waiting]);
  if (!FORMATIONS[L0.f]) L0.f = DEFAULT_F;
  var f = F(), ids = {}, here = {}, seen = {}, slots = {}, waiting = [];
  state.players.forEach(function(p){ ids[p.id] = 1; if (p.here) here[p.id] = 1; });
  f.slots.forEach(function(sl){
    var arr = [];
    (L0.slots[sl.id] || []).forEach(function(pid){ if (here[pid] && !seen[pid]){ arr.push(pid); seen[pid] = 1; } });
    if (arr.length) slots[sl.id] = arr;
  });
  Object.keys(L0.slots).forEach(function(k){ L0.slots[k].forEach(function(pid){ if (here[pid] && !seen[pid]){ waiting.push(pid); seen[pid] = 1; } }); });
  L0.waiting.forEach(function(pid){ if (here[pid] && !seen[pid]){ waiting.push(pid); seen[pid] = 1; } });
  state.players.forEach(function(p){ if (p.here && !seen[p.id]){ waiting.push(p.id); seen[p.id] = 1; } });
  L0.slots = slots; L0.waiting = waiting;
  L0.locked = L0.locked.filter(function(id){ return ids[id] && slotOfPid(id); });
  if (L0.status === 'confirmed' && JSON.stringify([L0.slots, L0.waiting]) !== before){ L0.status = 'draft'; L0.editOf = L0.matchId; L0.matchId = null; }
  if (selected && !locOf(selected)) selected = null;
}

// A confirmed match was changed by hand: keep editing that match rather than starting the next one.
function markEdited(){ var L0 = lu(); if (L0.status === 'confirmed'){ L0.status = 'draft'; L0.editOf = L0.matchId; L0.matchId = null; } ui.copyText = null; }

// Played = 2h after kickoff (or a day later when no kickoff was set).
function matchOver(e){
  if (!e) return false;
  var ko = parseKick(e.kickoff);
  return ko ? Date.now() > ko.getTime() + 2 * 3600000 : (e.date || '') < todayISO();
}
// Before a new draw: if the confirmed match was already played, move on to the next one
// (kickoff moves on a week if it wasn't changed); otherwise re-draw that same match.
function prepareDraw(){
  var L0 = lu(), e = currentEntry();
  if (e && !matchOver(e)){ L0.status = 'draft'; L0.editOf = e.id; L0.matchId = null; return; }
  if (e){
    var last = state.history[0], lk = last && parseKick(last.kickoff), ck = parseKick(L0.kickoff);
    if (lk && (!ck || ck <= lk)){ var d = new Date(lk.getTime()); d.setDate(d.getDate() + 7); L0.kickoff = toInput(d); }
  }
  L0.status = 'draft'; L0.matchId = null; L0.editOf = null;
}

// ---------- storage ----------
// keep: 'roster' | 'match' — leave that pane's inputs alone so typing focus survives.
var keepPane = '';
function commit(keep){
  normalize();
  if (store.kind === 'local') lsSet(LS_LOCAL, JSON.stringify(state));
  else if (store.kind === 'github'){ dirty = true; lsSet(LS_DRAFT, JSON.stringify({ sha: store.sha, state: state })); }
  keepPane = keep || ''; render(); keepPane = '';
}

function b64enc(str){
  var bytes = new TextEncoder().encode(str), bin = '';
  for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
function b64dec(b64){
  var bin = atob(String(b64).replace(/\s/g, '')), bytes = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function ghCfg(){ try { var c = JSON.parse(lsGet(LS_GH) || 'null'); return c && c.token && c.owner && c.repo ? c : null; } catch (e) { return null; } }
// On https://<owner>.github.io/<repo>/ the repo can be read off the address.
function guessRepo(){
  var m = /^([^.]+)\.github\.io$/i.exec(location.hostname);
  if (!m) return { owner: '', repo: '' };
  var seg = location.pathname.split('/').filter(Boolean)[0];
  return { owner: m[1], repo: seg && seg.indexOf('.') < 0 ? seg : m[1] + '.github.io' };
}
function ghUrl(c){ return 'https://api.github.com/repos/' + encodeURIComponent(c.owner) + '/' + encodeURIComponent(c.repo) + '/contents/' + c.path.split('/').map(encodeURIComponent).join('/'); }
function ghErr(code, msg){ var e = new Error(msg); e.code = code; return e; }
function ghMessage(status){
  if (status === 401) return 'Token không đúng hoặc đã hết hạn.';
  if (status === 403) return 'Token chưa có quyền ghi (cần Contents: Read and write), hoặc GitHub đang tạm giới hạn số lần gọi.';
  if (status === 404) return 'Không thấy repo hoặc file. Kiểm tra tên tài khoản, tên repo, nhánh, và token có được cấp quyền cho repo này không.';
  if (status === 409 || status === 422) return 'File trên GitHub vừa bị sửa ở chỗ khác.';
  return 'GitHub trả lỗi ' + status + '.';
}
async function ghFetch(c, url, method, body){
  var r;
  try {
    r = await fetch(url, { method: method, cache: 'no-store', body: body ? JSON.stringify(body) : undefined,
      headers: { Authorization: 'Bearer ' + c.token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' } });
  } catch (e) { throw ghErr('network', 'Không kết nối được GitHub. Kiểm tra mạng rồi thử lại.'); }
  if (!r.ok) throw ghErr(r.status === 409 || r.status === 422 ? 'conflict' : 'http' + r.status, ghMessage(r.status));
  return r.json();
}
async function ghLoad(c){
  var j = await ghFetch(c, ghUrl(c) + '?ref=' + encodeURIComponent(c.branch) + '&t=' + Date.now(), 'GET');
  return { sha: j.sha, state: JSON.parse(b64dec(j.content)) };
}
async function ghSave(c, st, sha, message){
  var body = { message: message, content: b64enc(JSON.stringify(st, null, 2) + '\n'), branch: c.branch };
  if (sha) body.sha = sha;
  var j = await ghFetch(c, ghUrl(c), 'PUT', body);
  return j.content.sha;
}
async function ghRepoOk(c){
  try { await ghFetch(c, 'https://api.github.com/repos/' + encodeURIComponent(c.owner) + '/' + encodeURIComponent(c.repo), 'GET'); return true; } catch (e) { return false; }
}

// Saves the whole state: to the repo (github) or this browser (local).
async function save(msg, commitMsg){
  if (store.kind === 'local'){ lsSet(LS_LOCAL, JSON.stringify(state)); dirty = false; render(); if (msg) toast(msg); return; }
  if (store.kind !== 'github') return;
  var c = ghCfg();
  if (!c){ toast('Chưa có token GitHub trên máy này. Mở Cài đặt đội trưởng để kết nối.'); return; }
  saving = true; renderSavebar(); renderActions();
  state.updatedAt = Date.now();
  try {
    store.sha = await ghSave(c, state, store.sha, commitMsg || 'Cập nhật đội hình');
    dirty = false; ui.dirtyMsg = ''; lsDel(LS_DRAFT);
    toast((msg ? msg + ' ' : 'Đã lưu lên GitHub. ') + 'Khoảng 1 phút nữa anh em tải lại trang là thấy.');
  } catch (e) {
    if (e.code === 'conflict'){
      try {
        var got = await ghLoad(c);
        store.sha = got.sha; state = sanitize(got.state) || state; dirty = false; lsDel(LS_DRAFT);
        toast('Dữ liệu trên GitHub vừa đổi ở chỗ khác. Đã tải bản mới nhất, bạn làm lại thao tác vừa rồi nhé.');
      } catch (e2) { dirty = true; toast('Chưa lưu được: ' + e2.message); }
    } else { dirty = true; toast('Chưa lưu được: ' + e.message); }
  } finally {
    saving = false; normalize(); render();
  }
}

var lastPublicRaw = '';
async function fetchPublic(){
  var r = await fetch(DATA_PATH + '?v=' + Date.now(), { cache: 'no-store' });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.text();
}
async function loadAsViewer(){
  store.kind = 'view'; store.sha = null;
  try { var raw = await fetchPublic(); lastPublicRaw = raw; state = sanitize(JSON.parse(raw)) || blankState(); store.error = ''; }
  catch (e) {
    state = blankState();
    store.error = location.protocol === 'file:' ? 'Mở file trực tiếp thì trình duyệt không cho đọc data/team.json. Chạy “npm start” rồi mở http://localhost:8765.' : 'Không tải được danh sách đội (' + e.message + '). Thử tải lại trang.';
  }
}
// Teammates keep the page open: pick up the captain's new saves.
async function refreshPublic(){
  if (store.kind !== 'view' || document.hidden) return;
  try {
    var raw = await fetchPublic();
    if (raw === lastPublicRaw) return;
    lastPublicRaw = raw;
    var s = sanitize(JSON.parse(raw)); if (!s) return;
    state = s; store.error = ''; normalize();
    if (!checkSchedule(false)) render();
    toast('Đội hình vừa được cập nhật.');
  } catch (e) {}
}
function restoreDraft(){
  var d = null; try { d = JSON.parse(lsGet(LS_DRAFT) || 'null'); } catch (e) {}
  if (d && d.sha === store.sha && d.state){
    var s = sanitize(d.state);
    if (s){ state = s; dirty = true; ui.dirtyMsg = 'Có thay đổi từ lần trước chưa lưu lên GitHub.'; }
  } else lsDel(LS_DRAFT);
}

async function boot(){
  mountShell(); render();
  var c = captainLink() ? ghCfg() : null, localRaw = captainLink() ? lsGet(LS_LOCAL) : null;
  if (c){
    try { var got = await ghLoad(c); state = sanitize(got.state) || blankState(); store = { kind: 'github', sha: got.sha, error: '' }; restoreDraft(); }
    catch (e) { await loadAsViewer(); store.error = 'Chưa kết nối được GitHub: ' + e.message + ' Mở Cài đặt đội trưởng để sửa.'; }
  } else if (localRaw){
    var s = null; try { s = sanitize(JSON.parse(localRaw)); } catch (e) {}
    if (s){ state = s; store = { kind: 'local', sha: null, error: '' }; } else await loadAsViewer();
  } else await loadAsViewer();
  normalize();
  if (!checkSchedule(false)) render();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ renderPitch(); });
  if (captainLink() && !editable()) openCaptain();
  // switching between the normal link and the captain link starts the page over in the right mode
  window.addEventListener('hashchange', function(){ location.reload(); });
  setInterval(tick, 1000);
  setInterval(refreshPublic, 90000);
  document.addEventListener('visibilitychange', function(){ if (!document.hidden) refreshPublic(); });
}

// ---------- captain settings ----------
function openCaptain(){
  if (!captainLink()){ location.hash = CAPTAIN_HASH; return; }
  ui.capOpen = true; renderCaptain(); var f = $('#cap-owner'); if (f) f.focus();
}
function closeCaptain(){ ui.capOpen = false; renderCaptain(); var b = $('#cap-btn'); if (b) b.focus(); }
function capVal(id){ var el = $('#' + id); return el ? el.value.trim() : ''; }
function capError(msg){ var e = $('#cap-err'); if (e) e.textContent = msg || ''; }
async function connectGitHub(){
  var old = ghCfg() || {};
  var c = { owner: capVal('cap-owner'), repo: capVal('cap-repo'), branch: capVal('cap-branch') || 'main', path: capVal('cap-path') || DATA_PATH, token: capVal('cap-token') || old.token || '' };
  if (!c.owner || !c.repo){ capError('Nhập tên tài khoản GitHub và tên repo.'); return; }
  if (!c.token){ capError('Dán token GitHub vào ô Token.'); return; }
  var btn = $('#cap-connect'); if (btn){ btn.disabled = true; btn.textContent = 'Đang kết nối…'; }
  capError('');
  try {
    var got;
    try { got = await ghLoad(c); }
    catch (e) {
      // Repo exists but has no data file yet: create it from what is on screen.
      if (e.code === 'http404' && await ghRepoOk(c)){ state.updatedAt = Date.now(); got = { sha: await ghSave(c, state, null, 'Tạo file dữ liệu đội'), state: state }; }
      else throw e;
    }
    lsSet(LS_GH, JSON.stringify(c)); lsDel(LS_LOCAL); lsDel(LS_DRAFT);
    store = { kind: 'github', sha: got.sha, error: '' };
    state = sanitize(got.state) || state; dirty = false; ui.dirtyMsg = '';
    ui.capOpen = false; normalize();
    if (!checkSchedule(false)) render();
    renderCaptain();
    toast('Đã kết nối ' + c.owner + '/' + c.repo + '. Giờ bạn random và lưu được cho cả đội.');
  } catch (e) {
    capError(e.message);
    if (btn){ btn.disabled = false; btn.textContent = 'Kết nối GitHub'; }
  }
}
function localEdit(){
  lsSet(LS_LOCAL, JSON.stringify(state)); lsDel(LS_GH); lsDel(LS_DRAFT);
  store = { kind: 'local', sha: null, error: '' }; dirty = false;
  ui.capOpen = false; renderCaptain(); render();
  toast('Đang sửa trên máy này. Muốn cả đội thấy thì kết nối GitHub, hoặc tải file team.json rồi commit vào repo.');
}
async function exitCaptain(){
  lsDel(LS_GH); lsDel(LS_LOCAL); lsDel(LS_DRAFT);
  history.replaceState(null, '', location.pathname + location.search);
  dirty = false; selected = null; ui.capOpen = false; renderCaptain();
  await loadAsViewer(); normalize();
  if (!checkSchedule(false)) render();
  toast('Đã thoát chế độ đội trưởng. Token đã xoá khỏi máy này.');
}
function exportJSON(){
  var blob = new Blob([JSON.stringify(state, null, 2) + '\n'], { type: 'application/json' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'team.json';
  document.body.appendChild(a); a.click();
  setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

// ---------- draws ----------
function presentPlayers(){ return state.players.filter(function(p){ return p.here; }).map(function(p){ return { id: p.id, pref: p.pref }; }); }
function rollInputs(){
  var fixed = {};
  lu().locked.forEach(function(pid){ var sid = slotOfPid(pid); if (sid) (fixed[sid] = fixed[sid] || []).push(pid); });
  var redo = lu().editOf;
  return { slots: F().slots, players: presentPlayers(), fixed: fixed, past: pastByPlayer(state.history.filter(function(m){ return m.id !== redo; })), formation: lu().f };
}

function roll(){
  if (!editable() || ui.rolling) return false;
  if (!presentPlayers().length){ toast('Chưa ai đi đá. Vào tab Cầu thủ để tick người có mặt.'); return false; }
  var L0 = lu(), cancelled = isPending();
  L0.schedule = null;
  prepareDraw();
  var res = computeLineup(rollInputs());
  var apply = function(){
    L0.slots = res.slots; L0.waiting = res.waiting;
    L0.rolledAt = Date.now(); L0.auto = false; L0.status = 'draft'; L0.matchId = null;
    selected = null; ui.copyText = null; ui.animCards = !reducedMotion();
    commit();
    if (cancelled) toast('Đã huỷ hẹn giờ và random luôn.');
  };
  if (reducedMotion()){ apply(); return true; }
  ui.rolling = true; renderActions();
  var lyr = $('#lyr-cards'); if (lyr) lyr.classList.add('shuffle');
  setTimeout(function(){ if (lyr) lyr.classList.remove('shuffle'); ui.rolling = false; apply(); }, 260);
  return true;
}

// The scheduled draw: same seed + same saved data = same lineup in every viewer's browser.
function checkSchedule(animate){
  var sc = lu().schedule;
  if (!sc || sc.done || Date.now() < sc.at || store.kind === 'loading') return false;
  var res = computeLineup(Object.assign(rollInputs(), { rand: mulberry32(sc.seed) }));
  var L0 = lu();
  L0.slots = res.slots; L0.waiting = res.waiting; L0.rolledAt = sc.at; L0.auto = true; sc.done = true;
  ui.dirtyMsg = 'Đã bốc thăm theo giờ hẹn. Bấm Chốt đội hình để lưu vào lịch sử.';
  ui.animCards = animate && !reducedMotion();
  commit();
  if (animate) toast('Đã bốc thăm xong. Chọn tên của bạn để xem vị trí.');
  return true;
}

function defaultSchedule(){
  var ko = parseKick(lu().kickoff), soon = Date.now() + 5 * 60000, d = null;
  if (ko){ d = new Date(ko.getTime() - 2 * 3600000); if (d.getTime() < soon) d = null; }
  if (!d){ d = new Date(Date.now() + 3600000); d.setMinutes(0, 0, 0); if (d.getTime() < soon) d = new Date(d.getTime() + 3600000); }
  return toInput(d);
}
function setSchedule(){
  var inp = $('#sched-at'), d = parseKick(inp && inp.value);
  if (!d){ ui.schedErr = 'Chọn ngày giờ bốc thăm.'; renderMatch(); return; }
  if (d.getTime() < Date.now() + 60000){ ui.schedErr = 'Giờ bốc thăm phải sau bây giờ ít nhất 1 phút.'; renderMatch(); return; }
  prepareDraw();
  var L0 = lu(), keep = {};
  L0.locked.forEach(function(pid){ keep[pid] = 1; });
  Object.keys(L0.slots).forEach(function(sid){ var a = L0.slots[sid].filter(function(pid){ return keep[pid]; }); if (a.length) L0.slots[sid] = a; else delete L0.slots[sid]; });
  L0.schedule = { at: d.getTime(), seed: Math.floor(Math.random() * 4294967296) >>> 0, done: false };
  L0.rolledAt = null; L0.auto = false; ui.schedErr = ''; selected = null; ui.copyText = null;
  normalize(); render();
  save('Đã hẹn bốc thăm lúc ' + whenFull(d) + '.', 'Hẹn bốc thăm lúc ' + whenFull(d));
}
function cancelSchedule(){
  if (!isPending()) return;
  lu().schedule = null; normalize(); render();
  save('Đã huỷ hẹn giờ bốc thăm.', 'Huỷ hẹn bốc thăm');
}

// Same kind of pitch (e.g. 2-3-1 -> 3-2-1): keep everyone and shift them to the nearest spots.
// Different pitch size (sân 7 -> sân 11): the spots don't line up, so draw again.
function setFormation(fid){
  var L0 = lu(), from = L0.f;
  if (!editable() || ui.rolling || !FORMATIONS[fid] || fid === from) return;
  if (isPending()){ L0.f = fid; commit(); return; }
  if (FORMATIONS[from].fmt === FORMATIONS[fid].fmt && Object.keys(L0.slots).length){
    var res = remapLineup(FORMATIONS[from].slots, FORMATIONS[fid].slots, L0.slots);
    L0.f = fid; L0.slots = res.slots; L0.waiting = L0.waiting.concat(res.waiting);
    markEdited(); selected = null; ui.animCards = !reducedMotion();
    commit();
    toast('Đã đổi sang ' + FORMATIONS[fid].name + ', giữ nguyên người. Muốn đưa ai lên hoặc xuống tuyến: chạm tên người đó rồi chạm tên người ở tuyến kia.');
    return;
  }
  L0.f = fid;
  if (!roll()){ markEdited(); commit(); }
}

function confirmLineup(){
  var L0 = lu();
  if (!editable() || L0.status === 'confirmed' || isPending()) return;
  if (!Object.keys(L0.slots).length){ toast('Sân đang trống. Bấm Random trước đã.'); return; }
  var picks = {};
  Object.keys(L0.slots).forEach(function(sid){
    var d = slotDef(L0.f, sid), arr = L0.slots[sid];
    arr.forEach(function(pid){ picks[pid] = arr.length > 1 ? { s: sid, r: d.role, sh: 1 } : { s: sid, r: d.role }; });
  });
  var ko = parseKick(L0.kickoff), date = ko ? L0.kickoff.slice(0, 10) : todayISO();
  var entry = entryById(L0.editOf), msg;
  if (entry){
    entry.f = L0.f; entry.picks = picks; entry.kickoff = L0.kickoff; entry.venue = L0.venue; entry.rolledAt = L0.rolledAt; entry.date = date;
    msg = 'Đã cập nhật trận ' + entry.no + '.';
  } else {
    entry = { id: uid(), no: (state.matchNo || 0) + 1, date: date, kickoff: L0.kickoff, venue: L0.venue, rolledAt: L0.rolledAt, f: L0.f, picks: picks };
    state.history.unshift(entry); state.matchNo = entry.no;
    msg = 'Đã chốt trận ' + entry.no + (ko ? ' (' + dayShort(ko) + ' lúc ' + hm(ko) + ')' : '') + '.';
  }
  if (state.history.length > 60) state.history.length = 60;
  L0.status = 'confirmed'; L0.matchId = entry.id; L0.editOf = null; selected = null;
  normalize(); render();
  save(msg, 'Chốt trận ' + entry.no);
}

function undoConfirm(){
  var L0 = lu(); if (!editable() || L0.status !== 'confirmed') return;
  var no = currentNo();
  state.history = state.history.filter(function(m){ return m.id !== L0.matchId; });
  state.matchNo = maxNo(); L0.status = 'draft'; L0.matchId = null; L0.editOf = null;
  render(); save('Đã huỷ chốt. Đội hình quay về bản nháp.', 'Huỷ chốt trận ' + no);
}
function deleteMatch(id){
  var m = entryById(id);
  state.history = state.history.filter(function(x){ return x.id !== id; });
  state.matchNo = maxNo();
  if (lu().matchId === id){ lu().status = 'draft'; lu().matchId = null; }
  if (lu().editOf === id) lu().editOf = null;
  ui.armedDel = null; render(); save('Đã xoá trận khỏi lịch sử.', 'Xoá trận ' + (m ? m.no : ''));
}
function clearHistory(){
  state.history = []; state.matchNo = 0; lu().status = 'draft'; lu().matchId = null; lu().editOf = null;
  ui.armedDel = null; render(); save('Đã xoá toàn bộ lịch sử.', 'Xoá lịch sử');
}

// ---------- manual moves ----------
function placeOrSwap(a, b){
  var la = locOf(a), lb = locOf(b), L0 = lu(); if (!la || !lb) return;
  if (la.wait && lb.wait){ selected = b; render(); return; }
  if (la.wait || lb.wait){
    // someone not placed yet joins the other player's position
    var w = la.wait ? a : b, target = la.wait ? lb : la;
    L0.waiting.splice(L0.waiting.indexOf(w), 1); L0.slots[target.slot].push(w);
  } else if (la.slot === lb.slot){ selected = null; render(); return; }
  else { L0.slots[la.slot][la.i] = b; L0.slots[lb.slot][lb.i] = a; }
  markEdited(); selected = null; commit();
}
function moveToSlot(pid, sid){
  var la = locOf(pid), L0 = lu(); if (!la) return;
  if (la.wait) L0.waiting.splice(la.i, 1); else L0.slots[la.slot].splice(la.i, 1);
  (L0.slots[sid] = L0.slots[sid] || []).push(pid);
  markEdited(); selected = null; commit();
}
function toggleLock(pid){
  var L0 = lu(), i = L0.locked.indexOf(pid);
  if (i >= 0) L0.locked.splice(i, 1); else if (slotOfPid(pid)) L0.locked.push(pid);
  commit();
}
function tapPlayer(pid){
  if (!editable()) return;
  if (isPending()){ toast('Đang chờ bốc thăm theo giờ hẹn. Huỷ hẹn nếu muốn xếp tay.'); return; }
  if (!selected){ selected = pid; render(); return; }
  if (selected === pid){ selected = null; render(); return; }
  placeOrSwap(selected, pid);
}
function tapEmpty(sid){ if (!editable() || !selected || isPending()) return; moveToSlot(selected, sid); }

// ---------- roster ----------
function rosterChanged(){ state.sample = false; }
function addPlayer(numStr, name){
  var n = parseInt(numStr, 10); name = (name || '').trim();
  if (!(numStr + '').trim() || isNaN(n) || n < 0 || n > 99) return 'Nhập số áo từ 0 đến 99.';
  var taken = state.players.filter(function(p){ return p.num === n; })[0];
  if (taken) return 'Số ' + n + ' đã có người mặc (' + taken.name + ').';
  if (!name) return 'Nhập tên cầu thủ.';
  state.players.push({ id: uid(), num: n, name: name.slice(0, 40), here: true, pref: 'any' });
  state.players.sort(function(a, b){ return a.num - b.num; });
  rosterChanged(); return '';
}

// ---------- copy text ----------
function lineupText(){
  var L0 = lu(), f = F(), fm = fmtOf(L0.f), lines = [], ko = parseKick(L0.kickoff);
  lines.push(state.team + ' · Trận ' + currentNo() + (L0.status === 'confirmed' ? '' : ' (nháp)'));
  lines.push('Đá lúc ' + (ko ? hm(ko) + ' ' + dayShort(ko) + '/' + ko.getFullYear() : '(chưa hẹn giờ)') + (L0.venue ? ' · ' + L0.venue : ''));
  if (isPending()){
    lines.push('Bốc thăm vị trí lúc ' + whenFull(new Date(L0.schedule.at)) + '. Mở link để xem kết quả.');
  } else {
    lines.push('Sơ đồ ' + f.name + ' (' + fm.label.toLowerCase() + ')' + (L0.rolledAt ? ' · random lúc ' + whenFull(new Date(L0.rolledAt)) : ''));
    lines.push('');
    var anyShared = false;
    ROLES.forEach(function(role){
      var ss = f.slots.filter(function(s){ return s.role === role; }).slice().sort(function(a, b){ return a.x - b.x; });
      var items = ss.map(function(s){
        var arr = (L0.slots[s.id] || []).map(player).filter(Boolean);
        if (!arr.length) return null;
        if (arr.length > 1) anyShared = true;
        return arr.map(function(p){ return p.num + ' ' + p.name; }).join(' / ') + (role === 'GK' ? '' : ' (' + s.code + ')');
      }).filter(Boolean);
      if (items.length) lines.push(ROLE_NAME[role] + ': ' + items.join(', '));
    });
    if (L0.waiting.length) lines.push('Chưa xếp: ' + L0.waiting.map(function(pid){ var p = player(pid); return p.num + ' ' + p.name; }).join(', '));
    if (anyShared){ lines.push(''); lines.push('Vị trí có 2 người: ai đến sân trước đá trước.'); }
  }
  if (/^https?:/.test(location.href)){ lines.push(''); lines.push(location.href.split('#')[0].split('?')[0]); }
  return lines.join('\n');
}
function copyLineup(){
  var text = lineupText();
  var fallback = function(){ ui.copyText = text; renderActions(); var ta = $('#copy-ta'); if (ta){ ta.focus(); ta.select(); } };
  try {
    if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('no clipboard');
    navigator.clipboard.writeText(text).then(function(){ toast('Đã copy đội hình. Dán vào nhóm chat của đội là xong.'); }, fallback);
  } catch (e) { fallback(); }
}

// ---------- toast ----------
var toastTimer = null;
function toast(msg){
  var t = $('#toast'); if (!t) return;
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(function(){ t.hidden = true; }, 4200);
}

// ---------- pitch geometry ----------
var SVGNS = 'http://www.w3.org/2000/svg';
var PL = 100, PW = 64, HX = 29, GX = 37, GY = 56, TH = 44 * Math.PI / 180, DIST = 165;
function P(fx, fy){
  if (!view3d) return { x: fx, y: fy, s: 1 };
  var z = fy * Math.sin(TH), s = DIST / (DIST - z);
  return { x: fx * s, y: fy * Math.cos(TH) * s, s: s };
}
function upF(){ return view3d ? Math.sin(TH) : 0; }

function pitchSVG(){
  var out = [], d = '';
  function pt(x, y){ var q = P(x, y); return r2(q.x) + ' ' + r2(q.y); }
  function poly(arr, close){ arr.forEach(function(p, i){ d += (i ? 'L' : 'M') + pt(p[0], p[1]); }); if (close) d += 'Z'; }
  function arcPts(cx, cy, r, t0, t1, n){ var a = []; for (var i = 0; i <= n; i++){ var t = t0 + (t1 - t0) * i / n; a.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); } return a; }
  var n = 14, h = 2 * GY / n;
  for (var i = 0; i < n; i++){
    var y0 = -GY + i * h, y1 = y0 + h;
    out.push('<path class="' + (i % 2 ? 'gb' : 'ga') + '" d="M' + pt(-GX, y0) + 'L' + pt(GX, y0) + 'L' + pt(GX, y1 + .05) + 'L' + pt(-GX, y1 + .05) + 'Z"/>');
  }
  var hw = PW / 2, hl = PL / 2;
  poly([[-hw, -hl], [hw, -hl], [hw, hl], [-hw, hl]], true);
  poly([[-hw, 0], [hw, 0]]);
  poly(arcPts(0, 0, 9, 0, Math.PI * 2, 64), true);
  var a = Math.asin(5 / 9);
  [-1, 1].forEach(function(sg){
    var gl = sg * hl;
    poly([[-20, gl], [-20, gl - sg * 16], [20, gl - sg * 16], [20, gl]]);
    poly([[-9, gl], [-9, gl - sg * 5.5], [9, gl - sg * 5.5], [9, gl]]);
    var cy = gl - sg * 11;
    poly(sg > 0 ? arcPts(0, cy, 9, Math.PI + a, 2 * Math.PI - a, 24) : arcPts(0, cy, 9, a, Math.PI - a, 24));
    [-1, 1].forEach(function(sx){
      var cx = sx * hw, pts = [];
      for (var k = 0; k <= 6; k++){ var t = (Math.PI / 2) * k / 6; pts.push([cx - sx * 1.6 * Math.cos(t), gl - sg * 1.6 * Math.sin(t)]); }
      poly(pts);
    });
  });
  var spots = '';
  [[0, 0], [0, -hl + 11], [0, hl - 11]].forEach(function(s){ var q = P(s[0], s[1]); spots += '<ellipse class="spot" cx="' + r2(q.x) + '" cy="' + r2(q.y) + '" rx="' + r2(.55 * q.s) + '" ry="' + r2(.55 * q.s * (view3d ? Math.cos(TH) : 1)) + '"/>'; });
  out.push(goalSVG(-1));
  out.push('<path class="lines" d="' + d + '"/>' + spots);
  out.push(goalSVG(1));
  return out.join('');
}
function goalSVG(sg){
  var gl = sg * PL / 2, gw = 6.5, depth = 3.8, GH = 5.4, up = upF();
  function pt(x, y, hh){ var q = P(x, y); return [r2(q.x), r2(q.y - hh * up * q.s)]; }
  function poly(ps){ return 'M' + ps.map(function(p){ return p[0] + ' ' + p[1]; }).join('L') + 'Z'; }
  var A = pt(-gw, gl, 0), B = pt(gw, gl, 0), At = pt(-gw, gl, GH), Bt = pt(gw, gl, GH);
  var C = pt(-gw, gl + sg * depth, 0), Dd = pt(gw, gl + sg * depth, 0), Ct = pt(-gw, gl + sg * depth, GH * .72), Dt = pt(gw, gl + sg * depth, GH * .72);
  var panels = poly([C, Dd, Dt, Ct]) + poly([At, Bt, Dt, Ct]) + poly([A, At, Ct, C]) + poly([B, Bt, Dt, Dd]) + poly([A, B, Dd, C]);
  return '<path class="net-bg" d="' + panels + '"/><path class="net" d="' + panels + '"/>' +
    '<path class="goal-frame" d="M' + A.join(' ') + 'L' + At.join(' ') + 'L' + Bt.join(' ') + 'L' + B.join(' ') + '"/>';
}

// Where each position sits on screen, far positions first, plus the viewBox edges.
function layout(){
  var L0 = lu(), f = F(), fm = fmtOf(L0.f), items = [];
  f.slots.forEach(function(sl){
    var q = P(sl.x * HX, PL / 2 - sl.y * PL);
    items.push({ x: q.x, y: q.y, s: q.s * fm.scale, slot: sl, pids: (L0.slots[sl.id] || []).filter(player) });
  });
  items.sort(function(a, b){ return a.y - b.y; });
  var near = P(GX, GY), far = P(GX, -GY);
  var back = P(0, -PL / 2 - 3.8), bar = P(0, -PL / 2);
  return {
    items: items, fmt: fm.id,
    minX: -near.x - 1, maxX: near.x + 1,
    minY: Math.min(far.y, back.y - 5.4 * .72 * upF() * back.s, bar.y - 5.4 * upF() * bar.s) - 5,
    stripTop: near.y + 4, bottom: near.y + 1.5
  };
}

var svgBuilt = null;
function ensureSVG(){
  var wrap = $('#pitch-wrap'); if (!wrap) return null;
  var svg = wrap.querySelector('svg');
  if (!svg){
    svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('class', 'pitch');
    svg.setAttribute('role', 'group');
    svg.innerHTML = '<defs><pattern id="net" width="1.3" height="1.3" patternUnits="userSpaceOnUse"><path d="M0 0L1.3 1.3M1.3 0L0 1.3" stroke="rgba(255,255,255,.5)" stroke-width=".16" fill="none"/></pattern></defs>' +
      '<g id="lyr-pitch"></g><g id="lyr-cards"></g><g id="lyr-strip"></g>';
    wrap.insertBefore(svg, wrap.firstChild);
    svg.addEventListener('click', function(e){
      var t = e.target.closest('.seg'), em = e.target.closest('.card-empty');
      if (t) tapPlayer(t.getAttribute('data-pid'));
      else if (em) tapEmpty(em.getAttribute('data-slot'));
      else if (selected){ selected = null; render(); }
    });
    svg.addEventListener('keydown', function(e){
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var t = e.target.closest('.seg'), em = e.target.closest('.card-empty');
      if (t){ e.preventDefault(); tapPlayer(t.getAttribute('data-pid')); }
      else if (em){ e.preventDefault(); tapEmpty(em.getAttribute('data-slot')); }
    });
    svgBuilt = null;
  }
  return svg;
}

// Names on a card get shorter when two share a position on a crowded 11-a-side pitch.
function nameMax(k, fmtId){ return k > 1 ? (fmtId === '11' ? 6 : 9) : 12; }
var SHIRT = 'M-1.6 -11Q0 -9.3 1.6 -11L3.5 -10.5L5.5 -8.2L4.1 -6.8L3.1 -7.6L3.1 -2.6Q0 -2.1 -3.1 -2.6L-3.1 -7.6L-4.1 -6.8L-5.5 -8.2L-3.5 -10.5Z';
var LOCK = '<g class="seg-lock"><rect x="0" y="1" width="1.9" height="1.5" rx=".3"/><path d="M.35 1V.6a.6.6 0 0 1 1.2 0V1"/></g>';
function segHTML(pid, k, fmtId){
  var p = player(pid), locked = lu().locked.indexOf(pid) >= 0;
  var cls = 'seg' + (selected === pid ? ' sel' : '') + (ui.me === pid ? ' me' : '') + (locked ? ' locked' : '');
  var loc = locOf(pid), sd = loc && loc.slot ? slotDef(lu().f, loc.slot) : null;
  var label = 'Số ' + p.num + ' ' + p.name + ', ' + (sd ? sd.name : (isPending() ? 'chờ bốc thăm' : 'chưa xếp vị trí')) + (selected === pid ? ', đang chọn' : '');
  return '<g class="' + cls + '" data-pid="' + pid + '"' + (editable() ? ' tabindex="0" role="button"' : '') + ' aria-label="' + esc(label) + '">' +
    '<rect class="seg-bg" x="0" y="1.45" width="1" height="4.1" rx=".9"/>' +
    '<text class="seg-t" x="0" y="4.6">' + esc(shortName(p.name, nameMax(k, fmtId))) + '</text>' + (locked ? LOCK : '') + '</g>';
}
// One shirt per position with one number on it; the name card under it lists everyone there ("Nam / Khoa").
function cardHTML(it, i, anim, canTarget, fmtId){
  var gk = it.slot.role === 'GK', k = it.pids.length, empty = !k;
  var num = k ? player(it.pids[0]).num : '';
  // the shirt is drawn a little smaller than the name card so neighbouring positions don't touch
  var inner = '<ellipse class="shadow" cx="0" cy="0" rx="2.9" ry=".95"/>' +
    '<g transform="scale(.82)"><path class="shirt' + (gk ? ' gk' : '') + (empty ? ' empty' : '') + '" d="' + SHIRT + '"/>' +
    (empty ? (isPending() ? '<text class="no" x="0" y="-4.3" style="font-size:5px">?</text>' : '')
      : '<text class="no" x="0" y="-4.3">' + num + '</text>') + '</g>' +
    '<text class="ctag" x="0" y="-10.2">' + it.slot.code + '</text>' +
    '<rect class="cbg" x="-5" y="1.2" width="10" height="4.6" rx="1.2"/>';
  if (empty) inner += '<text class="seg-t empty-t" x="0" y="4.6">' + (isPending() ? 'chờ bốc' : 'trống') + '</text>';
  else it.pids.forEach(function(pid, j){ if (j) inner += '<text class="sep" x="0" y="4.6">/</text>'; inner += segHTML(pid, k, fmtId); });
  var attrs = empty ? ' data-slot="' + it.slot.id + '"' + (canTarget ? ' tabindex="0" role="button" aria-label="Đưa vào vị trí ' + esc(it.slot.name) + '"' : '') : '';
  return '<g transform="translate(' + r2(it.x) + ' ' + r2(it.y) + ') scale(' + r2(it.s) + ')">' +
    '<g class="card' + (gk ? ' gkc' : '') + (k > 1 ? ' pair' : '') + (empty ? ' card-empty' + (canTarget ? ' target' : '') : '') + (anim ? ' pop' : '') + '"' +
    (anim ? ' style="animation-delay:' + (i * 45) + 'ms"' : '') + attrs + '>' + inner + '</g></g>';
}
function textW(el){ var w = 0; try { w = el.getComputedTextLength(); } catch (e) {} return w || (el.textContent || '').length * 1.8; }
// Lay the names on a card out left to right ("Nam / Khoa") and size the card to fit.
function layoutCard(card){
  var segs = card.querySelectorAll('.seg'), seps = card.querySelectorAll('.sep'), bg = card.querySelector('.cbg');
  var PADX = 1.1, GAP = 1.1, LOCKW = 2.6, sepW = seps.length ? textW(seps[0]) : 0, widths = [], total = 0;
  each(segs, function(seg){ var w = textW(seg.querySelector('.seg-t')) + (seg.classList.contains('locked') ? LOCKW : 0); widths.push(w); total += w + 2 * PADX; });
  if (!segs.length){ var et = card.querySelector('.empty-t'); total = (et ? textW(et) : 4) + 2 * PADX + 1; }
  total += seps.length * (sepW + GAP);
  var x = -total / 2;
  each(segs, function(seg, j){
    var w = widths[j], lockW = seg.classList.contains('locked') ? LOCKW : 0;
    var b = seg.querySelector('.seg-bg'), t = seg.querySelector('.seg-t'), lk = seg.querySelector('.seg-lock');
    b.setAttribute('x', r2(x + .35)); b.setAttribute('width', r2(w + 2 * PADX - .7));
    t.setAttribute('x', r2(x + PADX + (w - lockW) / 2));
    if (lk) lk.setAttribute('transform', 'translate(' + r2(x + PADX + w - 1.9) + ' 2.1)');
    x += w + 2 * PADX;
    if (seps[j]){ seps[j].setAttribute('x', r2(x + (sepW + GAP) / 2)); x += sepW + GAP; }
  });
  bg.setAttribute('x', r2(-total / 2)); bg.setAttribute('width', r2(total));
  return total;
}
// People not on a position yet (or waiting for the scheduled draw) sit in rows under the pitch.
function renderStrip(lay){
  var L0 = lu(), wait = L0.waiting.filter(player), lyr = $('#lyr-strip');
  if (!wait.length){ lyr.innerHTML = ''; return lay.bottom; }
  var top = lay.stripTop, half = (lay.maxX - lay.minX) / 2 - 3;
  var lbl = isPending() ? 'CHỜ BỐC THĂM · ' + whenFull(new Date(L0.schedule.at)) : 'CHƯA XẾP VỊ TRÍ · ' + wait.length;
  var h = '<line class="strip-line" x1="' + r2(-half) + '" y1="' + r2(top + 3) + '" x2="' + r2(-19) + '" y2="' + r2(top + 3) + '"/>' +
    '<line class="strip-line" x1="19" y1="' + r2(top + 3) + '" x2="' + r2(half) + '" y2="' + r2(top + 3) + '"/>' +
    '<text class="strip-lbl" x="0" y="' + r2(top + 4.1) + '">' + esc(lbl) + '</text>';
  wait.forEach(function(pid){ h += '<g class="wchip card"><rect class="cbg" x="-5" y="1.2" width="10" height="4.6" rx="1.2"/>' + segHTML(pid, 1, lay.fmt) + '</g>'; });
  lyr.innerHTML = h;
  var chips = lyr.querySelectorAll('.wchip'), rows = [[]], rowW = [0], GAPX = 2, maxW = 2 * half;
  each(chips, function(chip){
    var w = layoutCard(chip), r = rows.length - 1;
    if (rows[r].length && rowW[r] + GAPX + w > maxW){ rows.push([]); rowW.push(0); r++; }
    rowW[r] += (rows[r].length ? GAPX : 0) + w; rows[r].push({ el: chip, w: w });
  });
  rows.forEach(function(row, r){
    var x = -rowW[r] / 2, y = top + 4.4 + r * 7.5;
    row.forEach(function(c){ c.el.setAttribute('transform', 'translate(' + r2(x + c.w / 2) + ' ' + r2(y) + ')'); x += c.w + GAPX; });
  });
  return top + 4.4 + (rows.length - 1) * 7.5 + 7;
}

function renderPitch(){
  var svg = ensureSVG(); if (!svg) return;
  svg.classList.toggle('is-view', !editable());
  svg.classList.toggle('is-wait', isPending());
  var key = view3d ? '3d' : '2d';
  if (svgBuilt !== key){ $('#lyr-pitch').innerHTML = pitchSVG(); svgBuilt = key; }
  var active = document.activeElement, focusPid = active && active.closest && active.closest('.seg') ? active.closest('.seg').getAttribute('data-pid') : null;
  var lay = layout(), canTarget = !!(editable() && selected && !isPending()), anim = ui.animCards;
  ui.animCards = false;
  var h = '';
  lay.items.forEach(function(it, i){ h += cardHTML(it, i, anim, canTarget, lay.fmt); });
  var lyr = $('#lyr-cards'); lyr.innerHTML = h;
  each(lyr.querySelectorAll('.card'), layoutCard);
  var bottom = renderStrip(lay);
  svg.setAttribute('viewBox', [lay.minX, lay.minY, lay.maxX - lay.minX, bottom - lay.minY].map(r2).join(' '));
  var L0 = lu(), nPlaced = Object.keys(L0.slots).reduce(function(a, k){ return a + L0.slots[k].length; }, 0);
  svg.setAttribute('aria-label', 'Sơ đồ ' + F().name + ', ' + nPlaced + ' người có vị trí' + (L0.waiting.length ? ', ' + L0.waiting.length + ' người chưa xếp' : ''));
  if (focusPid){ var again = svg.querySelector('.seg[data-pid="' + focusPid + '"]'); if (again) again.focus(); }
}

// ---------- rendering: shell ----------
var ICON = {
  dice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="m15 15 6 6"/><path d="M4 4l5 5"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
  lock: '<svg class="lock-mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
};

function mountShell(){
  $('#app').className = 'app';
  $('#app').innerHTML =
    '<header class="top"><div><div class="eyebrow">Bốc thăm vị trí</div><h1 id="team-h"></h1><div class="meta-strong" id="meta-match"></div><div class="meta" id="meta"></div></div>' +
      '<div class="top-right"><span class="badge" id="badge" hidden></span><button type="button" class="btn btn-sm" id="cap-btn" data-act="cap-open"></button></div></header>' +
    '<main class="main">' +
      '<section class="board" aria-label="Sơ đồ chiến thuật">' +
        '<div class="pitch-wrap" id="pitch-wrap"><div class="view-toggle seg-toggle" role="group" aria-label="Góc nhìn sân"><button type="button" id="v3d">3D</button><button type="button" id="v2d">2D</button></div></div>' +
        '<div id="selbar-slot"></div>' +
        '<div class="status" id="status"></div>' +
        '<div class="actions" id="actions"></div>' +
        '<div id="copy-slot"></div>' +
        '<div class="me" id="me"></div>' +
      '</section>' +
      '<section class="panel">' +
        '<div class="tabs" role="tablist"><button type="button" role="tab" id="tab-match" data-tab="match">Trận này</button><button type="button" role="tab" id="tab-roster" data-tab="roster">Cầu thủ <span class="cnt" id="cnt-roster"></span></button><button type="button" role="tab" id="tab-hist" data-tab="hist">Lịch sử <span class="cnt" id="cnt-hist"></span></button></div>' +
        '<div class="tabpane" id="pane-match" role="tabpanel" aria-labelledby="tab-match"></div>' +
        '<div class="tabpane" id="pane-roster" role="tabpanel" aria-labelledby="tab-roster"></div>' +
        '<div class="tabpane" id="pane-hist" role="tabpanel" aria-labelledby="tab-hist"></div>' +
      '</section>' +
    '</main>' +
    '<div id="cap"></div>' +
    '<div class="savebar" id="savebar" hidden></div>' +
    '<div class="toast" id="toast" role="status" aria-live="polite" hidden></div>';

  $('#v3d').addEventListener('click', function(){ setView(true); });
  $('#v2d').addEventListener('click', function(){ setView(false); });
  document.querySelector('.tabs').addEventListener('click', function(e){
    var b = e.target.closest('[data-tab]'); if (!b) return;
    ui.tab = b.getAttribute('data-tab'); ui.armedDel = null; ssSet(SS_UI, JSON.stringify({ tab: ui.tab })); render();
  });
  $('#app').addEventListener('click', onAppClick);
  $('#app').addEventListener('change', onAppChange);
  $('#app').addEventListener('keydown', function(e){
    if (e.key === 'Escape' && ui.capOpen){ closeCaptain(); return; }
    if (e.key === 'Enter' && e.target && (e.target.id === 'add-num' || e.target.id === 'add-name')){ e.preventDefault(); doAdd(); }
  });
}
function setView(on){ view3d = on; lsSet(LS_VIEW, on ? '1' : '0'); render(); }

function onAppClick(e){
  if (e.target.classList && e.target.classList.contains('sheet')){ closeCaptain(); return; }
  var b = e.target.closest('[data-act]'); if (!b) return;
  var act = b.getAttribute('data-act'), arg = b.getAttribute('data-arg');
  if (act === 'roll') roll();
  else if (act === 'confirm') confirmLineup();
  else if (act === 'undo') undoConfirm();
  else if (act === 'copy') copyLineup();
  else if (act === 'copy-close'){ ui.copyText = null; renderActions(); }
  else if (act === 'fmt'){ var first = Object.keys(FORMATIONS).filter(function(k){ return FORMATIONS[k].fmt === arg; })[0]; setFormation(first); }
  else if (act === 'formation') setFormation(arg);
  else if (act === 'lock') toggleLock(arg);
  else if (act === 'unselect'){ selected = null; render(); }
  else if (act === 'save') save(null, 'Cập nhật đội hình');
  else if (act === 'add') doAdd();
  else if (act === 'sched-set') setSchedule();
  else if (act === 'sched-cancel') cancelSchedule();
  else if (act === 'cap-open') openCaptain();
  else if (act === 'cap-close') closeCaptain();
  else if (act === 'cap-connect') connectGitHub();
  else if (act === 'cap-local') localEdit();
  else if (act === 'cap-export') exportJSON();
  else if (act === 'cap-exit') exitCaptain();
  else if (act === 'all' || act === 'none'){ state.players.forEach(function(p){ p.here = act === 'all'; }); rosterChanged(); commit(); }
  else if (act === 'del'){
    if (ui.armedDel !== 'p:' + arg){ ui.armedDel = 'p:' + arg; renderRoster(); return; }
    state.players = state.players.filter(function(p){ return p.id !== arg; }); ui.armedDel = null; rosterChanged(); commit();
  }
  else if (act === 'clear-sample'){
    if (ui.armedDel !== 'sample'){ ui.armedDel = 'sample'; renderRoster(); return; }
    var keepKick = lu().kickoff, keepVenue = lu().venue;
    state.players = []; state.history = []; state.matchNo = 0; state.sample = false; state.team = 'Đội bóng';
    state.lineup = blankLineup(); state.lineup.kickoff = keepKick; state.lineup.venue = keepVenue;
    ui.armedDel = null; commit();
  }
  else if (act === 'mdel'){
    if (ui.armedDel !== 'm:' + arg){ ui.armedDel = 'm:' + arg; renderHistory(); return; }
    deleteMatch(arg);
  }
  else if (act === 'hclear'){
    if (ui.armedDel !== 'hall'){ ui.armedDel = 'hall'; renderHistory(); return; }
    clearHistory();
  }
}
function onAppChange(e){
  var t = e.target, pid = t.getAttribute('data-pid');
  if (t.id === 'me-sel'){ ui.me = t.value; lsSet(LS_ME, t.value); render(); return; }
  if (!editable()) return;
  if (t.id === 'team-name'){ var v = t.value.trim(); if (v){ state.team = v.slice(0, 40); rosterChanged(); commit('roster'); } else t.value = state.team; return; }
  if (t.id === 'kick-at'){ lu().kickoff = parseKick(t.value) ? t.value.slice(0, 16) : ''; markEdited(); commit('match'); return; }
  if (t.id === 'venue'){ lu().venue = t.value.trim().slice(0, 60); markEdited(); commit('match'); return; }
  if (!pid) return;
  var p = player(pid); if (!p) return;
  if (t.classList.contains('here')){ p.here = t.checked; t.closest('.prow').classList.toggle('off', !p.here); rosterChanged(); commit('roster'); return; }
  if (t.classList.contains('pref')){ p.pref = PREF_NAME[t.value] ? t.value : 'any'; rosterChanged(); commit('roster'); return; }
  if (t.classList.contains('no')){
    var n = parseInt(t.value, 10), other = state.players.filter(function(q){ return q.num === n && q.id !== pid; })[0];
    if (isNaN(n) || n < 0 || n > 99){ ui.rosterErr = 'Số áo phải từ 0 đến 99.'; t.value = p.num; renderRosterErr(); return; }
    if (other){ ui.rosterErr = 'Số ' + n + ' đã có người mặc (' + other.name + ').'; t.value = p.num; renderRosterErr(); return; }
    p.num = n; ui.rosterErr = ''; rosterChanged(); commit('roster'); return;
  }
  if (t.classList.contains('name')){
    var nm = t.value.trim(); if (!nm){ t.value = p.name; return; }
    p.name = nm.slice(0, 40); rosterChanged(); commit('roster'); return;
  }
}
function doAdd(){
  var ni = $('#add-num'), na = $('#add-name'); if (!ni || !na) return;
  var err = addPlayer(ni.value, na.value);
  ui.rosterErr = err;
  if (!err){ commit(); var ni2 = $('#add-num'); if (ni2) ni2.focus(); }
  else renderRosterErr();
}

// ---------- rendering: parts ----------
function render(){
  renderHeader(); renderPitch(); renderSelbar(); renderActions(); renderMe(); renderTabs();
  if (keepPane !== 'match') renderMatch();
  if (keepPane !== 'roster') renderRoster(); else updateRosterCounts();
  renderHistory(); renderSavebar();
}

function matchLine(){
  var L0 = lu(), ko = parseKick(L0.kickoff);
  return 'Trận ' + currentNo() + ' · ' + (ko ? dayShort(ko) + ' · ' + hm(ko) : 'chưa hẹn giờ đá') + (L0.venue ? ' · ' + L0.venue : '');
}
function renderHeader(){
  var loading = store.kind === 'loading';
  $('#team-h').textContent = loading ? 'Đang tải…' : state.team;
  $('#meta-match').textContent = loading ? '' : matchLine();
  var L0 = lu(), f = F(), fm = fmtOf(L0.f), n = state.players.filter(function(p){ return p.here; }).length;
  var shared = Object.keys(L0.slots).filter(function(k){ return L0.slots[k].length > 1; }).length;
  $('#meta').textContent = loading ? '' : fm.label + ' · ' + f.name + ' · ' + n + ' người đi đá' + (shared ? ' · ' + shared + ' vị trí có 2 người' : '') +
    (state.updatedAt ? ' · cập nhật ' + whenFull(new Date(state.updatedAt)) : '');
  var b = $('#badge'), txt = { github: 'Lưu lên GitHub', local: 'Bản thử trên máy này' }[store.kind];
  b.hidden = !txt; b.className = 'badge ' + (store.kind === 'github' ? 'cloud' : 'local'); b.textContent = txt || '';
  if (store.kind === 'github'){ var c = ghCfg(); if (c) b.title = c.owner + '/' + c.repo + ' · ' + c.path; }
  var cb = $('#cap-btn'); cb.hidden = loading || (!editable() && !captainLink() && !hasCaptainSetup());
  cb.textContent = editable() ? 'Cài đặt' : (captainLink() ? 'Đội trưởng' : 'Chế độ đội trưởng');
  $('#v3d').setAttribute('aria-pressed', String(view3d));
  $('#v2d').setAttribute('aria-pressed', String(!view3d));
}

function hasEmptySlot(){ return F().slots.some(function(s){ return !lu().slots[s.id]; }); }
function renderSelbar(){
  var slot = $('#selbar-slot');
  if (!selected || !editable()){ slot.innerHTML = ''; return; }
  var p = player(selected), loc = locOf(selected); if (!p || !loc){ slot.innerHTML = ''; return; }
  var sd = loc.slot ? slotDef(lu().f, loc.slot) : null, locked = lu().locked.indexOf(selected) >= 0;
  var tip = sd ? 'Chạm tên người khác để đổi chỗ' + (hasEmptySlot() ? ', hoặc chạm ô trống để chuyển vào' : '') + '.'
    : 'Chạm tên một người trên sân để đá chung vị trí đó' + (hasEmptySlot() ? ', hoặc chạm ô trống' : '') + '.';
  slot.innerHTML = '<div class="selbar"><span>Đang chọn <b>' + p.num + ' ' + esc(p.name) + '</b> (' + (sd ? esc(sd.name) : 'chưa xếp') + '). ' + tip + '</span>' +
    (sd ? '<button type="button" class="btn btn-sm" data-act="lock" data-arg="' + p.id + '">' + (locked ? 'Bỏ giữ cố định' : 'Giữ cố định vị trí này') + '</button>' : '') +
    '<button type="button" class="btn btn-sm" data-act="unselect">Huỷ chọn</button></div>';
}

function rolledText(){ var L0 = lu(); return L0.rolledAt ? (L0.auto ? 'bốc tự động lúc ' : 'random lúc ') + whenFull(new Date(L0.rolledAt)) : ''; }
function renderActions(){
  var L0 = lu(), st = $('#status'), h = '', rolled = rolledText();
  if (store.kind === 'loading'){ st.innerHTML = '<span>Đang tải đội hình…</span>'; $('#actions').innerHTML = ''; return; }
  if (isPending()){
    h = '<span class="pill wait">Chờ bốc thăm</span><span>Bốc lúc ' + whenFull(new Date(L0.schedule.at)) + ' · <span class="cd">' + countdown(L0.schedule.at - Date.now()) + '</span></span>' + (editable() ? '<button type="button" class="linkbtn" data-act="sched-cancel">Huỷ hẹn</button>' : '');
  } else if (L0.status === 'confirmed'){
    h = '<span class="pill done">Đã chốt</span><span>Trận ' + currentNo() + (rolled ? ' · ' + rolled : '') + '</span>' + (editable() ? '<button type="button" class="linkbtn" data-act="undo">Huỷ chốt</button>' : '');
  } else if (L0.editOf){
    h = '<span class="pill edit">Đang sửa</span><span>Trận ' + currentNo() + ' · bấm Cập nhật để lưu thay đổi</span>';
  } else {
    h = '<span class="pill draft">Nháp</span><span>Trận ' + currentNo() + ' · ' + (rolled || 'chưa random') + (editable() ? '' : ' · chưa chốt') + '</span>';
  }
  st.innerHTML = h;
  var a = '';
  if (editable()){
    var cLabel = L0.status === 'confirmed' ? 'Đã chốt' : (L0.editOf ? 'Cập nhật trận ' + currentNo() : 'Chốt đội hình');
    a += '<button type="button" class="btn btn-primary" data-act="roll"' + (ui.rolling ? ' disabled' : '') + '>' + ICON.dice + (isPending() ? 'Random ngay' : 'Random vị trí') + '</button>';
    a += '<button type="button" class="btn" data-act="confirm"' + (L0.status === 'confirmed' || saving || isPending() ? ' disabled' : '') + '>' + ICON.check + cLabel + '</button>';
  }
  a += '<button type="button" class="btn" data-act="copy">' + ICON.copy + 'Copy gửi nhóm</button>';
  $('#actions').innerHTML = a;
  var cs = $('#copy-slot');
  cs.innerHTML = ui.copyText ? '<div class="copybox"><div class="row"><span>Trình duyệt chặn copy tự động. Chọn hết đoạn dưới rồi copy nhé.</span><button type="button" class="btn btn-sm" data-act="copy-close">Đóng</button></div><textarea id="copy-ta" readonly>' + esc(ui.copyText) + '</textarea></div>' : '';
}

// "Xem vị trí của": each teammate picks their own name (remembered on their device) to see where and when they play.
function renderMe(){
  var box = $('#me');
  if (store.kind === 'loading'){ box.hidden = true; return; }
  box.hidden = false;
  var L0 = lu(), p = player(ui.me), opts = '<option value="">Chọn tên của bạn</option>';
  state.players.slice().sort(function(a, b){ return a.num - b.num; }).forEach(function(q){ opts += '<option value="' + q.id + '"' + (q.id === ui.me ? ' selected' : '') + '>' + q.num + ' · ' + esc(q.name) + '</option>'; });
  var h = '<div class="me-top"><label for="me-sel">Xem vị trí của</label><select class="txt" id="me-sel">' + opts + '</select></div>';
  if (!p){
    box.innerHTML = h + '<p class="me-past">Chọn tên để xem mình đá vị trí nào, trận ngày nào. Máy này sẽ nhớ lựa chọn.</p>';
    return;
  }
  var ko = parseKick(L0.kickoff);
  var when = '<span class="me-when">Trận ' + currentNo() + (ko ? ' · ' + dayShort(ko) + ' lúc ' + hm(ko) : '') + '</span>' + (L0.venue ? ' · ' + esc(L0.venue) : '');
  var body;
  if (!p.here) body = esc(p.name) + ' không có tên đi đá trận này.';
  else if (isPending()) body = 'Chưa bốc thăm. Kết quả có lúc <b>' + whenFull(new Date(L0.schedule.at)) + '</b> (<span class="cd">' + countdown(L0.schedule.at - Date.now()) + '</span>).';
  else {
    var loc = locOf(p.id);
    if (!loc || loc.wait) body = 'Chưa được xếp vị trí.';
    else {
      var sd = slotDef(L0.f, loc.slot), mates = L0.slots[loc.slot].filter(function(x){ return x !== p.id; }).map(function(x){ var q = player(x); return q ? q.num + ' ' + esc(q.name) : ''; });
      body = 'Bạn đá <b>' + esc(sd.name) + '</b> <span class="code r-' + sd.role + (mates.length ? ' sh' : '') + '">' + sd.code + '</span>' +
        (mates.length ? ', chung với ' + mates.join(', ') + '. Ai đến sân trước đá trước.' : '.') +
        (L0.status === 'confirmed' ? '' : ' Đội hình còn là nháp, có thể đổi.');
    }
  }
  h += '<p class="me-out">' + when + '<br>' + body + '</p>';
  var skip = {}; skip[L0.matchId || ''] = 1; skip[L0.editOf || ''] = 1;
  var past = state.history.filter(function(m){ return !skip[m.id] && m.picks[p.id]; }).slice(0, 4).map(function(m){
    var pk = m.picks[p.id], sd2 = pk.b ? { code: 'DB' } : (slotDef(m.f, pk.s) || { code: pk.r });
    return 'T' + m.no + ' ' + entryWhen(m) + ': ' + sd2.code + (pk.sh ? ' (chung)' : '');
  });
  if (past.length) h += '<p class="me-past">Trước đó: ' + esc(past.join(' · ')) + '</p>';
  box.innerHTML = h;
}

function renderTabs(){
  ['match', 'roster', 'hist'].forEach(function(k){
    var b = $('#tab-' + k), on = ui.tab === k;
    b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1;
    $('#pane-' + k).hidden = !on;
  });
  updateRosterCounts();
  $('#cnt-hist').textContent = '(' + state.history.length + ')';
}
function updateRosterCounts(){ $('#cnt-roster').textContent = '(' + state.players.length + ')'; var c = $('#roster-count'); if (c) c.textContent = rosterCountText(); }
function rosterCountText(){ var here = state.players.filter(function(p){ return p.here; }).length; return here + '/' + state.players.length + ' người đi đá hôm nay'; }

function prevHTML(p, role, past){
  if (p.pref === 'gk') return '<span class="prev">TM chuyên</span>';
  var last = (past[p.id] || [])[0];
  if (!last) return '<span class="prev">lần đầu</span>';
  if (last.b) return '<span class="prev">trước: dự bị</span>';
  var ld = slotDef(last.f, last.s) || { code: last.r };
  return '<span class="prev' + (last.r === role ? ' same' : '') + '">trước: <span class="code r-' + last.r + (last.sh ? ' sh' : '') + '">' + esc(ld.code) + '</span></span>';
}

function renderMatch(){
  var pane = $('#pane-match');
  if (store.kind === 'loading'){ pane.innerHTML = '<p class="hint">Đang tải đội hình…</p>'; return; }
  var L0 = lu(), f = F(), ed = editable(), h = '', schedBox = $('#sched-at'), schedVal = schedBox && schedBox.value ? schedBox.value : defaultSchedule();
  var skip = {}; skip[L0.matchId || ''] = 1; skip[L0.editOf || ''] = 1;
  var past = pastByPlayer(state.history.filter(function(m){ return !skip[m.id]; }));
  if (store.error) h += '<div class="note">' + esc(store.error) + '</div>';
  if (store.kind === 'view' && hasCaptainSetup() && !captainLink()) h += '<div class="note info"><span>Đây là link xem, giống anh em thấy. Máy này đã lưu quyền đội trưởng: mở link đội trưởng để random và lưu.</span><button type="button" class="btn btn-sm" data-act="cap-open">Mở chế độ đội trưởng</button></div>';
  else if (store.kind === 'view' && state.players.length) h += '<div class="note info">Đây là đội hình đội trưởng xếp. Chọn tên của bạn ở ô “Xem vị trí của” để biết mình đá đâu.</div>';
  if (store.kind === 'local') h += '<div class="note">Bạn đang sửa bản thử trên máy này. Anh em không thấy thay đổi này. Muốn cả đội thấy thì mở Cài đặt, kết nối GitHub hoặc tải file team.json rồi commit vào repo.</div>';
  // match time + place
  var ko = parseKick(L0.kickoff);
  if (ed){
    h += '<div><h3 class="sec-h">Lịch trận ' + currentNo() + '</h3><div class="grid2">' +
      '<div class="field"><label for="kick-at">Ngày giờ đá</label><input type="datetime-local" class="txt" id="kick-at" value="' + esc(L0.kickoff) + '"></div>' +
      '<div class="field"><label for="venue">Sân</label><input class="txt" id="venue" maxlength="60" placeholder="Ví dụ: Sân số 2" value="' + esc(L0.venue) + '"></div></div></div>';
  } else {
    h += '<div><h3 class="sec-h">Lịch trận ' + currentNo() + '</h3><div class="grid2"><div class="kv"><span>Ngày giờ đá</span>' + (ko ? dayShort(ko) + '/' + ko.getFullYear() + ' lúc ' + hm(ko) : 'Chưa hẹn') + '</div><div class="kv"><span>Sân</span>' + (L0.venue ? esc(L0.venue) : '—') + '</div></div></div>';
  }
  // scheduled draw
  h += '<div><h3 class="sec-h">Bốc thăm hẹn giờ</h3>';
  if (isPending()){
    h += '<div class="sched-row"><span>Sẽ bốc lúc <b>' + whenFull(new Date(L0.schedule.at)) + '</b> · <span class="cd">' + countdown(L0.schedule.at - Date.now()) + '</span></span>' + (ed ? '<button type="button" class="btn btn-sm" data-act="sched-cancel">Huỷ hẹn</button>' : '') + '</div>';
    if (ed) h += '<p class="hint" style="margin-top:8px">Tick đủ người đi đá và lưu trước giờ bốc. Tới giờ, trang tự random và ai mở link cũng thấy cùng một kết quả, kể cả khi bạn không mở trang. Sau đó bấm Chốt đội hình để lưu vào lịch sử.</p>';
  } else if (ed){
    h += '<div class="sched-row"><input type="datetime-local" class="txt" id="sched-at" value="' + esc(schedVal) + '" aria-label="Giờ bốc thăm"><button type="button" class="btn btn-sm" data-act="sched-set">Hẹn giờ</button></div>' +
      '<p class="err" role="alert">' + esc(ui.schedErr || '') + '</p>' +
      '<p class="hint">Hẹn giờ thì anh em chờ tới giờ mới biết vị trí. Không cần hẹn thì cứ bấm Random.</p>';
  } else {
    h += '<p class="hint">' + (L0.auto && L0.rolledAt ? 'Đội hình này được bốc tự động lúc ' + whenFull(new Date(L0.rolledAt)) + '.' : 'Không có hẹn giờ bốc thăm.') + '</p>';
  }
  h += '</div>';
  // formation
  var curFmt = f.fmt;
  h += '<div class="fmt"><div><h3 class="sec-h">Sơ đồ</h3><div class="seg-toggle" role="group" aria-label="Loại sân">' +
    FORMATS.map(function(fm){ return '<button type="button" data-act="fmt" data-arg="' + fm.id + '" aria-pressed="' + (fm.id === curFmt) + '"' + (ed ? '' : ' disabled') + '>' + fm.label.toUpperCase() + '</button>'; }).join('') + '</div></div>' +
    '<div class="chips">' + Object.keys(FORMATIONS).filter(function(k){ return FORMATIONS[k].fmt === curFmt; }).map(function(k){
      return '<button type="button" class="chip" data-act="formation" data-arg="' + k + '" aria-pressed="' + (k === L0.f) + '"' + (ed ? '' : ' disabled') + '>' + FORMATIONS[k].name + '</button>';
    }).join('') + '</div></div>';
  var emptyN = f.slots.filter(function(s){ return !L0.slots[s.id]; }).length;
  if (!isPending()){
    if (ed && L0.waiting.length) h += '<div class="note">Có ' + L0.waiting.length + ' người chưa xếp vị trí. Bấm Random để xếp lại, hoặc chạm tên người đó rồi chạm một vị trí trên sân.</div>';
    else if (emptyN && state.players.some(function(p){ return p.here; })) h += '<div class="note">Thiếu ' + emptyN + ' người so với sơ đồ ' + f.name + '. Chọn sơ đồ ít người hơn hoặc tick thêm cầu thủ đi đá.</div>';
  }
  // positions
  h += '<div><h3 class="sec-h">Vị trí trận này</h3>';
  ROLES.forEach(function(role){
    var ss = f.slots.filter(function(s){ return s.role === role; }).slice().sort(function(a, b){ return a.x - b.x; });
    h += '<div class="group" role="list" aria-label="' + ROLE_NAME[role] + '">';
    ss.forEach(function(s){
      var arr = (L0.slots[s.id] || []).filter(player);
      if (!arr.length){ h += '<div class="lrow" role="listitem"><span class="code r-' + role + '" title="' + esc(s.name) + '">' + s.code + '</span><span></span><span class="empty-row">' + (isPending() ? 'Chờ bốc thăm' : 'Trống') + ' · ' + esc(s.name) + '</span><span></span></div>'; return; }
      arr.forEach(function(pid){
        var p = player(pid);
        var mates = arr.filter(function(x){ return x !== pid; }).map(function(x){ return player(x).name; });
        h += '<div class="lrow' + (ui.me === pid ? ' me-row' : '') + '" role="listitem"><span class="code r-' + role + (arr.length > 1 ? ' sh' : '') + '" title="' + esc(s.name) + '">' + s.code + '</span>' +
          '<span class="num">' + p.num + '</span><span class="nm">' + esc(p.name) + (L0.locked.indexOf(p.id) >= 0 ? ICON.lock : '') + '<small>' + esc(s.name) + (mates.length ? ' · chung với ' + esc(mates.join(', ')) : '') + '</small></span>' + prevHTML(p, role, past) + '</div>';
      });
    });
    h += '</div>';
  });
  if (L0.waiting.length){
    h += '<div class="group" role="list" aria-label="Chưa xếp">';
    L0.waiting.forEach(function(pid){
      var p = player(pid); if (!p) return;
      h += '<div class="lrow' + (ui.me === pid ? ' me-row' : '') + '" role="listitem"><span class="code r-B">' + (isPending() ? '?' : '—') + '</span><span class="num">' + p.num + '</span><span class="nm">' + esc(p.name) + '<small>' + (isPending() ? 'chờ bốc thăm' : 'chưa xếp') + (p.pref === 'gk' ? ' · thủ môn chuyên' : '') + '</small></span>' + prevHTML(p, '', past) + '</div>';
    });
    h += '</div>';
  }
  h += '</div>';
  if (ed) h += '<p class="hint">Người đi đá đông hơn số vị trí thì một số vị trí có 2 người (trên sân 1 áo, tên ghi “Nam / Khoa”): ai đến sân trước đá trước. Máy xếp mỗi người sang nhóm vị trí khác với trận gần nhất họ đá, và người vừa đá chung sẽ được ưu tiên có vị trí riêng. Chạm một tên rồi chạm tên khác để đổi chỗ, kể cả đưa người lên hoặc xuống tuyến. Đổi sơ đồ trong cùng loại sân thì giữ nguyên người, chỉ dời sang vị trí gần nhất; đổi loại sân thì random lại. Thủ môn chuyên đặt ở tab Cầu thủ.</p>';
  pane.innerHTML = h;
}

function renderRosterErr(){ var e = $('#roster-err'); if (e) e.textContent = ui.rosterErr || ''; }

function renderRoster(){
  var ed = editable(), h = '';
  if (ed){
    h += '<div class="field"><label for="team-name">Tên đội</label><input class="txt" id="team-name" maxlength="40" value="' + esc(state.team) + '"></div>';
    if (state.sample) h += '<div class="note"><span>Đây là danh sách mẫu. Sửa tên và số áo cho đúng cầu thủ trong đội, hoặc xoá hết để nhập từ đầu.</span><button type="button" class="btn btn-sm' + (ui.armedDel === 'sample' ? ' del arm' : '') + '" data-act="clear-sample">' + (ui.armedDel === 'sample' ? 'Bấm lần nữa để xoá hết' : 'Xoá danh sách mẫu') + '</button></div>';
  }
  h += '<div class="rowtools"><span id="roster-count">' + rosterCountText() + '</span>' + (ed && state.players.length ? '<span><button type="button" class="linkbtn" data-act="all">Chọn cả đội</button> · <button type="button" class="linkbtn" data-act="none">Bỏ chọn hết</button></span>' : '') + '</div>';
  h += '<div class="roster"><div class="prow head"><span>Đi</span><span style="text-align:center">Số áo</span><span>Tên</span><span class="pref-h">Vai trò</span><span></span></div>';
  if (!state.players.length) h += '<p class="hint" style="padding:10px 0">' + (ed ? 'Chưa có cầu thủ nào. Thêm ở ô bên dưới.' : 'Đội trưởng chưa nhập danh sách.') + '</p>';
  state.players.forEach(function(p){
    var armed = ui.armedDel === 'p:' + p.id;
    h += '<div class="prow' + (p.here ? '' : ' off') + '">' +
      '<input type="checkbox" class="here" id="here-' + p.id + '" data-pid="' + p.id + '"' + (p.here ? ' checked' : '') + (ed ? '' : ' disabled') + ' aria-label="' + esc(p.name) + ' đi đá">' +
      '<input class="txt no" id="num-' + p.id + '" data-pid="' + p.id + '" inputmode="numeric" maxlength="2" value="' + p.num + '"' + (ed ? '' : ' readonly') + ' aria-label="Số áo của ' + esc(p.name) + '">' +
      '<input class="txt name" id="name-' + p.id + '" data-pid="' + p.id + '" maxlength="40" value="' + esc(p.name) + '"' + (ed ? '' : ' readonly') + ' aria-label="Tên">' +
      (ed ? '<select class="txt pref" id="pref-' + p.id + '" data-pid="' + p.id + '" aria-label="Vai trò của ' + esc(p.name) + '">' + PREFS.map(function(o){ return '<option value="' + o[0] + '"' + (p.pref === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>'
          : '<span class="pref-t">' + PREF_NAME[p.pref] + '</span>') +
      (ed ? '<button type="button" class="del' + (armed ? ' arm' : '') + '" data-act="del" data-arg="' + p.id + '" aria-label="Xoá ' + esc(p.name) + '">' + (armed ? 'Xoá?' : '✕') + '</button>' : '<span></span>') +
      '</div>';
  });
  h += '</div>';
  if (ed){
    h += '<div><div class="addrow"><input class="txt no" id="add-num" inputmode="numeric" maxlength="2" placeholder="Số" aria-label="Số áo người mới"><input class="txt" id="add-name" maxlength="40" placeholder="Tên (ví dụ: Hoàng)" aria-label="Tên người mới"><button type="button" class="btn btn-sm" data-act="add">Thêm</button></div><p class="err" id="roster-err" role="alert">' + esc(ui.rosterErr || '') + '</p></div>';
    h += '<p class="hint"><b>Thủ môn chuyên</b>: có mặt là bắt gôn, vị trí thủ môn không bị random (2 người thì cả hai chung vị trí thủ môn). <b>Không bắt gôn</b>: vẫn random nhưng không bao giờ bị xếp vào gôn. Bỏ tick ai vắng hôm nay.</p>';
  }
  $('#pane-roster').innerHTML = h;
}

function renderHistory(){
  var hist = state.history, h = '', ed = editable();
  if (!hist.length){
    $('#pane-hist').innerHTML = '<div><h3 class="sec-h">Ai đá vị trí gì</h3><p class="hint">Chưa có trận nào được chốt. Random xong bấm <b>Chốt đội hình</b> để lưu trận. Từ trận sau, máy sẽ xếp mỗi người sang vị trí khác với trận gần nhất họ đá.</p></div>';
    return;
  }
  var cols = hist.slice(0, 10);
  h += '<div><h3 class="sec-h">Ai đá vị trí gì</h3><div class="hwrap"><table class="rot"><thead><tr><th scope="col">Cầu thủ</th>' +
    cols.map(function(m){ var d = parseKick(m.kickoff); return '<th scope="col">T' + m.no + '<small>' + (d ? dm(d) : isoDay(m.date)) + '</small></th>'; }).join('') + '</tr></thead><tbody>';
  state.players.slice().sort(function(a, b){ return a.num - b.num; }).forEach(function(p){
    h += '<tr' + (ui.me === p.id ? ' class="me-row"' : '') + '><td><span class="num">' + p.num + '</span>' + esc(shortName(p.name)) + '</td>';
    cols.forEach(function(m){
      var pk = m.picks[p.id];
      if (!pk) h += '<td><span class="dash" title="Vắng">—</span></td>';
      else if (pk.b) h += '<td><span class="code r-B" title="Dự bị">DB</span></td>';
      else { var sd = slotDef(m.f, pk.s) || { code: pk.r, name: ROLE_NAME[pk.r] }; h += '<td><span class="code r-' + pk.r + (pk.sh ? ' sh' : '') + '" title="' + esc(sd.name) + (pk.sh ? ' · đá chung' : '') + '">' + esc(sd.code) + '</span></td>'; }
    });
    h += '</tr>';
  });
  h += '</tbody></table></div><p class="hint" style="margin-top:8px">Màu theo nhóm: <span class="code r-GK">GK</span> thủ môn, <span class="code r-DF">DF</span> hậu vệ, <span class="code r-MF">MF</span> tiền vệ, <span class="code r-FW">FW</span> tiền đạo. Viền đứt <span class="code r-MF sh">CM</span> là vị trí đá chung 2 người.</p></div>';
  h += '<div><h3 class="sec-h">Các trận đã chốt</h3><div class="mlist">';
  hist.forEach(function(m){
    var n = Object.keys(m.picks).length, armed = ui.armedDel === 'm:' + m.id, ko = parseKick(m.kickoff);
    var when = ko ? dayShort(ko) + '/' + ko.getFullYear() + ' · ' + hm(ko) : isoDay(m.date);
    h += '<div class="mrow"><div><b>Trận ' + m.no + '</b><span>' + when + (m.venue ? ' · ' + esc(m.venue) : '') + '</span>' +
      '<small>' + (FORMATIONS[m.f] ? FORMATIONS[m.f].name : esc(m.f)) + ' · ' + n + ' người' + (m.rolledAt ? ' · random lúc ' + whenFull(new Date(m.rolledAt)) : '') + '</small></div>' +
      (ed ? '<button type="button" class="del' + (armed ? ' arm' : '') + '" data-act="mdel" data-arg="' + m.id + '">' + (armed ? 'Xoá trận này?' : 'Xoá') + '</button>' : '') + '</div>';
  });
  h += '</div></div>';
  if (ed) h += '<div><button type="button" class="btn btn-sm' + (ui.armedDel === 'hall' ? ' del arm' : '') + '" data-act="hclear">' + (ui.armedDel === 'hall' ? 'Bấm lần nữa để xoá toàn bộ' : 'Xoá toàn bộ lịch sử') + '</button></div>';
  $('#pane-hist').innerHTML = h;
}

function renderSavebar(){
  var sb = $('#savebar'); if (!sb) return;
  var show = store.kind === 'github' && (dirty || saving);
  sb.hidden = !show;
  if (show) sb.innerHTML = saving ? '<span>Đang lưu lên GitHub…</span>' : '<span>' + esc(ui.dirtyMsg || 'Có thay đổi chưa lưu lên GitHub.') + '</span><button type="button" class="btn btn-sm" data-act="save">Lưu lên GitHub</button>';
  var tb = $('#toast'); if (tb) tb.style.bottom = show ? '' : 'calc(20px + env(safe-area-inset-bottom,0px))';
}

// Captain settings: connect this browser to the repo so saves write data/team.json.
function renderCaptain(){
  var box = $('#cap'); if (!box) return;
  if (!ui.capOpen){ box.innerHTML = ''; return; }
  var c = ghCfg() || {}, g = guessRepo();
  var owner = c.owner || g.owner, repo = c.repo || g.repo;
  box.innerHTML = '<div class="sheet"><div class="sheet-card" role="dialog" aria-modal="true" aria-labelledby="cap-h">' +
    '<h2 id="cap-h">Chế độ đội trưởng</h2>' +
    '<p>Đội trưởng random, chốt đội hình rồi lưu thẳng vào file <code>' + esc(c.path || DATA_PATH) + '</code> trong repo GitHub. Anh em chỉ cần mở link là xem được, không cần tài khoản.</p>' +
    '<div class="grid2"><div class="field"><label for="cap-owner">Tài khoản GitHub</label><input class="txt" id="cap-owner" autocomplete="off" spellcheck="false" value="' + esc(owner) + '" placeholder="ví dụ: tenban"></div>' +
      '<div class="field"><label for="cap-repo">Tên repo</label><input class="txt" id="cap-repo" autocomplete="off" spellcheck="false" value="' + esc(repo) + '" placeholder="boc-tham-vi-tri"></div></div>' +
    '<div class="grid2"><div class="field"><label for="cap-branch">Nhánh</label><input class="txt" id="cap-branch" autocomplete="off" spellcheck="false" value="' + esc(c.branch || 'main') + '"></div>' +
      '<div class="field"><label for="cap-path">File dữ liệu</label><input class="txt" id="cap-path" autocomplete="off" spellcheck="false" value="' + esc(c.path || DATA_PATH) + '"></div></div>' +
    '<div class="field"><label for="cap-token">Token GitHub</label><input class="txt" id="cap-token" type="password" autocomplete="off" spellcheck="false" placeholder="' + (c.token ? 'Đã lưu token trên máy này (để trống nếu giữ nguyên)' : 'github_pat_…') + '"></div>' +
    '<ol class="steps"><li>Mở <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">trang tạo fine-grained token</a>.</li>' +
      '<li>Repository access: chọn <b>Only select repositories</b> rồi chọn đúng repo này.</li>' +
      '<li>Permissions → Repository permissions → <b>Contents: Read and write</b>. Đặt hạn dùng tuỳ bạn.</li>' +
      '<li>Bấm Generate token, copy rồi dán vào ô trên.</li></ol>' +
    '<p class="err" id="cap-err" role="alert"></p>' +
    '<div class="sheet-actions"><button type="button" class="btn btn-primary" id="cap-connect" data-act="cap-connect">Kết nối GitHub</button>' +
      (store.kind !== 'local' ? '<button type="button" class="btn" data-act="cap-local">Chỉ sửa trên máy này</button>' : '') + '</div>' +
    (editable() ? '<div class="sheet-actions"><button type="button" class="btn btn-sm" data-act="cap-export">Tải file team.json</button><button type="button" class="btn btn-sm" data-act="cap-exit">Thoát chế độ đội trưởng</button></div>' : '') +
    '<p class="hint">Token chỉ lưu trong trình duyệt này và chỉ gửi tới api.github.com. Các trang GitHub Pages cùng tài khoản dùng chung một địa chỉ gốc, nên hãy dùng token chỉ cấp cho repo này và có hạn dùng. Kết nối xong, trang dùng dữ liệu đang có trên GitHub.</p>' +
    '<div class="sheet-actions end"><button type="button" class="btn btn-sm" data-act="cap-close">Đóng</button></div>' +
    '</div></div>';
}

// Countdown + the moment the scheduled draw happens while the page is open.
function tick(){
  if (!isPending() || store.kind === 'loading') return;
  var left = lu().schedule.at - Date.now();
  if (left <= 0){ checkSchedule(true); return; }
  each(document.querySelectorAll('.cd'), function(el){ el.textContent = countdown(left); });
}

boot();
})();
