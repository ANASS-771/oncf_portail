import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import AdminRoute from './AdminRoute';

beforeEach(() => sessionStorage.clear());

function renderAdmin(opts: { isLoggedIn: boolean; isAdmin: boolean }) {
  if (opts.isLoggedIn) {
    sessionStorage.setItem('isLoggedIn', '1');
    sessionStorage.setItem('userRole', opts.isAdmin ? 'admin' : 'client');
    sessionStorage.setItem('isAdmin', opts.isAdmin ? '1' : '0');
  }
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/" element={<div>Home</div>} />
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<div>Admin panel</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

describe('AdminRoute', () => {
  it('redirects to / when user is not logged in', () => {
    renderAdmin({ isLoggedIn: false, isAdmin: false });
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.queryByText('Admin panel')).not.toBeInTheDocument();
  });

  it('redirects to / when user is logged in but not admin', () => {
    renderAdmin({ isLoggedIn: true, isAdmin: false });
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.queryByText('Admin panel')).not.toBeInTheDocument();
  });

  it('renders the outlet when user is logged in and is admin', () => {
    renderAdmin({ isLoggedIn: true, isAdmin: true });
    expect(screen.getByText('Admin panel')).toBeInTheDocument();
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
  });
});
