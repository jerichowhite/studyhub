import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resendVerificationEmail, refreshCurrentUser, logoutUser } from '../services/authService';

const VerifyEmail = () => {
  const { currentUser, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [resendLoading, setResendLoading] = useState(false);
  const [checkLoading, setCheckLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState('');

  // If somehow a non-authenticated user lands here, send them to login
  if (!currentUser) {
    navigate('/login', { replace: true });
    return null;
  }

  const handleResend = async () => {
    setResendLoading(true);
    setError('');
    setResendSuccess(false);
    try {
      await resendVerificationEmail();
      setResendSuccess(true);
    } catch (err) {
      if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Please wait a few minutes before trying again.');
      } else {
        setError('Failed to resend. Please try again shortly.');
      }
    } finally {
      setResendLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setCheckLoading(true);
    setError('');
    try {
      // Reload user to pick up the updated emailVerified flag from Firebase
      const refreshedUser = await refreshCurrentUser();

      if (refreshedUser.emailVerified) {
        // Refresh Firestore profile too, then send to profile setup
        await refreshProfile();
        navigate('/profile-setup', { replace: true });
      } else {
        setError("Your email hasn't been verified yet. Please click the link in the email we sent you.");
      }
    } catch {
      setError('Could not check verification status. Please try again.');
    } finally {
      setCheckLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
      navigate('/login', { replace: true });
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">

        {/* Header */}
        <div className="bg-blue-700 px-8 py-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 0 1-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 0 0 1.183 1.981l6.478 3.488m8.839 2.51-4.66-2.51m0 0-1.023-.55a2.25 2.25 0 0 0-2.134 0l-1.022.55m0 0-4.661 2.51m16.5 1.615a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V8.844a2.25 2.25 0 0 1 1.183-1.981l7.5-4.039a2.25 2.25 0 0 1 2.134 0l7.5 4.039a2.25 2.25 0 0 1 1.183 1.98V19.5Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Check Your Email</h1>
          <p className="text-blue-200 text-sm mt-1">One last step before you&apos;re in</p>
        </div>

        <div className="px-8 py-8 text-center">
          <div className="mb-6">
            <p className="text-gray-700 mb-2">
              We sent a verification email to:
            </p>
            <p className="font-semibold text-blue-700 text-lg break-all">
              {currentUser.email}
            </p>
          </div>

          <p className="text-sm text-gray-600 mb-8">
            Click the link in that email to verify your account. Once verified, come back
            here and click the button below to continue.
          </p>

          {/* Error / success messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 text-left">
              {error}
            </div>
          )}
          {resendSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 text-left">
              Verification email resent! Please check your inbox (and spam folder).
            </div>
          )}

          {/* Primary action */}
          <button
            onClick={handleCheckVerification}
            disabled={checkLoading}
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold rounded-lg transition mb-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {checkLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Checking…
              </>
            ) : (
              "I've Verified My Email"
            )}
          </button>

          {/* Resend */}
          <button
            onClick={handleResend}
            disabled={resendLoading}
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-gray-700 font-medium rounded-lg transition mb-6 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {resendLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                Resending…
              </>
            ) : (
              'Resend Verification Email'
            )}
          </button>

          <p className="text-xs text-gray-500">
            Wrong email?{' '}
            <button
              onClick={handleSignOut}
              className="text-blue-600 hover:underline font-medium"
            >
              Sign out
            </button>{' '}
            and register with the correct one.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
