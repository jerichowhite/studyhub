// Form validation helpers for StudyHub authentication and profile forms

/**
 * Validates an email address format.
 * @returns {string|null} Error message or null if valid
 */
export const validateEmail = (email) => {
  if (!email || !email.trim()) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) return 'Please enter a valid email address';
  return null;
};

/**
 * Validates a password against StudyHub requirements.
 * Requirements: min 8 chars, 1 uppercase, 1 number
 * @returns {{ valid: boolean, strength: number, errors: string[] }}
 */
export const validatePassword = (password) => {
  if (!password) return { valid: false, strength: 0, errors: ['Password is required'] };

  const errors = [];
  if (password.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter');
  if (!/[0-9]/.test(password)) errors.push('At least one number');

  // Strength: 1 = weak, 2 = medium, 3 = strong
  let strength = 1;
  if (errors.length === 0) {
    strength = password.length >= 12 && /[^A-Za-z0-9]/.test(password) ? 3 : 2;
  }

  return { valid: errors.length === 0, strength, errors };
};

/**
 * Validates that confirm password matches password.
 * @returns {string|null} Error message or null if valid
 */
export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return null;
};

/**
 * Validates a display name.
 * @returns {string|null} Error message or null if valid
 */
export const validateDisplayName = (name) => {
  if (!name || !name.trim()) return 'Display name is required';
  if (name.trim().length < 2) return 'Name must be at least 2 characters';
  if (name.trim().length > 50) return 'Name must be 50 characters or less';
  return null;
};

/**
 * Sanitizes a string input by trimming and removing dangerous characters.
 * @returns {string}
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Returns a human-readable password strength label and color class.
 */
export const getPasswordStrengthLabel = (strength) => {
  switch (strength) {
    case 1: return { label: 'Weak', colorClass: 'bg-red-500' };
    case 2: return { label: 'Medium', colorClass: 'bg-yellow-500' };
    case 3: return { label: 'Strong', colorClass: 'bg-green-500' };
    default: return { label: '', colorClass: 'bg-gray-200' };
  }
};
