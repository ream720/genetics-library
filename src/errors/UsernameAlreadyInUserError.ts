// UsernameAlreadyInUseError.ts (you can put this anywhere in your project)
export class UsernameAlreadyInUseError extends Error {
  code: string;

  constructor(message: string) {
    super(message);
    this.name = "UsernameAlreadyInUseError";
    // We'll reuse the 'code' field to keep it consistent with Firebase
    this.code = "auth/username-already-in-use";
  }
}
