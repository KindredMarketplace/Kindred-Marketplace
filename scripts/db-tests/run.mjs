import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
const db = new PGlite();
await db.exec(fs.readFileSync('fixture.sql','utf8'));
await db.exec(fs.readFileSync('migration.sql','utf8'));
// post-migration test setup (as superuser)
await db.exec(`
  update public.cna_profiles set experience_hours = 2000 where user_id in ('00000000-0000-0000-0000-0000000000e1','00000000-0000-0000-0000-0000000000e2');
  insert into public.cna_verifications (cna_id, type, status, expires_at) values
   ('00000000-0000-0000-0000-0000000000e1','l2bg','verified','2030-01-01'),
   ('00000000-0000-0000-0000-0000000000e1','identity','verified',null),
   ('00000000-0000-0000-0000-0000000000e1','insurance','verified','2030-01-01');
  insert into public.memberships (user_id, role, status, plan_key, current_period_end) values
   ('00000000-0000-0000-0000-0000000000c1','client','active','family_standard', now() + interval '20 days');
  grant all on all tables in schema public to anon, authenticated;
`);
const results = [];
async function as(uid, sql) {
  await db.exec('reset role');
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [uid ?? '']);
  await db.exec(uid ? 'set role authenticated' : 'set role anon');
  try { return (await db.query(sql)).rows; } catch (e) { return { error: e.message }; } finally { await db.exec('reset role'); }
}
function check(name, ok, detail) { results.push({ name, ok: !!ok, detail }); }
const A='00000000-0000-0000-0000-00000000000a', FM='00000000-0000-0000-0000-0000000000c1', FF='00000000-0000-0000-0000-0000000000c2', L='00000000-0000-0000-0000-0000000000e1', B='00000000-0000-0000-0000-0000000000e2', P='00000000-0000-0000-0000-0000000000e3';

// Founding backfill: both approved caregivers got founding comps, pending did not
const founding = (await db.query(`select user_id, status, founding, startup_fee_waived from public.memberships where founding order by user_id`)).rows;
check('P5a founding granted to approved caregivers only', founding.length === 2 && founding.every(r => r.status === 'comped' && r.startup_fee_waived), founding);

// P2: anon reads zero cna_profiles rows
const anonRows = await as(null, 'select * from public.cna_profiles');
check('P2 anon cannot read cna_profiles', Array.isArray(anonRows) && anonRows.length === 0, anonRows);
const anonVer = await as(null, 'select * from public.cna_verifications');
check('anon cannot read cna_verifications', Array.isArray(anonVer) && anonVer.length === 0, anonVer);

// P1/P3: anon browse shows only listed (Lisa), redacted
const anonBrowse = await as(null, 'select * from public.browse_caregivers()');
check('P3 browse shows only listed caregivers', Array.isArray(anonBrowse) && anonBrowse.length === 1, anonBrowse);
check('locked browse hides the real user id', anonBrowse[0] && anonBrowse[0].user_id !== L, anonBrowse[0]?.user_id);
check('P1 anon browse redacted', anonBrowse[0] && anonBrowse[0].display_name === 'L' && anonBrowse[0].last_name === null && anonBrowse[0].photo_url === null && anonBrowse[0].identity_unlocked === false, anonBrowse[0]);
check('P1 browse never returns application data', anonBrowse[0] && !('application_notes' in anonBrowse[0]) && !('license_number' in anonBrowse[0]), Object.keys(anonBrowse[0] ?? {}));

const freeBrowse = await as(FF, 'select * from public.browse_caregivers()');
check('P1 non-member family redacted', freeBrowse[0]?.display_name === 'L' && freeBrowse[0]?.last_name === null, freeBrowse);
const memberBrowse = await as(FM, 'select * from public.browse_caregivers()');
check('member family sees full identity', memberBrowse[0]?.display_name === 'Lisa' && memberBrowse[0]?.last_name === 'Nguyen' && memberBrowse[0]?.identity_unlocked === true, memberBrowse);

// Table access
const freeTable = await as(FF, 'select user_id from public.cna_profiles');
check('non-member family cannot read cna_profiles table', Array.isArray(freeTable) && freeTable.length === 0, freeTable);
const memberTable = await as(FM, 'select user_id from public.cna_profiles');
check('member family cannot read the raw cna_profiles table', Array.isArray(memberTable) && memberTable.length === 0, memberTable);
const memberCards = await as(FM, `select user_id, display_name from public.caregiver_cards(array['${L}','${B}','${P}']::uuid[])`);
check('member family gets safe cards for listed caregivers only', Array.isArray(memberCards) && memberCards.length === 1 && memberCards[0].display_name === 'Lisa', memberCards);
const memberNotes = await as(FM, `select application_notes from public.cna_profiles where user_id = '${L}'`);
check('member family cannot read application notes', Array.isArray(memberNotes) && memberNotes.length === 0, memberNotes);
const selfRow = await as(P, 'select user_id from public.cna_profiles');
check('caregiver reads own row', Array.isArray(selfRow) && selfRow.length === 1 && selfRow[0].user_id === P, selfRow);
const adminRows = await as(A, 'select user_id from public.cna_profiles');
check('admin reads all', Array.isArray(adminRows) && adminRows.length === 3, adminRows);

// Jobs
const benJobsTable = await as(B, 'select id from public.jobs');
check('non-listed caregiver cannot read jobs table', Array.isArray(benJobsTable) && benJobsTable.length === 0, benJobsTable);
const benPreview = await as(B, 'select street_address, details_unlocked, city from public.browse_open_jobs()');
check('non-listed caregiver gets redacted job preview', benPreview[0]?.street_address === null && benPreview[0]?.details_unlocked === false && benPreview[0]?.city === 'Gainesville', benPreview);
const lisaPreview = await as(L, 'select street_address, details_unlocked from public.browse_open_jobs()');
check('listed caregiver sees address', lisaPreview[0]?.street_address === '123 Secret St' && lisaPreview[0]?.details_unlocked === true, lisaPreview);
const anonJobs = await as(null, 'select street_address from public.browse_open_jobs()');
check('anon job preview redacted', anonJobs[0]?.street_address === null, anonJobs);

// Apply gating
const benApply = await as(B, `insert into public.job_applications (job_id, cna_id) values ('11111111-1111-1111-1111-111111111111','${B}') returning id`);
check('non-listed caregiver cannot apply', benApply.error, benApply);
const lisaApply = await as(L, `insert into public.job_applications (job_id, cna_id) values ('11111111-1111-1111-1111-111111111111','${L}') returning id`);
check('listed caregiver can apply', Array.isArray(lisaApply) && lisaApply.length === 1, lisaApply);

// Connected: FF (job owner) now connected to Lisa via application → sees full identity even as non-member
const ffAfter = await as(FF, 'select display_name, last_name from public.browse_caregivers()');
check('connected non-member sees identity of applicant', ffAfter[0]?.display_name === 'Lisa', ffAfter);

// Messaging gate
const ffMsgBen = await as(FF, `insert into public.message_threads (participant_a, participant_b) values ('${FF}','${B}') returning id`);
check('non-member family cannot start thread with stranger', ffMsgBen.error, ffMsgBen);
const fmMsg = await as(FM, `insert into public.message_threads (participant_a, participant_b) values ('${FM}','${L}') returning id`);
check('member family can start thread', Array.isArray(fmMsg) && fmMsg.length === 1, fmMsg);
const benMsg = await as(B, `insert into public.message_threads (participant_a, participant_b) values ('${B}','${FM}') returning id`);
check('caregiver cannot cold-start thread', benMsg.error, benMsg);

// Membership writes blocked for users even with table grant
const selfComp = await as(FF, `insert into public.memberships (user_id, role, status) values ('${FF}','client','comped') returning user_id`);
check('users cannot grant themselves membership', selfComp.error, selfComp);

// my_access
const acc = await as(L, 'select * from public.my_access()');
check('my_access for listed caregiver', acc[0]?.is_listed === true && acc[0]?.founding === true && acc[0]?.is_member === true, acc);
const accP = await as(P, 'select * from public.my_access()');
check('my_access pending caregiver not listed, slots left = 23', accP[0]?.is_listed === false && accP[0]?.founding_slots_left === 23, accP);

// P4 expiry
await db.exec(`update public.memberships set current_period_end = now() - interval '1 day' where user_id = '${FM}'`);
const accFM = await as(FM, 'select is_member from public.my_access()');
check('P4 expired membership is not a membership', accFM[0]?.is_member === false, accFM);
// FM is connected to Lisa via thread now, so unlocked is legit; test with a fresh expired family instead
await db.exec(`insert into public.users values ('00000000-0000-0000-0000-0000000000c3','client','Expired Fam');
  insert into public.memberships (user_id, role, status, current_period_end) values ('00000000-0000-0000-0000-0000000000c3','client','active', now() - interval '1 day')`);
const exp2 = await as('00000000-0000-0000-0000-0000000000c3', 'select display_name, identity_unlocked from public.browse_caregivers()');
check('P4 expired, unconnected family is redacted', exp2[0]?.display_name === 'L' && exp2[0]?.identity_unlocked === false, exp2);

// Expired verification drops caregiver from browse
await db.exec(`update public.cna_verifications set expires_at = '2020-01-01' where cna_id = '${L}' and type = 'insurance'`);
const afterExpiry = await as(null, 'select * from public.browse_caregivers()');
check('expired insurance drops caregiver from browse', Array.isArray(afterExpiry) && afterExpiry.length === 0, afterExpiry);

// P5 cap
await db.exec(`update public.platform_settings set value = '2'::jsonb where key = 'founding_caregiver_cap';
  insert into public.users values ('00000000-0000-0000-0000-0000000000e4','cna','Late Lou');
  insert into public.cna_profiles (user_id, display_name, application_status) values ('00000000-0000-0000-0000-0000000000e4','Lou','submitted');
  update public.cna_profiles set application_status = 'approved' where user_id = '00000000-0000-0000-0000-0000000000e4';`);
const lou = (await db.query(`select * from public.memberships where user_id = '00000000-0000-0000-0000-0000000000e4'`)).rows;
check('P5 founding cap respected (no comp past cap)', lou.length === 0, lou);
await db.exec(`update public.platform_settings set value = '25'::jsonb where key = 'founding_caregiver_cap';
  update public.cna_profiles set application_status = 'submitted' where user_id = '00000000-0000-0000-0000-0000000000e4';
  update public.cna_profiles set application_status = 'approved' where user_id = '00000000-0000-0000-0000-0000000000e4';`);
const lou2 = (await db.query(`select founding from public.memberships where user_id = '00000000-0000-0000-0000-0000000000e4'`)).rows;
check('trigger grants founding on approval when slots remain', lou2.length === 1 && lou2[0].founding, lou2);

// ---------------- exploits found in review (must all FAIL to exploit) ----------------
await db.exec(`insert into public.users values ('00000000-0000-0000-0000-0000000000c4','client','Sneaky Fam'), ('00000000-0000-0000-0000-0000000000e5','cna','Sneaky Cna')`);
const C4='00000000-0000-0000-0000-0000000000c4', E5='00000000-0000-0000-0000-0000000000e5';
// 1. self-approval via own cna_profiles row
await as(C4, `insert into public.cna_profiles (user_id, display_name, application_status, experience_hours) values ('${C4}','Sneak','approved', 9999)`);
const c4row = (await db.query(`select application_status, experience_hours from public.cna_profiles where user_id='${C4}'`)).rows;
check('EXPLOIT 1a: cannot insert own profile as approved', c4row.length === 0 || (c4row[0].application_status !== 'approved' && c4row[0].experience_hours === null), c4row);
const c4m = (await db.query(`select * from public.memberships where user_id='${C4}'`)).rows;
check('EXPLOIT 1b: no founding membership from self-insert', c4m.length === 0, c4m);
await as(E5, `insert into public.cna_profiles (user_id, display_name, application_status) values ('${E5}','Eve','submitted')`);
await as(E5, `update public.cna_profiles set application_status = 'approved', experience_hours = 5000, rating_avg = 5, tier = 'top_rated' where user_id = '${E5}'`);
const e5row = (await db.query(`select application_status, experience_hours, tier from public.cna_profiles where user_id='${E5}'`)).rows;
check('EXPLOIT 1c: cannot update own profile to approved / set hours / tier', e5row[0]?.application_status === 'submitted' && e5row[0]?.experience_hours === null && e5row[0]?.tier === 'new', e5row);
const e5m = (await db.query(`select * from public.memberships where user_id='${E5}'`)).rows;
check('EXPLOIT 1d: no founding membership from self-update', e5m.length === 0, e5m);
// legit apply flow still works
await as(E5, `update public.cna_profiles set headline = 'Hi' where user_id = '${E5}'`);
const e5h = (await db.query(`select headline, application_status from public.cna_profiles where user_id='${E5}'`)).rows;
check('caregiver can still edit their own profile fields', e5h[0]?.headline === 'Hi' && e5h[0]?.application_status === 'submitted', e5h);
// 2. self-verify documents
await as(E5, `insert into public.cna_verifications (cna_id, type, status, expires_at) values ('${E5}','l2bg','verified','2030-01-01'), ('${E5}','identity','verified',null), ('${E5}','insurance','verified','2030-01-01')`);
const e5v = (await db.query(`select status from public.cna_verifications where cna_id='${E5}'`)).rows;
check('EXPLOIT 2a: self-inserted verifications land as pending', e5v.length === 3 && e5v.every(r => r.status === 'pending'), e5v);
await as(E5, `update public.cna_verifications set status = 'verified' where cna_id = '${E5}'`);
const e5v2 = (await db.query(`select status from public.cna_verifications where cna_id='${E5}'`)).rows;
check('EXPLOIT 2b: cannot flip own verification to verified', e5v2.every(r => r.status === 'pending'), e5v2);
const e5acc = await as(E5, 'select is_listed from public.my_access()');
check('EXPLOIT 2c: self-verifier is not listed', e5acc[0]?.is_listed === false, e5acc);
// 3. fake booking as a connection
await db.exec(`insert into public.users values ('00000000-0000-0000-0000-0000000000c5','client','Booker Fam')`);
const C5='00000000-0000-0000-0000-0000000000c5';
await as(C5, `insert into public.bookings (client_id, cna_id) values ('${C5}','${L}')`);
await db.exec(`update public.cna_verifications set expires_at = '2030-01-01' where cna_id = '${L}' and type = 'insurance'`);
const c5browse = await as(C5, 'select display_name, identity_unlocked from public.browse_caregivers()');
check('EXPLOIT 3a: fake booking does not unlock identity', c5browse[0]?.display_name === 'L' && c5browse[0]?.identity_unlocked === false, c5browse);
const c5cards = await as(C5, `select * from public.caregiver_cards(array['${L}']::uuid[])`);
check('EXPLOIT 3b: fake booking does not unlock caregiver_cards', Array.isArray(c5cards) && c5cards.length === 0, c5cards);
// 4. job_id thread bypass
await as(C5, `insert into public.jobs (id, client_id, title) values ('22222222-2222-2222-2222-222222222222','${C5}','Bait job')`);
const c5thread = await as(C5, `insert into public.message_threads (participant_a, participant_b, job_id) values ('${C5}','${L}','22222222-2222-2222-2222-222222222222') returning id`);
check('EXPLOIT 4: posting a job does not let a non-member open a thread', c5thread.error, c5thread);
// 10. blocked threads are not connections
await db.exec(`insert into public.message_threads (participant_a, participant_b, status) values ('${C5}','${L}','blocked')`);
const c5after = await as(C5, 'select identity_unlocked from public.browse_caregivers()');
check('EXPLOIT 10: a blocked thread does not unlock identity', c5after[0]?.identity_unlocked === false, c5after);
// 6. names masked in free text for locked viewers
await db.exec(`update public.cna_profiles set bio = 'Hi, I am Lisa Nguyen. Lisa loves gardening; nguyen family.', headline = 'Lisa cares' where user_id = '${L}'`);
const masked = await as(null, 'select bio, headline from public.browse_caregivers()');
check('locked preview masks the name inside bio/headline', masked[0] && !/lisa|nguyen/i.test(masked[0].bio + masked[0].headline), masked);
const unmasked = await as(FM, `select bio from public.caregiver_cards(array['${L}']::uuid[])`);
check('connected member still sees the real bio', /Lisa Nguyen/.test(unmasked[0]?.bio ?? ''), unmasked);
// verifications are self/admin only
const fmVer = await as(FM, `select * from public.cna_verifications where cna_id = '${L}'`);
check('connected family cannot read verification rows', Array.isArray(fmVer) && fmVer.length === 0, fmVer);

let fail = 0;
for (const r of results) { console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}`); if (!r.ok) { fail++; console.log('      ', JSON.stringify(r.detail)); } }
console.log(`\n${results.length - fail}/${results.length} passed`);
process.exit(fail ? 1 : 0);
