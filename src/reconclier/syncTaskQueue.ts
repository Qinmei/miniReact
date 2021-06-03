let syncQueue: Function[] = [];

export function scheduleSyncCallback(callback: Function) {
  syncQueue.push(callback);
}

export const flushSyncCallbacks = () => {
  let callback = syncQueue.shift();
  while (callback) {
    callback = callback();
    if (!callback) {
      callback = syncQueue.shift();
    }
  }
  return null;
}