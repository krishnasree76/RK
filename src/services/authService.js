import { apiGet, apiPatch, apiPost } from './api'

// Customer accounts: email/phone + password, or Google Sign-In.
export const register = ({ name, email, phone, password }) =>
  apiPost('/auth/register/', { name, email, phone, password })

export const login = ({ identifier, password }) => apiPost('/auth/login/', { identifier, password })

// `credential` is the ID token returned by the Google Sign-In button.
export const loginWithGoogle = (credential) => apiPost('/auth/google/', { credential })

export const logout = () => apiPost('/auth/logout/', undefined, { auth: true })

export const fetchMe = (options) => apiGet('/auth/me/', { ...options, auth: true })

export const updateMe = (changes) => apiPatch('/auth/me/', changes, { auth: true })
