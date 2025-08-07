import { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  // Auto dismiss after duration ms
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div
      className={`fixed top-5 right-5 px-4 py-3 rounded shadow-lg text-white
        ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
      role="alert"
    >
      {message}
    </div>
  );
}
