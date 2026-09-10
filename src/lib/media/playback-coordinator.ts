export interface PreviewPlayer { play(): Promise<void>; pause(): void }
/** One coordinator shared by every preview mounted in the browser. */
export class PlaybackCoordinator {
  private active: PreviewPlayer | null = null;
  async play(player: PreviewPlayer) {
    if (this.active !== player) this.active?.pause();
    this.active = player;
    try { await player.play(); if (this.active !== player) player.pause(); }
    catch { if (this.active === player) this.active = null; player.pause(); }
  }
  stop(player: PreviewPlayer) { player.pause(); if (this.active === player) this.active = null; }
}
export function allowPreview({ reducedMotion, saveData, finePointer, inViewport, intentionalTap=false }: { reducedMotion: boolean; saveData: boolean; finePointer: boolean; inViewport: boolean; intentionalTap?: boolean }) {
  return !reducedMotion && !saveData && (finePointer||intentionalTap) && inViewport;
}
export const playback = new PlaybackCoordinator();
