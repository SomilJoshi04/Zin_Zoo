import alertSound from "@food/assets/audio/alert.mp3";

class AdminAlertSoundManager {
  constructor() {
    this.audio = null;
    this.isPlaying = false;
    this.activeAlertId = null;
    this.loopIntervalTimer = null;
    this.safetyTimeoutTimer = null;
    this.isUnlocked = false;
    this.loopIntervalMs = 4500;
    this.defaultMaxDurationMs = 45000;
    this.audioContext = null;

    if (typeof window !== "undefined") {
      this.initAudio();
      this.setupGestureUnlock();
    }
  }

  initAudio() {
    try {
      if (!this.audio) {
        this.audio = new Audio(alertSound);
        this.audio.preload = "auto";
        this.audio.volume = 1.0;
      }
    } catch (err) {
      console.warn("[AdminAlertSound] Failed to initialize Audio object:", err);
    }
  }

  setupGestureUnlock() {
    if (typeof window === "undefined") return;

    const unlock = async () => {
      if (this.isUnlocked) return;

      try {
        if (!this.audio) {
          this.initAudio();
        }

        if (this.audio) {
          this.audio.muted = true;
          const playPromise = this.audio.play();
          if (playPromise !== undefined) {
            await playPromise;
            this.audio.pause();
            this.audio.currentTime = 0;
            this.audio.muted = false;
          }
        }

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx && !this.audioContext) {
          this.audioContext = new AudioCtx();
        }
        if (this.audioContext?.state === "suspended") {
          await this.audioContext.resume();
        }

        this.isUnlocked = true;
        console.log("[AdminAlertSound] Audio playback successfully unlocked by user gesture.");
      } catch (err) {
        // Silently retry on next gesture
      }
    };

    const events = ["pointerdown", "touchstart", "click", "keydown"];
    const cleanup = () => {
      events.forEach((evt) => window.removeEventListener(evt, unlockHandler, { capture: true }));
    };

    const unlockHandler = () => {
      unlock();
      if (this.isUnlocked) {
        cleanup();
      }
    };

    events.forEach((evt) => {
      window.addEventListener(evt, unlockHandler, { capture: true, passive: true });
    });
  }

  async playSingleTone() {
    if (!this.audio) {
      this.initAudio();
    }
    if (!this.audio) return false;

    try {
      this.audio.currentTime = 0;
      this.audio.volume = 1.0;
      this.audio.muted = false;

      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        await playPromise;
        return true;
      }
      return false;
    } catch (err) {
      if (err.name === "NotAllowedError") {
        console.warn("[AdminAlertSound] Autoplay blocked by browser. Awaiting user interaction.");
      } else {
        console.warn("[AdminAlertSound] Audio play failed:", err.message);
      }
      return false;
    }
  }

  playAlert(options = {}) {
    const {
      id = "alert-" + Date.now(),
      loop = true,
      maxDurationMs = this.defaultMaxDurationMs,
      force = false,
    } = options;

    if (this.isPlaying && !force) {
      console.log(`[AdminAlertSound] Alert already playing for ${this.activeAlertId}. Maintaining active state.`);
      return;
    }

    this.stopAlert();

    this.isPlaying = true;
    this.activeAlertId = id;

    // Trigger immediate sound
    this.playSingleTone();

    // Set up continuous loop if requested
    if (loop) {
      this.loopIntervalTimer = setInterval(() => {
        if (!this.isPlaying) {
          this.stopAlert();
          return;
        }
        this.playSingleTone();
      }, this.loopIntervalMs);
    }

    // Safety auto-stop timer
    const timeoutDuration = Math.max(10000, Number(maxDurationMs) || this.defaultMaxDurationMs);
    this.safetyTimeoutTimer = setTimeout(() => {
      console.log(`[AdminAlertSound] Safety auto-stop triggered after ${timeoutDuration}ms for ${id}`);
      this.stopAlert();
    }, timeoutDuration);
  }

  stopAlert() {
    if (this.loopIntervalTimer) {
      clearInterval(this.loopIntervalTimer);
      this.loopIntervalTimer = null;
    }

    if (this.safetyTimeoutTimer) {
      clearTimeout(this.safetyTimeoutTimer);
      this.safetyTimeoutTimer = null;
    }

    if (this.audio) {
      try {
        this.audio.pause();
        this.audio.currentTime = 0;
      } catch (err) {
        // Ignore pause errors
      }
    }

    this.isPlaying = false;
    this.activeAlertId = null;
  }

  isAlertActive() {
    return this.isPlaying;
  }
}

export const adminAlertSound = new AdminAlertSoundManager();
export default adminAlertSound;
