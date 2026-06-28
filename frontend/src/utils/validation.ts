export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export const getPasswordValidationErrors = (password: string): PasswordValidationResult => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push("At least 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("At least 1 uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("At least 1 lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("At least 1 number");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const isValidPassword = (password: string): boolean => {
  return getPasswordValidationErrors(password).isValid;
};
