import { createRouter } from './router';
import { Build } from '@stencil/core';
import { Params, State } from './types';

export const createStaticRouter = () => {
  return createRouter({
    beforePush,
  });
};

export const staticState = (
  mapFn: (params: Params, path: string) => State | Promise<State>
): ((params: State, path: string) => State) => {
  if (Build.isServer) {
    return async (params, path) => {
      params = await mapFn(params, path);
      const script = getStatic();
      script.textContent = JSON.stringify(params);
      return params;
    };
  } else if (Build.isDev) {
    console.error('Static state can only be used in ')
    return (params, path) => {
      console.log(params);
      return mapFn(params, path);
    };
  } else {
    return (_) => {
      const script = getStatic();
      return JSON.parse(script.textContent!);
    };
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
  let data = document.querySelector(`script[data-staticstate]`) as HTMLScriptElement | null;
  if (!data) {
    data = document.createElement('script');
    document.head.appendChild(data);
    data.type = 'json';
    data.setAttribute('data-staticstate', '');
  }
  return data;
};
