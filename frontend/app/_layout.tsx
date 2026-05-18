import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from '@sentry/react-native';
import { PostHogProvider } from 'posthog-react-native';

// Initialize Sentry Error Tracking safely
if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
  try {
    Sentry.init({
      dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
      debug: false,
      tracesSampleRate: 1.0,
    });
  } catch (error) {
    console.warn('Sentry initialization bypassed due to error:', error);
  }
} else {
  console.warn('Sentry DSN is missing, error tracking disabled.');
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

function RootLayout() {
  const posthogApiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY || '';
  const isPosthogKeyValid = posthogApiKey.startsWith('phc_');

  if (!isPosthogKeyValid && posthogApiKey) {
    console.warn('Invalid PostHog API Key: Client requires a Project API Key (phc_...) but received a Personal API Key (phx_...). PostHog is disabled.');
  }

  return (
    <PostHogProvider
      apiKey={isPosthogKeyValid ? posthogApiKey : 'phc_placeholder'}
      options={{
        host: process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        disabled: !isPosthogKeyValid,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="profile" 
            options={{ 
              headerShown: false,
              presentation: 'modal',
              animation: 'slide_from_bottom'
            }} 
          />
        </Stack>
        <StatusBar style="light" />
      </QueryClientProvider>
    </PostHogProvider>
  );
}

export default Sentry.wrap(RootLayout);
