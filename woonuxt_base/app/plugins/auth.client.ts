import { defineNuxtPlugin } from '#app';
import { useAuth } from '~/app/composables/useAuth';

export default defineNuxtPlugin(async (nuxtApp) => {
  const { updateViewer, updateCustomer } = useAuth();

  // --- Token helpers ---
  const getToken = () => localStorage.getItem('auth_token');
  const setToken = (token: string) => localStorage.setItem('auth_token', token);
  const clearToken = () => localStorage.removeItem('auth_token');

  // --- Hookai login/logout ---
  nuxtApp.hook('woo:auth:login', (payload: { token: string }) => {
    setToken(payload.token);
  });

  nuxtApp.hook('woo:auth:logout', () => {
    clearToken();
    updateViewer(null);
  });

  // --- GraphQL request interceptor ---
  nuxtApp.hook('graphql:request', (operation) => {
    const token = getToken();
    if (token) {
      operation.headers = {
        ...operation.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  });

  // --- Restore viewer after refresh ---
  const token = getToken();
  if (token) {
    try {
      const { viewer } = await GqlViewer();
      if (viewer) {
        updateViewer(viewer);
        updateCustomer(viewer.customer);
      }
    } catch (err) {
      console.warn('[initAuth] Failed to restore viewer', err);
      clearToken();
    }
  }
});
