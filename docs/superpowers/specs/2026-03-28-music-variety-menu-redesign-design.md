# Music Variety & Menu Redesign

## Overview

Three interconnected improvements: (1) add variety and dynamism to the in-game music system, (2) add a dark ambient menu drone, (3) redesign all menu scenes with a stone/gritted survival aesthetic featuring animated backgrounds.

## 1. Music System Enhancements

### 1.1 Phrase Randomization

Replace fixed note arrays with pools of short phrases (4-8 notes each). Each biome config provides 3-4 melody phrases and 2-3 bass phrases. The sequencer picks the next phrase randomly when the current one completes, so the music never loops identically.

**Config structure change:**
```ts
interface BiomeConfig {
  bassPhrases: number[][];    // 2-3 bass phrases
  melodyPhrases: number[][];  // 3-4 melody phrases
  arpPhrases?: number[][];    // optional arp phrases
  tempo: number;
  waveform: WaveType;
  bassWaveform?: WaveType;
}
```

### 1.2 Multiple Variations Per Biome

Each biome holds 2-3 variation sets (different phrase pools, slightly different tempos). One variation is chosen randomly on biome entry. Revisiting the same biome sounds fresh.

**Config structure:**
```ts
const BIOME_CONFIGS: Record<string, BiomeConfig[]> = {
  forest: [variation1, variation2, variation3],
  // ...
};
```

### 1.3 Dynamic Layers Based on Game State

Track a `musicState`: `'exploring' | 'combat' | 'idle'`.

- **Exploring** (default): bass + melody layers active.
- **Combat**: adds arp layer, slight tempo bump (~10%), optional percussion via short noise bursts (kick/snare).
- **Idle** (player stationary >5s): melody fades out, bass only.

Crossfade between layer configurations over ~0.5s. GameScene sets the music state based on:
- Combat: when player is attacking or being attacked.
- Idle: when player hasn't moved for 5 seconds.
- Exploring: otherwise.

### 1.4 Percussion Layer

Add a simple percussion system using noise-based synthesis:
- **Kick**: short noise burst with rapid frequency sweep down, ~0.05s.
- **Snare/hi-hat**: short high-frequency noise burst, ~0.03s.
- Triggered on specific beat positions (kick on beats 1 and 3, snare on 2 and 4).
- Only active during combat state.

## 2. Menu Drone

A new method `playMenuDrone()` on MusicSystem:

- Two detuned sawtooth oscillators at ~40Hz and ~42Hz for a dark beating effect.
- Slow gain LFO (0.1Hz) modulating amplitude for a pulsing hum.
- Occasional deep percussion hits: a low-freq noise burst every 4-8 seconds (randomized interval).
- Volume: quiet, atmospheric, not intrusive.
- `stopMenuDrone()` fades out over ~1s.

## 3. MenuBackground

A standalone class: `MenuBackground`.

### Layers (bottom to top):

1. **Dark stone base**: fullscreen procedural texture, dark grey (#1a1a1a to #2a2a2a) with noise/grain. Generated once via canvas, applied as a tiled sprite.
2. **Fog/mist**: 8-12 semi-transparent white ellipse sprites (alpha 0.03-0.08), large (200-400px), drifting slowly left-to-right at different speeds. Wrap when exiting screen. Varied speeds and sizes for parallax depth.
3. **Ember sparks**: small 2-4px orange/red circles, spawn near bottom, drift upward with slight horizontal wobble, fade out over 2-3s. Low frequency: 1-2 per second.
4. **Vignette overlay**: radial gradient darkening edges, focusing attention on center.

### API:
```ts
class MenuBackground {
  create(scene: Phaser.Scene): void;
  update(dt: number): void;
  destroy(): void;
}
```

## 4. StoneUI Components

### StoneButton

Factory function returning a Phaser Container (Graphics + Text):

- **Background**: rounded rectangle, dark stone fill (#3a3a3a), 1px border (#555), subtle inner noise via random darker pixels.
- **Text**: centered, off-white (#d4d0c8).
- **Hover**: border brightens to #888, background to #454545, scale tween to 1.03x.
- **Press**: darkens to #2a2a2a, scale tween to 0.97x, 1px downward offset.
- **onClick** callback parameter.

### StonePanel

Larger stone background for displaying stats/info. Same stone fill with slightly inset border (dark top-left edge, light bottom-right edge) for a carved look.

### Title Treatment

"SURVIVOR" rendered large with a subtle drop shadow (2px offset, black at 0.5 alpha) and warm tint (#e8dcc8).

## 5. Scene Updates

### MainMenu
- MenuBackground active, menu drone playing.
- Chiseled "SURVIVOR" title with drop shadow.
- Subtitle in muted stone color.
- Two StoneButtons: "New Run" (larger, primary) and "Progression" (smaller, secondary).
- Drone fades out over ~1s on "New Run" click, before scene transition.

### GameOver
- MenuBackground active, menu drone playing.
- "YOU DIED" in red-tinted stone text (#c44) with drop shadow.
- Death stats in a StonePanel.
- Two StoneButtons: "Try Again" and "Main Menu".

### MetaHub
- MenuBackground active, menu drone continues seamlessly from MainMenu.
- "PROGRESSION" title in stone style.
- Each stat category in its own StonePanel.
- StoneButton for "Back to Menu".

### Music Transitions
- Entering any menu scene: start/continue menu drone.
- Entering GameScene: fade out drone (~1s), then start biome music.
- Returning to menu: fade out game music, fade in drone.

## 6. New Files

- `src/ui/MenuBackground.ts` — animated background system
- `src/ui/StoneUI.ts` — StoneButton + StonePanel + title factories

## 7. Modified Files

- `src/audio/MusicSystem.ts` — phrase randomization, variations, dynamic layers, percussion, menu drone
- `src/scenes/MainMenuScene.ts` — use MenuBackground + StoneUI + drone
- `src/scenes/GameOverScene.ts` — use MenuBackground + StoneUI + drone
- `src/scenes/MetaHubScene.ts` — use MenuBackground + StoneUI + drone
- `src/scenes/GameScene.ts` — set music state (combat/idle/exploring), handle drone transitions
