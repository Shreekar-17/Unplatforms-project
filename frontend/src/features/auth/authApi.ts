import { api } from '../../lib/api';

interface User {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SignupRequest {
  email: string;
  username: string;
  password: string;
  full_name?: string;
}

interface LoginRequest {
  username: string; // Can be username or email
  password: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
}

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    signup: builder.mutation<User, SignupRequest>({
      query: (data) => ({
        url: '/auth/signup',
        method: 'POST',
        body: data,
      }),
    }),
    login: builder.mutation<TokenResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    getMe: builder.query<User, void>({
      query: () => '/auth/me',
    }),
  }),
});

export const { useSignupMutation, useLoginMutation, useGetMeQuery } = authApi;
