import { FunctionalComponent } from '@stencil/core';

export type RoutePath =
  | string
  | RegExp
  | ((path: string) => { [params: string]: string } | boolean | undefined | null);

export type RouterState = Readonly<InternalRouterState>;

export type OnChangeHandler<T extends keyof InternalRouterState> = (newValue: InternalRouterState[T], oldValue: InternalRouterState[T]) => void;

  export interface Router {
  readonly state: Readonly<RouterState>;
  readonly Switch: FunctionalComponent<{}>;

  dispose(): void;
  onChange(key: 'url', cb: OnChangeHandler<'url'>);
  onChange(key: 'activeRoute', cb: OnChangeHandler<'activeRoute'>);
  push(href: string): void;
}

export interface RouterProps {
  router: Router;
}

export type RouteProps = RenderProps | RedirectProps;

export interface RenderProps {
  path: RoutePath;
  id?: string;
  render?: (params: { [param: string]: string }) => any;
}

export interface RedirectProps {
  path: RoutePath;
  to: string;
}

export interface RouteEntry {
  path: RoutePath;
  jsx?: any;
  to?: string;
  id?: string;
}

export interface InternalRouterState {
  url: URL;
  activeRoute?: RouteEntry;
  urlParams: { [key: string]: string };
  routes: RouteEntry[];
}

export interface RouterOptions {
  parseURL?: (url: URL) => string;
  serializeURL?: (path: string) => URL;
}
