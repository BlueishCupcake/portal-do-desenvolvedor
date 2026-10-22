import '@testing-library/jest-dom/vitest';

import { afterEach, vi } from 'vitest';

vi.stubEnv('VITE_AZURE_DEVOPS_PROVIDER', 'mock');

import { LEAD_MODE_STORAGE_KEY } from '@/app/providers/leadModeContext.ts';
import { THEME_STORAGE_KEY } from '@/app/providers/themeContext.ts';
import { TODOS_STORAGE_KEY } from '@/utils/todosStorage.ts';

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

class IntersectionObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

Object.defineProperty(globalThis, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverStub,
});

Object.defineProperty(globalThis, 'IntersectionObserver', {
  writable: true,
  value: IntersectionObserverStub,
});

if (!window.matchMedia) {
  window.matchMedia = () =>
    ({
      matches: false,
      media: '',
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return false;
      },
    }) as MediaQueryList;
}

afterEach(() => {
  document.documentElement.removeAttribute('data-theme');
  window.localStorage.removeItem(THEME_STORAGE_KEY);
  window.localStorage.removeItem(LEAD_MODE_STORAGE_KEY);
  window.localStorage.removeItem(TODOS_STORAGE_KEY);
});
