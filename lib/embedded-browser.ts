/**
 * Detects in-app/embedded browsers that are blocked by Google OAuth.
 */
export function isEmbeddedBrowser(userAgent?: string): boolean {
  const rawUserAgent =
    userAgent ??
    (typeof navigator !== 'undefined' ? navigator.userAgent : undefined) ??
    '';
  const ua = rawUserAgent.trim();
  if (!ua) return false;

  const embeddedPattern =
    /FBAN|FBAV|FB_IAB|Instagram|Messenger|Line\/?|TikTok|Musical_ly|Snapchat/i;
  const webViewPattern = /WebView|\bwv\b|; wv\)/i;
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const hasKnownIOSBrowser = /Safari|CriOS|FxiOS|EdgiOS/i.test(ua);

  return (
    embeddedPattern.test(ua) ||
    webViewPattern.test(ua) ||
    (isIOS && !hasKnownIOSBrowser)
  );
}

export function getEmbeddedOAuthMessage(): string {
  return 'You are using an in-app browser (Messenger/Instagram). Google sign-in may fail there. If it does, open this page in Chrome or Safari and try again.';
}
