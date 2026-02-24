// ─── API Request / Response Types ────────────────────────────────────────────

export interface AuthResponse {
  success: boolean;
  message: string;
}

export interface RegisterResponse extends AuthResponse {
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

// ─── Validation Error Response ───────────────────────────────────────────────

export interface ValidationError {
  field: string;
  message: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: ValidationError[];
}
