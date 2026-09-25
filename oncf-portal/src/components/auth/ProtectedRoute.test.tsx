import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import ProtectedRoute from './ProtectedRoute';

beforeEach(() => sessionStorage.clear());

function renderProtected(isLoggedIn: boolean) {
  if (isLoggedIn) {
    sessionStorage.setItem('isLoggedIn', '1');
    sessionStorage.setItem('userRole', 'client');
  }
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/" element={<div>Login page</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

describe('ProtectedRoute', () => {
  it('redirects to / when user is not logged in', () => {
    renderProtected(false);
    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('renders the outlet when user is logged in', () => {
    renderProtected(true);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
  });
});
