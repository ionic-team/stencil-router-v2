import { createRouter } from './router';
import { Build } from '@stencil/core';
import type { Params, State } from './types';

export const createStaticRouter = () =>
  createRouter({
    beforePush,
  });

export const staticState = (mapFn: (params: Params, path: string) => State | Promise<State>): ((params: State, path: string) => State) => {
  if (Build.isServer) {
    return async (params, path) => {
      params = await mapFn(params, path);
      const script = getStatic();
      script.textContent = JSON.stringify(params);
      return params;
    };
  } else if (Build.isDev) {
    console.error('Static state can only be used in ');
    return (params, path) => {
      params = mapFn(params, path);
      if ('then' in params) {
        console.error('Dev mode should provide syncronous static data.');
        return {};
      }
      return params;
    };
  } else {
    return () => JSON.parse(getStatic().textContent!);
  }
};

const beforePush = async (path: string) => {
  try {
    path = path.endsWith('/') ? path : path + '/';
    const res = await fetch(path + 'data.json', {
      cache: 'force-cache',
    });
    if (res.ok) {
      const json = await res.text();
      const script = getStatic();
      script.textContent = json;
    }
  } catch (e) {}
};

const getStatic = () => {
  let staticDataElm = document.querySelector(`script[data-staticstate]`) as HTMLScriptElement | null;
  if (!staticDataElm) {
    staticDataElm = document.createElement('script');
    staticDataElm.setAttribute('type', 'application/json');
    staticDataElm.setAttribute('data-staticstate', '');
    document.body.appendChild(staticDataElm);
  }
  return staticDataElm;
};
