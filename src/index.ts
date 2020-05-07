import { FunctionalComponent, Build } from '@stencil/core';
import { createStore } from '@stencil/store';

export type RoutePath = string | RegExp | ((path: string) => {[params: string]: string} | undefined);

export type RouterState = Readonly<InternalRouterState>;

export interface Router {
  readonly state: Readonly<RouterState>;
  readonly Cmp: FunctionalComponent<{}>;

  dispose(): void;
  push(href: string): void;
}

export interface RouterProps {
  router: Router;
}

export type RouteProps = RenderProps | RedirectProps;

export interface RenderProps {
  path: RoutePath;
  render?: (params: {[param: string]: string}) => any;
}

export interface RedirectProps {
  path: RoutePath;
  to: string;
}

export interface RouteEntry {
  path: RoutePath;
  jsx?: any;
  to?: string;
}

interface InternalRouterState {
  url: URL;
  selectedRoute?: RouteEntry;
  urlParams: {[key: string]: string};
  routes: RouteEntry[];
}

export interface RouterOptions {
  parseURL?: (url: URL) => string;
  serializeURL?: (path: string) => URL;
}

let defaultRouter: Router | undefined;

export const createHashRouter = (): Router => {
  return createRouter({
    serializeURL: (path) => {
      return new URL(`#${path}`, document.location.href);
    },
    parseURL: (url) => {
      const path = url.href.substr(1);
      if (path[0] !== '/') {
        return '/' + path;
      }
      return path;
    }
  })
}


export const createRouter = (opts?: RouterOptions): Router => {
  const parseURL = opts?.parseURL ?? DEFAULT_PARSE_URL;
  const defaultState = {
    url: new URL(window.location.href),
    urlParams: {},
    routes: []
  };
  const { state, onChange, dispose } = createStore<InternalRouterState>(defaultState, (newV, oldV, prop) => {
    if (prop === 'url') {
      return newV.href !== oldV.href;
    }
    return newV !== oldV;
  });

  const push = (href: string) => {
    history.pushState(null, null as any, href);
    state.url = new URL(href, document.baseURI);
  };

  const matchPath = (pathname: string, path: RoutePath) => {
    if (typeof path === 'string') {
      if (path === pathname) {
        return {};
      }
    } else if (typeof path === 'function') {
      const params = path(pathname);
      if (params != undefined) {
        return {...params};
      }
    } else {
      const results = path.exec(pathname);
      if (results) {
        path.lastIndex = 0;
        return {...results.groups};
      }
    }
    return undefined;
  };


  const match = () => {
    const {routes, url} = state;
    const pathname = parseURL(url);
    for (let route of routes) {
      const params = matchPath(pathname, route.path);
      if (params) {
        if (route.to != null) {
          push(route.to);
          return;
        } else {
          state.selectedRoute = route;
          state.urlParams = params;
          break;
        }
      }
    }
  };

  const navigationChanged = () => {
    state.url = new URL(document.location.href);
  };

  // Listen for state changes
  onChange('routes', match);
  onChange('url', match);

  // Listen URL changes
  window.addEventListener('popstate', navigationChanged);

  // Initial update
  navigationChanged();

  const Cmp: any = (_: any, childrenRoutes: RouteEntry[]) => {
    state.routes = childrenRoutes;
    const selectedRoute = state.selectedRoute;
    if (selectedRoute) {
      if (typeof selectedRoute.jsx === 'function') {
        return selectedRoute.jsx(state.urlParams);
      } else {
        return selectedRoute.jsx as any;
      }
    }
  };

  const router = defaultRouter= {
    Cmp,
    state,
    dispose: () => {
      defaultRouter = undefined;
      window.removeEventListener('popstate', navigationChanged);
      dispose();
    },
    push: (href: string) => {
      state.url = new URL(href, document.baseURI);
      history.pushState(null, null as any, href);
    }
  };
  return router;
};


export const Route: FunctionalComponent<RouteProps> = (props, children) => {
  if ('to' in props) {
    return {
      path: props.path,
      to: props.to
    };
  } else {
    if (Build.isDev && props.render && children.length > 0) {
      console.warn('Route: if `render` is provided, the component should not have any childreen');
    }
    const route: RouteEntry = {
      path: props.path,
      jsx: props.render ?? children,
    };
    return route as any;
  }
}

export const href = (href: string, router: Router | undefined = defaultRouter) => {
  if (!router) {
    throw new Error('Router must be defined in href');
  }
  return {
    href,
    onClick: (ev: Event) => {
      ev.preventDefault();
      router.push(href);
    }
  }
};

const DEFAULT_PARSE_URL = (url: URL) => {
  return url.pathname.toLowerCase();
};

export const NotFound = () => ({});
