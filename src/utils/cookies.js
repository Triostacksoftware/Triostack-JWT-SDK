export function cookieOptionsByEnv(NODE_ENV) {
  const isProd = NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'None' : 'Lax',
    maxAge: 24 * 60 * 60 * 1000
  };
}