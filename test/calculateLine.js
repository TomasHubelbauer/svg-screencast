export default function calculateLine(/** @type {number} */ size) {
  // Calculate the line length - the smallest multiple of four that fits the kine RGB
  const fit = (size * 3) / 4;
  const line = (~~fit < fit ? ~~fit + 1 : ~~fit) * 4;
  return line;
}
