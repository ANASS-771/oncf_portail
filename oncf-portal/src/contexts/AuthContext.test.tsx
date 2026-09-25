import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import type { AuthResponse } from '../types';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

const VALID_AUTH: AuthResponse = {
  token: 'fake-token',
  clientCode: 'CLI001',
  nomClient: 'Client Test',
  isAdmin: false,
  isAgent: false,
  mustChangePwd: false,
  expiresAt: '2027-01-01T00:00:00Z',
};

const ADMIN_AUTH: AuthResponse = {
  ...VALID_AUTH,
  clientCode: '',
  nomClient: '',
  isAdmin: true,
};

const AGENT_AUTH: AuthResponse = {
  ...VALID_AUTH,
  isAgent: true,
};

beforeEach(() => sessionStorage.clear());

describe('initial state', () => {
  it('is logged out with empty values by default', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.clientCode).toBe('');
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.userRole).toBe('client');
  });

  it('reads existing session from sessionStorage on mount', () => {
    sessionStorage.setItem('isLoggedIn', '1');
    sessionStorage.setItem('clientCode', 'TEST001');
    sessionStorage.setItem('clientName', 'Société Test');
    sessionStorage.setItem('isAdmin', '1');
    sessionStorage.setItem('userRole', 'admin');

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.clientCode).toBe('TEST001');
    expect(result.current.clientName).toBe('Société Test');
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.userRole).toBe('admin');
  });
});

describe('setAuth', () => {
  it('marks user as logged in and stores values in state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => { result.current.setAuth(VALID_AUTH); });
    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.clientCode).toBe('CLI001');
    expect(result.current.clientName).toBe('Client Test');
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.userRole).toBe('client');
  });

  it('writes all values to sessionStorage', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => { result.current.setAuth(VALID_AUTH); });
    expect(sessionStorage.getItem('isLoggedIn')).toBe('1');
    expect(sessionStorage.getItem('clientCode')).toBe('CLI001');
    expect(sessionStorage.getItem('clientName')).toBe('Client Test');
    expect(sessionStorage.getItem('isAdmin')).toBe('0');
    expect(sessionStorage.getItem('userRole')).toBe('client');
  });

  it('sets userRole to admin when isAdmin is true', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => { result.current.setAuth(ADMIN_AUTH); });
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.userRole).toBe('admin');
    expect(sessionStorage.getItem('userRole')).toBe('admin');
  });

  it('sets userRole to agent when isAgent is true and isAdmin is false', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => { result.current.setAuth(AGENT_AUTH); });
    expect(result.current.userRole).toBe('agent');
    expect(sessionStorage.getItem('userRole')).toBe('agent');
  });
});

describe('clearAuth', () => {
  it('resets state to defaults', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => { result.current.setAuth(VALID_AUTH); });
    act(() => { result.current.clearAuth(); });
    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.clientCode).toBe('');
    expect(result.current.isAdmin).toBe(false);
  });

  it('clears sessionStorage', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => { result.current.setAuth(VALID_AUTH); });
    act(() => { result.current.clearAuth(); });
    expect(sessionStorage.getItem('isLoggedIn')).toBeNull();
    expect(sessionStorage.getItem('clientCode')).toBeNull();
  });
});

describe('impersonate', () => {
  it('updates clientCode and clientName in state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => { result.current.setAuth(ADMIN_AUTH); });
    act(() => { result.current.impersonate('MAER001', 'Maersk Morocco'); });
    expect(result.current.clientCode).toBe('MAER001');
    expect(result.current.clientName).toBe('Maersk Morocco');
    expect(result.current.isAdmin).toBe(true); // admin status unchanged
  });

  it('writes impersonated values to sessionStorage', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => { result.current.setAuth(ADMIN_AUTH); });
    act(() => { result.current.impersonate('MAER001', 'Maersk Morocco'); });
    expect(sessionStorage.getItem('clientCode')).toBe('MAER001');
    expect(sessionStorage.getItem('clientName')).toBe('Maersk Morocco');
  });
});

describe('clearImpersonation', () => {
  it('resets clientCode and clientName to empty without affecting admin status', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => { result.current.setAuth(ADMIN_AUTH); });
    act(() => { result.current.impersonate('MAER001', 'Maersk Morocco'); });
    act(() => { result.current.clearImpersonation(); });
    expect(result.current.clientCode).toBe('');
    expect(result.current.clientName).toBe('');
    expect(result.current.isAdmin).toBe(true);
  });

  it('removes clientCode and clientName from sessionStorage', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => { result.current.setAuth(ADMIN_AUTH); });
    act(() => { result.current.impersonate('MAER001', 'Maersk Morocco'); });
    act(() => { result.current.clearImpersonation(); });
    expect(sessionStorage.getItem('clientCode')).toBeNull();
    expect(sessionStorage.getItem('clientName')).toBeNull();
  });
});
