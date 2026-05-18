import OnboardingScreen from '../../src/screens/OnboardingScreen';
import { useRouter } from 'expo-router';
import * as storage from '../../src/utils/storage';

export default function OnboardingRoute() {
  const router = useRouter();

  const handleComplete = () => {
    router.replace('/(tabs)');
  };

  const handleLogout = async () => {
    await storage.deleteItem('userToken');
    router.replace('/(auth)');
  };

  return <OnboardingScreen onComplete={handleComplete} onLogout={handleLogout} />;
}
