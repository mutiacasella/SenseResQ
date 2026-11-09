// Pengujian mandiri logika penugasan dengan database tiruan (tanpa MySQL)
const assert = require('node:assert/strict');
const Module = require('module');
const repoPath = require.resolve('../src/modules/volunteer/volunteer.repository');
const realLoad = Module._load;
let scenario = '';
let queries = [];
const fakeConnection = {
  beginTransaction: async () => queries.push('BEGIN'),
  commit: async () => queries.push('COMMIT'),
  rollback: async () => queries.push('ROLLBACK'),
  release: () => queries.push('RELEASE'),
  query: async (sql, args) => {
    queries.push(sql.trim().replace(/\s+/g, ' '));
    if (sql.includes('FROM Volunteer WHERE volunteer_id = ? FOR UPDATE')) {
      return [[{ volunteer_id: 'VOL001', device_id: 'DEV001', is_active: 1 }]];
    }
    if (sql.includes('FROM DeviceAssignment') && sql.includes('volunteer_id = ?') && sql.includes('FOR UPDATE')) {
      return [[{ assignment_id: 7, device_id: 'DEV001' }]];
    }
    if (sql.includes('FROM Device WHERE')) return [[{ device_id: args[0] }]];
    if (sql.includes('FROM DeviceAssignment') && sql.includes('device_id = ?')) {
      return [scenario === 'occupied' ? [{ assignment_id: 8 }] : []];
    }
    return [{ affectedRows: 1 }];
  },
};
const fakePool = { getConnection: async () => fakeConnection, query: (...args) => fakeConnection.query(...args) };
Module._load = function(request, parent, isMain) {
  if (parent?.filename === repoPath && request === '../../config/database') return fakePool;
  return realLoad.call(this, request, parent, isMain);
};
const repo = require(repoPath);
Module._load = realLoad;

(async () => {
  scenario = 'available'; queries = [];
  await repo.updateVolunteer('VOL001', {name:'Rini',device_id:'DEV002'});
  assert(queries.some(q => q.includes('SET ended_at = NOW(3)')));
  assert(queries.some(q => q.includes('INSERT INTO DeviceAssignment')));
  assert(queries.includes('COMMIT'));

  queries = [];
  await repo.updateVolunteer('VOL001', {name:'Rini Baru',device_id:'DEV001'});
  assert(!queries.some(q => q.includes('SET ended_at')));
  assert(!queries.some(q => q.includes('INSERT INTO DeviceAssignment')));

  queries = [];
  await repo.deleteVolunteer('VOL001');
  assert(queries.some(q => q.includes('UPDATE DeviceAssignment SET ended_at')));
  assert(queries.some(q => q.includes('UPDATE Volunteer SET is_active = 0')));

  scenario = 'occupied'; queries = [];
  await assert.rejects(repo.createVolunteer({volunteer_id:'VOL002',name:'Lia',device_id:'DEV002'}), {status:409});
  assert(queries.includes('ROLLBACK'));
  console.log('LULUS: ganti perangkat, edit nama, akhiri penugasan, dan tolak perangkat terpakai.');
})().catch((e) => {console.error(e); process.exitCode = 1;});