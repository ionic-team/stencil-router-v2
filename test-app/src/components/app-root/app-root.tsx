import { Component, Prop, Host, h } from '@stencil/core';
import { Route, href } from 'stencil-router-v2';
import { Router } from '../../router';

@Component({
  tag: 'app-root',
  shadow: false,
})
export class AppRoot {

  @Prop() logged = false;

  render() {
    return (
      <Host>
        <Router.Switch>
          {this.logged
            ? [
              <Route path="/" to="/account"/>,
              <Route path="/main" to="/account"/>
            ]
            : <Route path="/" to="/main"/>
          }

          {this.logged && (
            <Route path="/account">
              <app-account></app-account>
            </Route>
          )}

          <Route path="/main">
            <h1>Main</h1>
            <a {...href('/blog/Hello')}>Go to Hello</a>
            <button onClick={() => this.logged = true}>Login</button>
          </Route>

          <Route
            path={/\/blog\/(?<page>.*)/}
            render={({page}) => (
              <h1>Blog {page}</h1>
            )}
          />

        </Router.Switch>
      </Host>
    );
  }
}
