import { FunctionalComponent } from '@stencil/core';

export type Params = {[prop: string]: string};
export type State = {[prop: string]: any};

export type RoutePath =
  | string
  | RegExp
  | ((path: string) => Params | boolean | undefined | null);

export type RouterState = Readonly<InternalRouterState>;

export type OnChangeHandler<T extends keyof InternalRouterState> = (newValue: InternalRouterState[T], oldValue: InternalRouterState[T]) => void;

  export interface Router {
  readonly Switch: FunctionalComponent<{}>;
  readonly url: URL;
  readonly activePath: string;
  dispose(): void;
  onChange(key: 'url', cb: OnChangeHandler<'url'>): void;
  onChange(key: 'activePath', cb: OnChangeHandler<'activePath'>): void;
  push(href: string): void;
}

export interface RouterProps {
  router: Router;
}

export type RouteProps = RenderProps | RedirectProps;

export interface RenderProps {
  path: RoutePath;
  id?: string;

  mapParams?: (params: Params, path: string) => State;
  render?: (params: Params) => any;
}

export interface RedirectProps {
  path: RoutePath;
  to: string;
}

export interface RouteEntry {
  path: RoutePath;
  jsx?: any;
  mapParams?: any;
  to?: string;
  id?: string;
}

export interface InternalRouterState {
  url: URL;
  activePath: string;
}

export interface RouterOptions {
  parseURL?: (url: URL) => string;
  serializeURL?: (path: string) => URL;
  
  beforePush?: (path: string) => void | Promise<void>;
}
