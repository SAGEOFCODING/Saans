import { fetchAirData, synthesizeManualAir } from '@/services/airData';
import { SaansApp } from '@/components/SaansApp';

export const dynamic = 'force-dynamic';

export default async function Page() {
  let initialAir = null;
  try {
    initialAir = await fetchAirData(28.61, 77.21);
  } catch {
    initialAir = synthesizeManualAir(280);
  }

  return <SaansApp initialAir={initialAir} />;
}
