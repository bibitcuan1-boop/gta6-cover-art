// Fixed scenes for screenshots: ?shot=cover shows one exported cover full-frame,
// ?shot=portrait and ?shot=square the other two post sizes, ?shot=editor shows the
// editor with a photo loaded. `photo` picks the sample (samples/<photo>.jpg) and
// `caption` the title words. window.__shotReady is set once painted.
export async function runShot(shot, query, app) {
  const { state, addSample, redraw, renderAll, syncControls } = app;
  const caption = query.get('caption') ?? 'Boulevard Queen';
  const photo = query.get('photo') ?? 'boulevard';

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    Object.assign(state, { layout: 'hero-split', grade: 'vice-sunset', size: 'wide',
      title: caption, subtitle: 'Vice City nights', onePhoto: true });
    await addSample(0, photo, photo === 'pier' ? 'Pier — fishing' : 'Boulevard — sunset');
    // Small side panels crop tight on the face, not the torso.
    state.panels[1].panY = 0.3; state.panels[1].zoom = 1.15;
    state.panels[2].panY = 0.3; state.panels[2].zoom = 1.15;
    state.panels[3].panY = 0.3; state.panels[3].zoom = 1.15;
  } else if (shot === 'portrait') {
    document.body.classList.add('shot-cover');
    Object.assign(state, { layout: 'grid-four', grade: 'vice-sunset', size: 'portrait',
      title: caption, subtitle: 'gone fishing', onePhoto: false });
    await addSample(0, 'boulevard', 'Boulevard — sunset');
    await addSample(1, 'pier', 'Pier — fishing');
    state.panels[0].photo = 0; state.panels[1].photo = 1;
    state.panels[2].photo = 1; state.panels[3].photo = 0;
  } else if (shot === 'square') {
    document.body.classList.add('shot-cover');
    Object.assign(state, { layout: 'tilted-snaps', grade: 'neon-nights', size: 'square',
      title: caption, subtitle: 'downtown after dark', onePhoto: true });
    await addSample(0, photo, photo === 'pier' ? 'Pier — fishing' : 'Boulevard — sunset');
    // Each tilted snap shows a different crop of the same photo.
    state.panels[0].panY = 0.3; state.panels[0].zoom = 1.15;
    state.panels[1].panY = 0.45; state.panels[1].zoom = 1.15;
    state.panels[2].panY = 0.6; state.panels[2].zoom = 1.15;
  } else { // editor
    Object.assign(state, { layout: 'hero-split', grade: 'vice-sunset', size: 'portrait',
      title: caption, subtitle: 'Vice City nights', onePhoto: true });
    await addSample(0, photo, photo === 'pier' ? 'Pier — fishing' : 'Boulevard — sunset');
    await addSample(1, 'pier', 'Pier — fishing');
  }
  syncControls();
  renderAll();
  redraw();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
