import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, signup } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (isRegister && password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (isRegister && fullName.trim().length < 1) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    setSubmitting(true);
    try {
      if (isRegister) {
        await signup(email, fullName.trim(), password);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed.';
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F7F5F0' }}>
      <div
        className="hidden lg:flex lg:w-1/2 items-center justify-center p-16"
        style={{ background: 'linear-gradient(135deg, #2E1A1A 0%, #C2B280 100%)' }}
      >
        <div className="max-w-md text-center">
          <h1
            className="mb-6"
            style={{ fontSize: '48px', fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.02em' }}
          >
            LUMA
          </h1>
          <p style={{ fontSize: '18px', color: '#FFFFFF', opacity: 0.9, lineHeight: 1.6 }}>
            Discover moments, join experiences, and connect with your community.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <button
            onClick={() => navigate('/')}
            className="mb-8 transition-all"
            style={{
              fontSize: '14px',
              color: '#6B6B6B',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#2E1A1A')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#6B6B6B')}
          >
            ← Back to home
          </button>

          <div className="rounded-xl p-8" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 8px 24px rgba(46, 26, 26, 0.08)' }}>
            <h2 className="mb-2" style={{ fontSize: '32px', fontWeight: 600, color: '#2E1A1A' }}>
              {isRegister ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="mb-8" style={{ fontSize: '16px', color: '#6B6B6B' }}>
              {isRegister ? 'Join LUMA to discover and share events' : 'Login to continue to LUMA'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {isRegister && (
                <div>
                  <label htmlFor="fullName" className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: '#2E1A1A' }}>
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    required
                    className="w-full px-4 py-3 rounded-lg outline-none transition-all"
                    style={{ fontSize: '16px', color: '#2E1A1A', backgroundColor: '#F5F3EE', border: '1px solid #E5E2DA' }}
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: '#2E1A1A' }}>
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3 rounded-lg outline-none transition-all"
                  style={{ fontSize: '16px', color: '#2E1A1A', backgroundColor: '#F5F3EE', border: '1px solid #E5E2DA' }}
                />
              </div>

              <div>
                <label htmlFor="password" className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: '#2E1A1A' }}>
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 rounded-lg outline-none transition-all"
                  style={{ fontSize: '16px', color: '#2E1A1A', backgroundColor: '#F5F3EE', border: '1px solid #E5E2DA' }}
                />
              </div>

              {isRegister && (
                <div>
                  <label htmlFor="confirmPassword" className="block mb-2" style={{ fontSize: '14px', fontWeight: 500, color: '#2E1A1A' }}>
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 rounded-lg outline-none transition-all"
                    style={{ fontSize: '16px', color: '#2E1A1A', backgroundColor: '#F5F3EE', border: '1px solid #E5E2DA' }}
                  />
                </div>
              )}

              {errorMessage && (
                <p role="alert" style={{ color: '#8A2B2B', fontSize: '14px' }}>
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-full transition-all duration-200"
                style={{
                  backgroundColor: '#2E1A1A',
                  color: '#FFFFFF',
                  fontSize: '16px',
                  fontWeight: 500,
                  border: 'none',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(46, 26, 26, 0.2)',
                }}
              >
                {submitting ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p style={{ fontSize: '14px', color: '#6B6B6B' }}>
                {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setErrorMessage('');
                  }}
                  className="transition-all"
                  style={{
                    fontSize: '14px',
                    color: '#C2B280',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 500,
                    padding: 0,
                  }}
                >
                  {isRegister ? 'Sign in' : 'Create account'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
