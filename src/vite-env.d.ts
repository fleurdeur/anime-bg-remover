:root {
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #ecf5ff;
  background: #07131f;
  line-height: 1.5;
  font-weight: 400;
  color-scheme: dark;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}

html, body, #root {
  margin: 0;
  min-height: 100%;
  min-width: 100%;
  background: radial-gradient(circle at top, #0f243c 0%, #091522 35%, #050d17 100%);
}

body {
  min-height: 100vh;
}

button, input {
  font: inherit;
}

button {
  cursor: pointer;
}

.page-shell {
  width: min(1400px, calc(100% - 32px));
  margin: 0 auto;
  padding: 32px 0 48px;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}

.eyebrow {
  margin: 0 0 6px;
  color: #7cc8ff;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 11px;
}

h1 {
  margin: 0;
  font-size: clamp(2rem, 4vw, 3rem);
  letter-spacing: -0.05em;
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.primary-button,
.ghost-button,
.segment {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 12px 18px;
  font-weight: 600;
  transition: transform 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}

.primary-button {
  background: linear-gradient(135deg, #55c1ff 0%, #6d7bff 100%);
  color: white;
  border: none;
  box-shadow: 0 12px 24px rgba(90, 129, 255, 0.35);
}

.ghost-button {
  background: rgba(255, 255, 255, 0.04);
  color: #dfeeff;
}

.primary-button:hover,
.ghost-button:hover,
.segment:hover {
  transform: translateY(-1px);
}

.upload-label {
  position: relative;
  overflow: hidden;
}

.upload-label input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.editor-panel {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 24px;
}

.controls-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.card {
  background: rgba(12, 23, 35, 0.85);
  border: 1px solid rgba(125, 165, 211, 0.18);
  border-radius: 20px;
  padding: 18px 16px;
  box-shadow: 0 18px 40px rgba(2, 10, 18, 0.32);
}

.card h2 {
  margin: 0 0 12px;
  font-size: 1rem;
}

.toggle-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.segment {
  background: rgba(255, 255, 255, 0.04);
  color: #dfeeff;
}

.segment.active {
  background: rgba(75, 166, 255, 0.18);
  border-color: rgba(94, 170, 255, 0.7);
}

.slider-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.92rem;
  color: #dfeeff;
}

input[type='range'] {
  width: 100%;
  accent-color: #6a8bff;
}

.wide {
  width: 100%;
  margin-bottom: 8px;
}

.canvas-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.canvas-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  background: rgba(10, 20, 31, 0.82);
  border: 1px solid rgba(125, 165, 211, 0.18);
  border-radius: 16px;
  padding: 12px 16px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 88, 108, 0.12);
  border: 1px solid rgba(255, 92, 110, 0.2);
  color: #ffc4cb;
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 0.8rem;
}

.status-text {
  color: #cfe8ff;
  font-size: 0.9rem;
}

.canvas-frame {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 68vh;
  background:
    linear-gradient(45deg, rgba(255,255,255,0.02) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(255,255,255,0.02) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.02) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.02) 75%),
    #081721;
  background-size: 26px 26px;
  background-position: 0 0, 0 13px, 13px -13px, -13px 0;
  border: 1px solid rgba(125, 165, 211, 0.2);
  border-radius: 22px;
  overflow: hidden;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.28);
}

canvas {
  display: block;
  max-width: 100%;
  max-height: 72vh;
  border-radius: 14px;
  cursor: crosshair;
  user-select: none;
}

@media (max-width: 980px) {
  .editor-panel {
    grid-template-columns: 1fr;
  }

  .topbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .actions {
    width: 100%;
    flex-wrap: wrap;
  }
}
