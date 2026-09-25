import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const bytes = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) bytes[i] = rawData.charCodeAt(i);
  return bytes.buffer;
}

export type PushState = 'unsupported' | 'denied' | 'unsubscribed' | 'subscribed' | 'loading';

export function usePush() {
  const [state, setState] = useState<PushState>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setState('denied');
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) =>
        reg.pushManager.getSubscription().then((sub) => {
          setState(sub ? 'subscribed' : 'unsubscribed');
        })
      )
      .catch(() => setState('unsubscribed'));
  }, []);

  const subscribe = useMutation({
    mutationFn: async () => {
      setError('');
      // Fetch VAPID public key
      const keyRes = await api.get('/push/vapid-key');
      const { available, publicKey } = keyRes.data.data as {
        available: boolean;
        publicKey?: string;
      };
      if (!available || !publicKey) throw new Error('Notifications non configurées');

      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setState('denied');
        throw new Error('Permission refusée');
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await api.post('/push/subscribe', { subscription: sub.toJSON() });
      setState('subscribed');
      return sub;
    },
    onError: (e: Error) => setError(e.message),
  });

  const unsubscribe = useMutation({
    mutationFn: async () => {
      setError('');
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await api.delete('/push/unsubscribe', { data: { endpoint: sub.endpoint } });
        await sub.unsubscribe();
      }
      setState('unsubscribed');
    },
    onError: (e: Error) => setError(e.message),
  });

  return { state, error, subscribe, unsubscribe };
}
