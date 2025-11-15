import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { expect, afterEach } from 'vitest';

import { createElectronApiMock } from './utils';

// Extend Vitest matchers with Testing Library assertions
expect.extend({});

// Clean up after each test
afterEach(() => {
  cleanup();
});

global.window.api = createElectronApiMock();
