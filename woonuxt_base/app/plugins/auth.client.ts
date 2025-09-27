import { defineNuxtPlugin, useRuntimeConfig } from '#app';

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();

  // Token saugojimui
  const getToken = () => localStorage.getItem('auth_token');
  const setToken = (token: string) => localStorage.setItem('auth_token', token);
  const clearToken = () => localStorage.removeItem('auth_token');

  // Po login/register išsaugoti token
  nuxtApp.hook('woo:auth:login', (payload: { token: string }) => {
    setToken(payload.token);
  });

  nuxtApp.hook('woo:auth:logout', () => {
    clearToken();
  });

  // GraphQL client interceptor
  nuxtApp.hook('graphql:request', (operation) => {
    const token = getToken();
    if (token) {
      operation.headers = {
        ...operation.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  });
});
