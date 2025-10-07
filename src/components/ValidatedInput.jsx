import React, { useState } from 'react';

const ValidatedInput = ({
  id,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  error = null,
  onBlur,
  step,
  className = '',
  ...props
}) => {
  const [touched, setTouched] = useState(false);
  const showError = touched && error;

  const handleBlur = (e) => {
    setTouched(true);
    if (onBlur) onBlur(e);
  };

  return (
    <div className={`mb-3 ${className}`}>
      <label htmlFor={id} className="form-label">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <input
        id={id}
        type={type}
        className={`form-control ${showError ? 'is-invalid' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={handleBlur}
        required={required}
        step={step}
        {...props}
      />
      {showError && (
        <div className="invalid-feedback">
          {error}
        </div>
      )}
    </div>
  );
};

export default ValidatedInput;


