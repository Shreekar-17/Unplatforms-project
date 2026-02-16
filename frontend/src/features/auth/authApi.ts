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

interface LoginResponse {
  message: string;
  user: User;
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
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    getMe: builder.query<User, void>({
      query: () => '/auth/me',
    }),
    getUsers: builder.query<User[], void>({
      query: () => '/auth/users',
    }),
  }),
});

export const { useSignupMutation, useLoginMutation, useGetMeQuery, useGetUsersQuery } = authApi;
