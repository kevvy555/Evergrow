export function cellKey(x, y) {
  return `${x},${y}`;
}

export function orthogonalNeighbours(x, y, columns, rows) {
  return [
    { x: x - 1, y },
    { x: x + 1, y },
    { x, y: y - 1 },
    { x, y: y + 1 },
  ].filter((cell) => cell.x >= 0 && cell.y >= 0 && cell.x < columns && cell.y < rows);
}

export function allNeighbours(x, y, columns, rows) {
  const cells = [];
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < columns && ny < rows) cells.push({ x: nx, y: ny });
    }
  }
  return cells;
}
