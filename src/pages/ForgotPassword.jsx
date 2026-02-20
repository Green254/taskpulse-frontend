import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TextInput from '../components/TextInput';
import Toast from '../components/Toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email) {
      setError('Email is required.');
      setToast({ message: 'Please enter your email.', type: 'error' });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Invalid email format.');
      setToast({ message: 'Invalid email format.', type: 'error' });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setToast({ message: 'Reset link sent to your email.', type: 'success' });

      setTimeout(() => {
        navigate('/reset-password'); //  Redirect to  reset password page
      }, 1000);
    }, 2000);
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="w-full max-w-md bg-white shadow-md rounded-2xl p-8">
          <h2 className="text-2xl font-semibold text-center mb-6">Forgot Password</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <TextInput
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              error={error}
            />

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 rounded-lg text-white transition duration-200 ${
                loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm">
            <Link to="/" className="text-blue-600 hover:underline">
              Back to Home
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
