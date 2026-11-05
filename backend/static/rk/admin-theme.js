// The admin uses a fixed light theme. Reset any theme preference saved in this
// browser from an earlier dark/auto setting so it can't override the colours.
try {
  if (localStorage.getItem('_x_adminTheme') !== '"light"') {
    localStorage.setItem('_x_adminTheme', '"light"')
  }
} catch (error) {
  // Storage blocked (private mode) — nothing to reset.
}
