import { PrerenderConfig } from '@stencil/core';

export const config: PrerenderConfig = {
  async afterHydrate(doc, url, results) {
    await generateJSON(doc, url, results.filePath);
  }
};
