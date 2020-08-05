import { FunctionalComponent, Build } from '@stencil/core';
import { createStore } from '@stencil/store';
import type {
  Router,
  RouterOptions,
  InternalRouterState,
  RouteEntry,
  RouteProps,
  RoutePath,
  Params,
} from './types';

interface MatchResult {
  params: Params;
  route: RouteEntry;
}
let defaultRouter: Router | undefined;

export const createRouter = (opts?: RouterOptions): Router => {
  const win = window;
  const url = new URL(win.location.href);
  const parseURL = opts?.parseURL ?? DEFAULT_PARSE_URL;
  const beforePush = opts?.beforePush ?? (() => {return;});

  const { state, onChange, dispose } = createStore<InternalRouterState>({
    url,
    activePath: parseURL(url)
  }, (newV, oldV, prop) => {
    if (prop === 'url') {
      return newV.href !== oldV.href;
    }
    return newV !== oldV;
  });

  const push = (href: string) => {
    history.pushState(null, null as any, href);
    const url = new URL(href, document.baseURI);
    state.url = url;
    state.activePath = parseURL(url);
  };

  const match = (routes: RouteEntry[]): MatchResult | undefined => {
    const { activePath } = state;
    for (let route of routes) {
      const params = matchPath(activePath, route.path);
      if (params) {
        if (route.to != null) {
          push(route.to);
          return match(routes);
        } else {
          return {params, route};
        }
      }
    }
    return undefined;
  };

  const navigationChanged = () => {
    const url = new URL(win.location.href);
    state.url = url;
    state.activePath = parseURL(url);
  };

  const Switch: any = (_: any, childrenRoutes: RouteEntry[]) => {
    const result = match(childrenRoutes);
    if (result) {
      if (typeof result.route.jsx === 'function') {
        let params = result.params;
        if (result.route.mapParams) {
          params = result.route.mapParams(params);
        }
        return result.route.jsx(params);
      } else {
        return result.route.jsx;
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
    get url() {
      return state.url;
    },
    get activePath() {
      return state.activePath;
    },
    push: async (href) => {
      await beforePush(href);
      push(href);
    },
    onChange: onChange as any,
    dispose: disposeRouter,
  };

  // Initial update
  navigationChanged();

  // Listen URL changes
  win.addEventListener('popstate', navigationChanged);

  return router;
};

export const Route: FunctionalComponent<RouteProps> = (props, children) => {
  if ('to' in props) {
    const entry: RouteEntry = {
      path: props.path,
      to: props.to,
    };
    return entry as any;
  }
  if (Build.isDev && props.render && children.length > 0) {
    console.warn('Route: if `render` is provided, the component should not have any children');
  }
  const entry: RouteEntry = {
    path: props.path,
    id: props.id,
    jsx: props.render ?? children,
    mapParams: props.mapParams,
  };
  return entry as any;
};

export const href = (href: string, router: Router | undefined = defaultRouter) => {
  if (!router) {
    throw new Error('Router must be defined in href');
  }
  return {
    href,
    onClick: (ev: MouseEvent) => {
      if (ev.metaKey || ev.ctrlKey) {
        return;
      }

      if (ev.which == 2 || ev.button == 1) {
        return;
      }

      ev.preventDefault();
      router.push(href);
    },
  };
};

const matchPath = (pathname: string, path: RoutePath): Params | undefined => {
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
    const results = path.exec(pathname) as any;
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
