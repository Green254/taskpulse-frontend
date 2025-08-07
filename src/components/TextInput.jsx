// src/components/TextInput.jsx
export default function TextInput({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error = '',
  placeholder = '',
  autoComplete = '',
}) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block mb-1 font-medium">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring ${
          error ? 'border-red-500' : 'focus:border-blue-500'
        }`}
      />
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}
