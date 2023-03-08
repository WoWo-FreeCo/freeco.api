export function parseECPayResponse<T>(res: string): Partial<T> {
  const object: Partial<T> = {};

  res.split('&').forEach((v) => {
    const kp = v.split('=');
    object[kp[0]] = kp[1];
  });

  return object;
}
