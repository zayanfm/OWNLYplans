const crypto = require('crypto');
const { URL, URLSearchParams } = require('url');
const env = require('../config/env');

const MYINFO_ATTRIBUTES = [
  'uinfin', 'name', 'dob', 'nationality', 'marital', 'employment',
  'occupation', 'cpfbalances', 'noa', 'childrenbirthrecords',
  'hdbownership', 'housingtype',
];
const AUTH_TTL_MS = 10 * 60 * 1000;
const valueOf = (claim, fallback = '') => claim?.value ?? claim?.desc ?? fallback;
const maskNric = (nric = '') => nric.length < 4 ? nric : `${nric.slice(0, 1)}****${nric.slice(-3)}`;

const calculateAge = (dob) => {
  if (!dob) return 0;
  const birthDate = new Date(`${dob}T00:00:00Z`);
  if (Number.isNaN(birthDate.getTime())) return 0;
  const today = new Date();
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const beforeBirthday = today.getUTCMonth() < birthDate.getUTCMonth()
    || (today.getUTCMonth() === birthDate.getUTCMonth() && today.getUTCDate() < birthDate.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
};

const isPrivateIpv4 = (host) => /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host);
const validateReturnUrl = (returnUrl) => {
  const parsed = new URL(returnUrl);
  const isAppScheme = ['frontend:', 'exp:', 'exps:'].includes(parsed.protocol);
  const isLocalWeb = ['http:', 'https:'].includes(parsed.protocol)
    && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || isPrivateIpv4(parsed.hostname));
  if (!isAppScheme && !isLocalWeb) throw new Error('Unsupported app return URL');
  return parsed.toString();
};

class MockPassService {
  constructor() {
    this.pendingStates = new Map();
    this.completedSessions = new Map();
  }

  cleanExpired() {
    const cutoff = Date.now() - AUTH_TTL_MS;
    for (const [key, value] of this.pendingStates) {
      if (value.createdAt < cutoff) this.pendingStates.delete(key);
    }
    for (const [key, value] of this.completedSessions) {
      if (value.createdAt < cutoff) this.completedSessions.delete(key);
    }
  }

  getPublicMockPassUrl(requestOrigin) {
    if (env.MOCKPASS_PUBLIC_URL) return env.MOCKPASS_PUBLIC_URL.replace(/\/$/, '');
    const url = new URL(requestOrigin);
    url.port = String(env.MOCKPASS_PORT);
    return url.toString().replace(/\/$/, '');
  }

  beginAuthorization({ returnUrl, requestOrigin }) {
    this.cleanExpired();
    const safeReturnUrl = validateReturnUrl(returnUrl);
    const state = crypto.randomBytes(24).toString('hex');
    const callbackUrl = `${requestOrigin}/api/auth/mockpass/callback`;
    this.pendingStates.set(state, { returnUrl: safeReturnUrl, callbackUrl, createdAt: Date.now() });

    const authorizationUrl = new URL(`${this.getPublicMockPassUrl(requestOrigin)}/myinfo/v3/authorise`);
    authorizationUrl.search = new URLSearchParams({
      client_id: env.MOCKPASS_CLIENT_ID,
      redirect_uri: callbackUrl,
      attributes: MYINFO_ATTRIBUTES.join(','),
      purpose: 'Create and personalise your OWNLYplan',
      state,
    }).toString();
    return { authorizationUrl: authorizationUrl.toString(), state, provider: '@opengovsg/mockpass', protocol: 'MYINFO_V3' };
  }

  getReturnUrl(state) {
    return this.pendingStates.get(state)?.returnUrl || null;
  }

  async completeAuthorization({ code, state }) {
    this.cleanExpired();
    const pending = this.pendingStates.get(state);
    if (!pending) throw new Error('MockPass login session is invalid or expired');
    this.pendingStates.delete(state);

    const tokenResponse = await fetch(`${env.MOCKPASS_INTERNAL_URL}/myinfo/v3/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code', code, client_id: env.MOCKPASS_CLIENT_ID, redirect_uri: pending.callbackUrl,
      }),
    });
    if (!tokenResponse.ok) throw new Error(`MockPass token exchange failed (${tokenResponse.status})`);

    const tokenPayload = await tokenResponse.json();
    const accessToken = tokenPayload.access_token;
    const jwtPayload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64url').toString('utf8'));
    const personUrl = new URL(`${env.MOCKPASS_INTERNAL_URL}/myinfo/v3/person/${encodeURIComponent(jwtPayload.sub)}/`);
    personUrl.searchParams.set('attributes', MYINFO_ATTRIBUTES.join(','));
    const personResponse = await fetch(personUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!personResponse.ok) throw new Error(`MockPass MyInfo retrieval failed (${personResponse.status})`);

    const profile = this.toOwnlyProfile(jwtPayload.sub, await personResponse.json());
    const sessionId = crypto.randomBytes(24).toString('hex');
    this.completedSessions.set(sessionId, { profile, createdAt: Date.now() });
    return { sessionId, returnUrl: pending.returnUrl };
  }

  consumeSession(sessionId) {
    this.cleanExpired();
    const completed = this.completedSessions.get(sessionId);
    if (!completed) throw new Error('MockPass result is invalid or expired');
    this.completedSessions.delete(sessionId);
    return completed.profile;
  }

  toOwnlyProfile(nric, person) {
    const age = calculateAge(valueOf(person.dob));
    const annualIncome = Number(person.noa?.employment?.value || person.noa?.amount?.value || 0);
    const cpf = person.cpfbalances || {};
    const dependents = (person.childrenbirthrecords || [])
      .filter((child) => child.lifestatus?.code !== 'D')
      .map((child) => ({
        name: valueOf(child.name, 'Dependent'), relation: 'Child', birthDate: valueOf(child.dob),
        nric: maskNric(valueOf(child.birthcertno)),
      }));
    const hdb = person.hdbownership?.[0];
    const housingType = hdb?.hdbtype?.desc || person.housingtype?.desc || 'No HDB ownership record';
    const segment = `${age || 'Unknown age'} · ${valueOf(person.marital, 'Status unavailable')}`;

    return {
      success: true,
      authenticatedAt: new Date().toISOString(),
      authMethod: 'MOCKPASS_MYINFO_V3',
      authProvider: '@opengovsg/mockpass',
      personaId: `mockpass-${nric}`,
      personaName: valueOf(person.name, nric),
      segment,
      user: {
        nric: maskNric(nric), name: valueOf(person.name, nric), age,
        citizenship: valueOf(person.nationality, 'Unavailable'),
        maritalStatus: valueOf(person.marital, 'Unavailable'),
        employment: valueOf(person.occupation, valueOf(person.employment, 'Unavailable')),
        monthlyGrossIncome: Math.round(annualIncome / 12),
        monthlyTakeHome: Math.round((annualIncome / 12) * 0.8),
        cpf: { oa: Number(cpf.oa?.value || 0), sa: Number(cpf.sa?.value || 0), ma: Number(cpf.ma?.value || 0) },
        verified: true,
      },
      partner: null,
      household: {
        segment,
        dependentsCount: dependents.length,
        dependents,
        housing: {
          type: housingType,
          monthlyLoanInstalment: Number(hdb?.monthlyloaninstalment?.value || 0),
          outstandingLoanBalance: Number(hdb?.outstandingloanbalance?.value || 0),
          owners: Number(hdb?.noofowners?.value || 0),
        },
      },
    };
  }

  inviteFamily(members = []) {
    const householdStore = require('../models/householdStore');
    const invited = householdStore.inviteFamilyMembers(undefined, members);
    return { success: true, invitedAt: invited.invitedAt, members: invited.members };
  }

  getFamilyStatus() {
    const householdStore = require('../models/householdStore');
    return { success: true, ...householdStore.getFamilyInviteStatus() };
  }

  linkPartner(partnerDetails) {
    const householdStore = require('../models/householdStore');
    const updated = householdStore.linkPartner(undefined, partnerDetails);
    return { success: true, message: `Partner ${partnerDetails.name || ''} linked successfully`, household: updated };
  }
}

module.exports = new MockPassService();
