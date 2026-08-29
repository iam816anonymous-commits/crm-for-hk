import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Home, Lock, Mail, Building, User, KeyRound } from 'lucide-react';

export default function LoginView() {
  const [searchParams] = useSearchParams();
  const inviteTokenParam = searchParams.get('token') || '';

  const [isRegister, setIsRegister] = useState(false);
  const [isAcceptInvite, setIsAcceptInvite] = useState(!!inviteTokenParam);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [inviteToken, setInviteToken] = useState(inviteTokenParam);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, registerOrg, acceptInvite } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isAcceptInvite) {
        const res = await acceptInvite({ token: inviteToken, fullName, password });
        if (res.success) {
          navigate('/');
        } else {
          setError(res.error || 'Failed to accept invitation');
        }
      } else if (isRegister) {
        const res = await registerOrg({ organizationName, fullName, email, password });
        if (res.success) {
          navigate('/');
        } else {
          setError(res.error || 'Failed to register organization');
        }
      } else {
        const res = await login(email, password);
        if (res.success) {
          navigate('/');
        } else {
          setError(res.error || 'Invalid credentials');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center space-x-3">
          <div className="bg-blue-600 p-3 rounded-xl text-white shadow-lg">
            <Home className="w-8 h-8" />
          </div>
          <div>
            <h1 className="font-bold text-2xl tracking-wide text-white">PropCRM</h1>
            <p className="text-xs text-slate-400">Communication & Intelligence System</p>
          </div>
        </div>
        <h2 className="mt-6 text-center text-xl font-semibold text-slate-200">
          {isAcceptInvite ? 'Accept User Invitation' : isRegister ? 'Create New Organization' : 'Sign in to your account'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800 py-8 px-4 shadow-2xl rounded-xl sm:px-10 border border-slate-700">
          {error && (
            <div className="mb-4 bg-red-950/80 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {isAcceptInvite && (
              <div>
                <label className="block text-xs font-medium text-slate-300">Invitation Token</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={inviteToken}
                    onChange={(e) => setInviteToken(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-600 rounded-lg bg-slate-900 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter invitation token"
                  />
                </div>
              </div>
            )}

            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-slate-300">Organization Name</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Building className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-600 rounded-lg bg-slate-900 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Acme Properties"
                  />
                </div>
              </div>
            )}

            {(isRegister || isAcceptInvite) && (
              <div>
                <label className="block text-xs font-medium text-slate-300">Full Name</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-600 rounded-lg bg-slate-900 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. John Doe"
                  />
                </div>
              </div>
            )}

            {!isAcceptInvite && (
              <div>
                <label className="block text-xs font-medium text-slate-300">Email address</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-600 rounded-lg bg-slate-900 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="broker@example.com"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-600 rounded-lg bg-slate-900 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition"
              >
                {submitting ? 'Processing...' : isAcceptInvite ? 'Join Organization' : isRegister ? 'Create Account & Org' : 'Sign In'}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-700 pt-4 flex flex-col space-y-2 text-center text-xs">
            {!isAcceptInvite && (
              <button
                onClick={() => { setIsRegister(!isRegister); setError(''); }}
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register new organization"}
              </button>
            )}

            <button
              onClick={() => { setIsAcceptInvite(!isAcceptInvite); setIsRegister(false); setError(''); }}
              className="text-slate-400 hover:text-slate-300"
            >
              {isAcceptInvite ? 'Back to sign in' : 'Have an invitation token? Accept invite'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
