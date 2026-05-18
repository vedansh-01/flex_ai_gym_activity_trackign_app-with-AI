import CoachScreen from '../../src/screens/CoachScreen';
import { useRouter } from 'expo-router';

export default function CoachRoute() {
  const router = useRouter();
  
  return <CoachScreen onBack={() => router.push('/(tabs)')} />;
}
