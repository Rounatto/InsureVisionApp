export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  // Present only in development to help test reset flow without email service.
  resetUrl?: string;
}

export interface RegisterResponse extends AuthResponse {
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: ValidationError[];
}

export interface LoginResponse extends AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
  };
}
