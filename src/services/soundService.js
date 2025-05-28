class SoundService {
    constructor() {
        this.sounds = new Map();
        this.enabled = true;
        this.volume = 0.5;

        // Preload sounds
        this.preloadSound('cha-ching', '/sounds/cha-ching.mp3');
    }

    preloadSound(name, src) {
        try {
            const audio = new Audio(src);
            audio.preload = 'auto';
            audio.volume = this.volume;
            this.sounds.set(name, audio);
        } catch (error) {
            console.warn(`Failed to preload sound ${name}:`, error);
        }
    }

    async playSound(name) {
        if (!this.enabled) return;

        const audio = this.sounds.get(name);
        if (!audio) {
            console.warn(`Sound ${name} not found`);
            return;
        }

        try {
            // Reset the audio to the beginning
            audio.currentTime = 0;
            await audio.play();
        } catch (error) {
            // Handle autoplay restrictions
            if (error.name === 'NotAllowedError') {
                console.warn('Autoplay prevented. User interaction required.');
            } else {
                console.error(`Error playing sound ${name}:`, error);
            }
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.sounds.forEach(audio => {
            audio.volume = this.volume;
        });
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }

    // Specific sound methods
    playChaChing() {
        return this.playSound('cha-ching');
    }
}

// Create singleton instance
const soundService = new SoundService();

export default soundService;