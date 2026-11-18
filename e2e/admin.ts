import { adminCredentials } from '@camphoric/camphoric-event-import-tools/e2e';
import { request, type BrowserContextOptions } from '@playwright/test';

type StorageState = Exclude<BrowserContextOptions['storageState'], string | undefined>;

export interface AdminSession {
  storageState: StorageState;
  organizationId: number;
}

// The admin is signed in with a session cookie (the browser's admin doesn't
// take the API token the event was imported with), as the throwaway server's
// admin, whose username and password the global setup leaves for the workers.
export async function signIn(baseURL: string, eventId: number): Promise<AdminSession> {
  const { username, password } = adminCredentials();
  const api = await request.newContext({ baseURL });
  try {
    await api.get('/api/set-csrf-cookie');
    const csrf = (await api.storageState()).cookies.find(c => c.name === 'csrftoken')?.value ?? '';
    // Camphoric throttles sign-in: if a run has signed in too often (a failed
    // test restarts the worker, which signs in again), wait as it says, once
    for (let attempt = 1; ; attempt++) {
      const response = await api.post('/api/login', {
        headers: { 'X-CSRFToken': csrf },
        data: { username, password },
      });
      if (response.ok()) break;
      const wait = Number(response.headers()['retry-after']);
      if (response.status() !== 429 || attempt > 1 || !(wait <= 40)) {
        throw new Error(`signing in answered ${response.status()}: ${await response.text()}`);
      }
      await new Promise(resolve => setTimeout(resolve, wait * 1000));
    }
    const event = await api.get(`/api/events/${eventId}/`);
    if (!event.ok()) throw new Error(`GET /api/events/${eventId}/ answered ${event.status()}`);
    const { organization } = await event.json() as { organization: number };
    return { storageState: await api.storageState(), organizationId: organization };
  } finally {
    await api.dispose();
  }
}
