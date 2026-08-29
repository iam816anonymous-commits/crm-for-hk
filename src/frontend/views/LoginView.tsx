import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Home, Lock, Mail, Building, User, KeyRound } from 'lucide-react';
import { Button } from '../components/Button.js';
import { Input } from '../components/Input.js';

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
          <div className="bg-emerald-600 p-3 rounded-xl text-white shadow-lg">
            <Home className="w-8 h-8" />
          </div>
          <div>
            <h1 className="font-bold text-2xl tracking-wide text-white">PropCRM</h1>
            <p className="text-xs text-slate-400">Rental Property Operating System</p>
          </div>
        </div>
        <h2 className="mt-6 text-center text-lg font-semibold text-slate-200">
          {isAcceptInvite ? 'Accept User Invitation' : isRegister ? 'Create New Organization' : 'Sign in to your account'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800 py-8 px-4 shadow-2xl rounded-xl sm:px-10 border border-slate-700">
          {error && (
            <div className="mb-4 bg-rose-950/80 border border-rose-500/50 text-rose-200 px-4 py-3 rounded-lg text-xs font-medium">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {isAcceptInvite && (
              <Input
                label="Invitation Token"
                icon={KeyRound}
                required
                value={inviteToken}
                onChange={(e) => setInviteToken(e.target.value)}
                placeholder="Enter invitation token"
              />
            )}

            {isRegister && (
              <Input
                label="Organization Name"
                icon={Building}
                required
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="e.g. Apex Realty"
              />
            )}

            {(isRegister || isAcceptInvite) && (
              <Input
                label="Full Name"
                icon={User}
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Sarah Owner"
              />
            )}

            {!isAcceptInvite && (
              <Input
                label="Email address"
                type="email"
                icon={Mail}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="broker@example.com"
              />
            )}

            <Input
              label="Password"
              type="password"
              icon={Lock}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                loading={submitting}
                className="w-full justify-center bg-emerald-600 hover:bg-emerald-700"
              >
                {isAcceptInvite ? 'Join Organization' : isRegister ? 'Create Account & Org' : 'Sign In'}
              </Button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-700 pt-4 flex flex-col space-y-2 text-center text-xs">
            {!isAcceptInvite && (
              <button
                onClick={() => { setIsRegister(!isRegister); setError(''); }}
                className="text-emerald-400 hover:text-emerald-300 font-medium transition"
              >
                {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register new organization"}
              </button>
            )}

            <button
              onClick={() => { setIsAcceptInvite(!isAcceptInvite); setIsRegister(false); setError(''); }}
              className="text-slate-400 hover:text-slate-300 transition"
            >
              {isAcceptInvite ? 'Back to sign in' : 'Have an invitation token? Accept invite'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
