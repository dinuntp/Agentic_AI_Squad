// === INSERT AFTER: export const getStatus = () => req('GET', '/status'); ===

// ─── Config ───────────────────────────────────────────────────────────────────
export const getConfig  = ()        => req('GET', '/config');
export const saveConfig = (entries) => req('PUT', '/config', { entries });
