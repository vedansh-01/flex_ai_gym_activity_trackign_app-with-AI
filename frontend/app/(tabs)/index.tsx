import DashboardScreen from '../../src/screens/DashboardScreen';
import { useRouter } from 'expo-router';

export default function DashboardRoute() {
  const router = useRouter();

  return <DashboardScreen onOpenProfile={() => router.push('/profile')} />;
}
