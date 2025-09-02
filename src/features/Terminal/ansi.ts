// Utility to strip ANSI escape sequences, OSC sequences, and most control chars
// Preserves newlines and tabs; normalizes CRLF to LF.
export function stripAnsi(input: string): string {
  if (!input) return '';

  let out = input.replace(/\r\n?/g, '\n');

  // Strip OSC sequences: ESC ] ... BEL or ESC \
  out = out.replace(/\x1B\][^\x07\x1B]*(?:\x07|\x1B\\)/g, '');

  // Strip DCS, SOS, PM, APC sequences: ESC P, ESC X, ESC ^, ESC _ ... (terminated by ST or BEL)
  out = out.replace(/\x1B[PX_^][^\x1B\x07]*(?:\x07|\x1B\\)/g, '');

  // Strip CSI sequences: ESC [ ... final byte @-~
  out = out.replace(/\x1B\[[0-?]*[ -\/]*[@-~]/g, '');

  // Strip single-ESC sequences including SCS like ESC ( B: ESC + optional intermediates (0x20-0x2F) + final (0x30-0x7E)
  out = out.replace(/\x1B[\x20-\x2F]*[\x30-\x7E]/g, '');

  // Remove remaining control chars except TAB (\t) and LF (\n)
  out = out.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return out;
}


