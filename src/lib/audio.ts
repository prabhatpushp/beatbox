export type WaveType = 'sine' | 'square' | 'triangle' | 'sawtooth';

const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

export const createOscillator = (frequency: number, type: WaveType, duration: number, volume: number = 0.5) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    return { oscillator, gainNode };
};

export const playNote = (frequency: number, type: WaveType, duration: number, volume: number = 0.5) => {
    const { oscillator, gainNode } = createOscillator(frequency, type, duration, volume);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
};