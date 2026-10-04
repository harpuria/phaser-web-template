export const gameConfig = {
  title: 'Phaser Web Template',
  version: '0.1.0',
  storagePrefix: 'phaser-web-template', // 새 게임마다 고유한 값으로 변경
  width: 960,
  height: 540,
  background: '#101827',
  startScene: 'Menu',
  autosaveMs: 15_000,
  transitionMs: 180,
  services: { mock: true, ads: true, billing: true, analytics: true },
} as const;
