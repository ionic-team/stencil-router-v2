import { FunctionalComponent, Build } from '@stencil/core';
import { createStore } from '@stencil/store';
import type {
  Router,
  RouterOptions,
  InternalRouterState,
  RouteEntry,
  RouteProps,
  RoutePath,
} from './types';

let defaultRouter: Router | undefined;

export const createRouter = (opts?: RouterOptions): Router => {
  const win = window;
  const { state, onChange, dispose } = createStore<InternalRouterState>(
    {
      url: new URL(win.location.href),
      urlParams: {},
      routes: [],
    },
    (newV, oldV, prop) => {
      if (prop === 'url') {
        return newV.href !== oldV.href;
      }
      return newV !== oldV;
    }
  );

  const parseURL = opts?.parseURL ?? DEFAULT_PARSE_URL;

  const push = (href: string) => {
    history.pushState(null, null as any, href);
    state.url = new URL(href, document.baseURI);
  };

  const match = () => {
    const { routes, url } = state;
    const pathname = parseURL(url);
    for (let route of routes) {
      const params = matchPath(pathname, route.path);
      if (params) {
        if (route.to != null) {
          push(route.to);
          return;
        } else {
          state.activeRoute = route;
          state.urlParams = params;
          break;
        }
      }
    }
  };

  const navigationChanged = () => {
    state.url = new URL(win.location.href);
  };

  const Switch: any = (_: any, childrenRoutes: RouteEntry[]) => {
    state.routes = childrenRoutes;
    const selectedRoute = state.activeRoute;
    if (selectedRoute) {
      if (typeof selectedRoute.jsx === 'function') {
        return selectedRoute.jsx(state.urlParams);
      } else {
        return selectedRoute.jsx;
      }
    }
  };

  const disposeRouter = () => {
    defaultRouter = undefined;
    win.removeEventListener('popstate', navigationChanged);
    dispose();
  };

  const router = defaultRouter = {
    Switch,
    state,
    push,
    dispose: disposeRouter,
  };

  // Listen for state changes
  onChange('routes', match);
  onChange('url', match);

  // Initial update
  navigationChanged();

  // Listen URL changes
  win.addEventListener('popstate', navigationChanged);

  return router;
};

export const Route: FunctionalComponent<RouteProps> = (props, children) => {
  if ('to' in props) {
    return {
      path: props.path,
      to: props.to,
    } as any;
  }
  if (Build.isDev && props.render && children.length > 0) {
    console.warn('Route: if `render` is provided, the component should not have any childreen');
  }
  return {
    path: props.path,
    jsx: props.render ?? children,
  } as any;
};

export const href = (href: string, router: Router | undefined = defaultRouter) => {
  if (Build.isDev && !router) {
    throw new Error('Router must be defined in href');
  }
  return {
    href,
    onClick: (ev: Event) => {
      ev.preventDefault();
      router.push(href);
    },
  };
};

const matchPath = (pathname: string, path: RoutePath): {[params: string]: any} => {
  if (typeof path === 'string') {
    if (path === pathname) {
      return {};
    }
  } else if (typeof path === 'function') {
    const params = path(pathname);
    if (params) {
      return params === true
        ? {}
        : { ...params };
    }
  } else {
    const results = path.exec(pathname);
    if (results) {
      path.lastIndex = 0;
      return { ...results };
    }
  }
  return undefined;
};

const DEFAULT_PARSE_URL = (url: URL) => {
  return url.pathname.toLowerCase();
};

export const NotFound = () => ({});
