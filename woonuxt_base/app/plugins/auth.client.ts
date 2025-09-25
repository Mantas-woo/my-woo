export default defineNuxtPlugin((nuxtApp) => {
  // @ts-ignore nuxt-graphql-client hookas neturi tipų
  nuxtApp.hook('graphql:auth', ({ headers }) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  });
});
