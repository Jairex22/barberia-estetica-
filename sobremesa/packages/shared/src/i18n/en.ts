import type { Dictionary } from './es.js';
export const en: Dictionary = {
  nav: { discover: 'Discover', connections: 'Connections', messages: 'Messages', profile: 'Profile' },
  states: {
    loading: 'Loading…',
    emptyDiscover: "No compatible people right now. Check back later or widen your preferences yourself; we never invent profiles.",
    error: 'Something went wrong. Please try again.',
    offline: 'Offline. Your messages will be sent when you reconnect.',
    permissionDenied: 'Location permission denied. You can set your city manually.',
    paymentPending: 'Payment pending confirmation. We will notify you once the provider confirms it.',
    serviceUnavailable: 'This service is not available right now.',
  },
  initiation: {
    them: 'Once she writes, you can reply.',
    you: 'You make the first move. Write whenever you like.',
    anyone: 'Either of you can start.',
  },
  ai: { label: 'AI assistant', disclaimer: 'This is an AI, not a person. It can make mistakes.' },
  demo: 'Demo',
};
