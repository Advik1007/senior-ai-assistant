type Listener = () => void;

const listeners = new Set<Listener>();

export function subscribeStore(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitStore(): void {
  listeners.forEach((listener) => listener());
}
