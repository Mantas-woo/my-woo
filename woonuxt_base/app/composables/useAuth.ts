import type { CreateAccountInput, LoginInput, RegisterCustomerInput, ResetPasswordEmailMutationVariables, ResetPasswordKeyMutationVariables } from '#gql';

export const useAuth = () => {
  const { refreshCart } = useCart();
  const { clearAllCookies, getErrorMessage } = useHelpers();
  const router = useRouter();

  const customer = useState<Customer>('customer', () => ({ billing: {}, shipping: {} }));
  const viewer = useState<Viewer | null>('viewer', () => null);
  const isPending = useState<boolean>('isPending', () => false);
  const orders = useState<Order[] | null>('orders', () => null);
  const downloads = useState<DownloadableItem[] | null>('downloads', () => null);
  const loginClients = useState<LoginClient[] | null>('loginClients', () => null);

  // Login
  const loginUser = async (credentials: CreateAccountInput): Promise<AuthResponse> => {
    isPending.value = true;

    try {
      const { login } = await GqlLogin(credentials);
      if (login?.user && login?.authToken) {
        useGqlToken(login.authToken);
        await refreshCart();

        // iššaukiam hook kad auth plugin išsaugotų token
        const nuxtApp = useNuxtApp();
        nuxtApp.callHook('woo:auth:login', { token: login.authToken });
      }

      isPending.value = false;
      return { success: true };
    } catch (error: any) {
      const errorMsg = getErrorMessage(error);
      isPending.value = false;
      return { success: false, error: errorMsg };
    }
  };

  // Logout
  async function logoutUser(): Promise<AuthResponse> {
    isPending.value = true;
    try {
      const { logout } = await GqlLogout();
      if (logout) {
        await refreshCart();
        clearAllCookies();
        customer.value = { billing: {}, shipping: {} };

        const nuxtApp = useNuxtApp();
        nuxtApp.callHook('woo:auth:logout');
      }
      return { success: true };
    } catch (error: any) {
      const errorMsg = getErrorMessage(error);
      return { success: false, error: errorMsg };
    } finally {
      updateViewer(null);
      if (router.currentRoute.value.path === '/my-account' && viewer.value === null) {
        router.push('/my-account');
      } else {
        router.push('/');
      }
    }
  }

  // Register
  async function registerUser(userInfo: RegisterCustomerInput): Promise<AuthResponse> {
    isPending.value = true;
    try {
      await GqlRegisterCustomer({ input: userInfo });
      return { success: true };
    } catch (error: any) {
      const errorMsg = getErrorMessage(error);
      isPending.value = false;
      return { success: false, error: errorMsg };
    }
  }

  // Update state helpers
  const updateCustomer = (payload: Customer): void => {
    const sessionToken = payload?.sessionToken;
    if (sessionToken) {
      useGqlHeaders({ 'woocommerce-session': `Session ${sessionToken}` });
      const newToken = useCookie('woocommerce-session');
      newToken.value = sessionToken;
    }
    customer.value = payload;
    isPending.value = false;
  };

  const updateViewer = (payload: Viewer | null): void => {
    viewer.value = payload;
    isPending.value = false;
  };

  return {
    viewer,
    customer,
    isPending,
    orders,
    downloads,
    loginClients,
    loginUser,
    logoutUser,
    registerUser,
    updateCustomer,
    updateViewer,
  };
};
