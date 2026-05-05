import { describe, expect, it } from 'vitest';
import { decideRedirect } from './decide-redirect';

describe('decideRedirect', () => {
  it('allows public paths regardless of session', () => {
    expect(decideRedirect({ pathname: '/', hasSession: false })).toEqual({ kind: 'allow' });
    expect(decideRedirect({ pathname: '/', hasSession: true })).toEqual({ kind: 'allow' });
    expect(decideRedirect({ pathname: '/about', hasSession: false })).toEqual({ kind: 'allow' });
  });

  it('redirects anon → /login?next=… for /dashboard/*', () => {
    expect(decideRedirect({ pathname: '/dashboard', hasSession: false })).toEqual({
      kind: 'redirect',
      to: '/login?next=%2Fdashboard',
    });
    expect(decideRedirect({ pathname: '/dashboard/edit/abc', hasSession: false })).toEqual({
      kind: 'redirect',
      to: '/login?next=%2Fdashboard%2Fedit%2Fabc',
    });
  });

  it('redirects anon → /login?next=… for /admin/*', () => {
    expect(decideRedirect({ pathname: '/admin', hasSession: false })).toEqual({
      kind: 'redirect',
      to: '/login?next=%2Fadmin',
    });
  });

  it('redirects anon → /login?next=… for /onboarding/*', () => {
    expect(decideRedirect({ pathname: '/onboarding', hasSession: false })).toEqual({
      kind: 'redirect',
      to: '/login?next=%2Fonboarding',
    });
    expect(decideRedirect({ pathname: '/onboarding/3', hasSession: false })).toEqual({
      kind: 'redirect',
      to: '/login?next=%2Fonboarding%2F3',
    });
  });

  it('allows signed-in users to reach /dashboard and /admin', () => {
    expect(decideRedirect({ pathname: '/dashboard', hasSession: true })).toEqual({ kind: 'allow' });
    expect(decideRedirect({ pathname: '/admin', hasSession: true })).toEqual({ kind: 'allow' });
  });

  it('redirects signed-in users away from /login and /signup', () => {
    expect(decideRedirect({ pathname: '/login', hasSession: true })).toEqual({
      kind: 'redirect',
      to: '/dashboard',
    });
    expect(decideRedirect({ pathname: '/signup', hasSession: true })).toEqual({
      kind: 'redirect',
      to: '/dashboard',
    });
  });

  it('honors a safe `next` when bouncing signed-in users off /login', () => {
    expect(
      decideRedirect({ pathname: '/login', hasSession: true, currentNext: '/dashboard/profile' }),
    ).toEqual({ kind: 'redirect', to: '/dashboard/profile' });
  });

  it('falls back to /dashboard when next is unsafe', () => {
    expect(
      decideRedirect({ pathname: '/login', hasSession: true, currentNext: 'https://evil.com' }),
    ).toEqual({ kind: 'redirect', to: '/dashboard' });
  });

  it('allows anon users to reach /login and /signup', () => {
    expect(decideRedirect({ pathname: '/login', hasSession: false })).toEqual({ kind: 'allow' });
    expect(decideRedirect({ pathname: '/signup', hasSession: false })).toEqual({ kind: 'allow' });
  });
});
