import React from 'react';

interface Props {
  password: string;
  labels: { weak: string; medium: string; strong: string };
}

export const getPasswordStrength = (pw: string): 'weak' | 'medium' | 'strong' => {
  const hasLetter = /[a-zA-Z]/.test(pw);
  const hasNumber = /\d/.test(pw);
  const hasSpecial = /[^a-zA-Z0-9]/.test(pw);
  if (pw.length >= 8 && hasLetter && hasNumber && hasSpecial) return 'strong';
  if (pw.length >= 8 && hasLetter && hasNumber) return 'medium';
  return 'weak';
};

export const isPasswordValid = (pw: string): boolean => {
  return pw.length >= 8 && /[a-zA-Z]/.test(pw) && /\d/.test(pw);
};

const PasswordStrengthIndicator: React.FC<Props> = ({ password, labels }) => {
  if (!password) return null;
  const strength = getPasswordStrength(password);
  const config = {
    weak: { color: '#EF4444', width: '33%', label: labels.weak },
    medium: { color: '#F97316', width: '66%', label: labels.medium },
    strong: { color: '#22C55E', width: '100%', label: labels.strong },
  };
  const c = config[strength];

  return (
    <div className="mt-1.5 px-1">
      <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: c.width, backgroundColor: c.color }}
        />
      </div>
      <p className="text-xs mt-1" style={{ color: c.color }}>{c.label}</p>
    </div>
  );
};

export default PasswordStrengthIndicator;
