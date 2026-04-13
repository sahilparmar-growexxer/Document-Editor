function midpointOrder(left, right) {
  if (left == null && right == null) return 1;
  if (left == null) return right - 1;
  if (right == null) return left + 1;
  return (left + right) / 2;
}

export { midpointOrder };
