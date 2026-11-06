import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isActiveMembership, dollars, fromStripeStatus, statusLabel } from './membership-shared';

const now = new Date('2026-11-05T12:00:00Z');

test('active and comped count only while the period is open (mirrors kindred_internal.is_member)', () => {
  assert.equal(isActiveMembership('active', null, now), true);
  assert.equal(isActiveMembership('comped', '2027-11-05T00:00:00Z', now), true);
  assert.equal(isActiveMembership('comped', '2026-11-01T00:00:00Z', now), false);
  assert.equal(isActiveMembership('past_due', null, now), false);
  assert.equal(isActiveMembership('canceled', null, now), false);
  assert.equal(isActiveMembership('none', null, now), false);
  assert.equal(isActiveMembership(undefined, null, now), false);
});

test('dollars formats whole and fractional amounts', () => {
  assert.equal(dollars(2000), '$20');
  assert.equal(dollars(10000), '$100');
  assert.equal(dollars(1999), '$19.99');
});

test('stripe status mapping', () => {
  assert.equal(fromStripeStatus('active'), 'active');
  assert.equal(fromStripeStatus('trialing'), 'active');
  assert.equal(fromStripeStatus('past_due'), 'past_due');
  assert.equal(fromStripeStatus('unpaid'), 'past_due');
  assert.equal(fromStripeStatus('canceled'), 'canceled');
  assert.equal(fromStripeStatus('incomplete'), 'none');
});

test('founding members are labelled as such', () => {
  assert.equal(statusLabel({ membership_status: 'comped', founding: true, is_member: true }), 'Founding member');
  assert.equal(statusLabel({ membership_status: 'comped', founding: true, is_member: false }), 'Membership ended');
  assert.equal(statusLabel({ membership_status: 'none', founding: false, is_member: false }), 'Not a member yet');
});
