import fs from 'fs';
const sql = fs.readFileSync('../backups/us-backup-repka-demo-actual.sql', 'utf8');
const lines = sql.split('\n');
const l = lines.find(
  (x) =>
    x.includes('INSERT INTO public.revisions') &&
    x.includes('2162757204866761786') &&
    x.includes('2162590769230119946'),
);
if (!l) {
  console.error('not found');
  process.exit(1);
}
const prefix = "INSERT INTO public.revisions (data, meta, created_by, created_at, updated_by, updated_at, rev_id, entry_id, links, annotation) VALUES ('";
const i0 = l.indexOf(prefix);
if (i0 < 0) {
  console.error('prefix');
  process.exit(1);
}
const jsonStart = i0 + prefix.length;
const jsonEnd = l.indexOf("', '{", jsonStart);
const jsonStr = l.slice(jsonStart, jsonEnd);
const data = JSON.parse(jsonStr.replace(/''/g, "'"));
console.log('keys', Object.keys(data));
console.log('subsql', data.source_collections?.[0]?.origin?.parameters?.subsql);
const rs = data.result_schema || [];
console.log(
  'result_schema len',
  rs.length,
  'first5',
  rs.slice(0, 5).map((f) => f.guid + ':' + f.calc_mode),
);
console.log(
  'rest',
  rs.slice(2).map((f) => ({ guid: f.guid, type: f.type, cast: f.cast })),
);
