export function encodeWav(buffer) {
  const channels = buffer.numberOfChannels;
  const byteLength = buffer.length * channels * 2;
  const output = new ArrayBuffer(44 + byteLength);
  const view = new DataView(output);
  function label(offset, value) {
    for (let index = 0; index < value.length; index += 1) view.setUint8(offset + index, value.charCodeAt(index));
  }
  label(0, 'RIFF'); view.setUint32(4, byteLength + 36, true); label(8, 'WAVE');
  label(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, channels, true); view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * channels * 2, true); view.setUint16(32, channels * 2, true); view.setUint16(34, 16, true);
  label(36, 'data'); view.setUint32(40, byteLength, true);
  const samples = Array.from({ length: channels }, (_, channel) => buffer.getChannelData(channel));
  for (let index = 0; index < buffer.length; index += 1) {
    for (let channel = 0; channel < channels; channel += 1) {
      const value = samples[channel][index];
      if (!Number.isFinite(value) || Math.abs(value) > 1) throw new RangeError(`Invalid or clipped sample at ${index}, channel ${channel}: ${value}`);
      view.setInt16(44 + (index * channels + channel) * 2, Math.round(value * (value < 0 ? 32768 : 32767)), true);
    }
  }
  return output;
}

export function analyzeBuffer(buffer) {
  let peak = 0;
  let energy = 0;
  let lastAudible = 0;
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const samples = buffer.getChannelData(channel);
    for (let index = 0; index < samples.length; index += 1) {
      peak = Math.max(peak, Math.abs(samples[index]));
      energy += samples[index] ** 2;
      if (Math.abs(samples[index]) > 1 / 32768) lastAudible = Math.max(lastAudible, index);
    }
  }
  return { sampleRate: buffer.sampleRate, channels: buffer.numberOfChannels, samples: buffer.length, seconds: buffer.duration, peak, peakDb: 20 * Math.log10(peak), rmsDb: 10 * Math.log10(energy / (buffer.length * buffer.numberOfChannels)), lastAudibleSample: lastAudible };
}
