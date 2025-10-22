export function luhnCheck(num: string): boolean {
  const sanitized = num.replace(/\s+/g, '');
  if (!/^\d+$/.test(sanitized)) return false;
  let sum = 0, toggle = false;
  for (let i = sanitized.length - 1; i >= 0; i--) {
    let d = parseInt(sanitized[i], 10);
    if (toggle) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    toggle = !toggle;
  }
  return sum % 10 === 0;
}
