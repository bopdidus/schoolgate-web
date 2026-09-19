import { GENERATED_PASSWORD_LENGTH, generatePassword } from './password-generator';

describe('generatePassword', () => {
  it('has the default length', () => {
    expect(generatePassword().length).toBe(GENERATED_PASSWORD_LENGTH);
  });

  it('always contains a lowercase letter, an uppercase letter, a digit and a symbol', () => {
    for (let i = 0; i < 200; i++) {
      const p = generatePassword(8);
      expect(p).toMatch(/[a-z]/);
      expect(p).toMatch(/[A-Z]/);
      expect(p).toMatch(/[0-9]/);
      expect(p).toMatch(/[^a-zA-Z0-9]/);
    }
  });

  it('never uses look-alike characters', () => {
    for (let i = 0; i < 200; i++) {
      expect(generatePassword()).not.toMatch(/[0O1lI]/);
    }
  });

  it('differs from one call to the next', () => {
    const passwords = new Set(Array.from({ length: 50 }, () => generatePassword()));
    expect(passwords.size).toBe(50);
  });

  it('refuses a length too short to hold every character class', () => {
    expect(() => generatePassword(3)).toThrowError();
  });
});
