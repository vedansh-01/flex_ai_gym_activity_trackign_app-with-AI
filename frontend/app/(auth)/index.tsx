import AuthScreen from '../../src/screens/AuthScreen';
import { useRouter } from 'expo-router';
import * as storage from '../../src/utils/storage';

export default function AuthRoute() {
  const router = useRouter();

  const handleLoginSuccess = async (token: any, user: any) => {
    await storage.setItem('userToken', token);
    if (user && user.isVerified === false) {
      // Stay on auth
    } else {
      if (user?.isOnboarded) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/onboarding');
      }
    }
  };

  return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
}
