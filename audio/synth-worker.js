import { synthesize } from './instruments.js';

self.onmessage = (message) => {
  try {
    const { events, sampleRate } = message.data;
    for (const event of events) {
      const samples = synthesize(event, sampleRate);
      self.postMessage({ id: event.id, samples }, [samples.buffer]);
    }
    self.postMessage({ complete: true });
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};
