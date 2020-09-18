<h1 align="center">typed-route</h1>

<h4 align="center">Type safe routes developed for React Router</h4>

Quick example:
```tsx
// constants/routes.ts
import { typedRoute, routeMap } from 'typed-route';

export const routes = {
  list: '/list',
  item: typedRoute<'id'>('/item/:id'),
  form: routeMap(typedRoute<'id'>('/form/:id'), {
    detail: '/detail',
    subForm: typedRoute<'sub'>('/:sub')
  })
};

// routes.tsx
import { routes } from './constants/routes';

const Routes = () => (
  <Router>
    <Route exact path={routes.list} component={ListPage} />
    <Route exact path={routes.item} component={ItemPage} />
    <Route exact path={routes.form.detail} component={FormDetailPage} />
    <Route exact path={routes.form.subForm} component={SubFormPage} />
  </Router>
);

// pages/sub-form.tsx
import { InferTypedRoute } from 'typed-route';
import { RouteComponentProps } from 'react-router-dom';
import { routes } from '../constants/routes';

type SubFormProps = RouteComponentProps<InferTypedRoute<typeof routes.form.subForm>>;

const SubFormPage: React.FC<SubFormProps> = ({ match }) => (
  <div>
    Subform params:
    { match.params.id }
    { match.params.sub }
  </div>
);

// navigation.tsx
import { reverseUrl } from 'typed-route';
import { routes } from './constants/routes';

const Navigation = () => (
  <div>
      <Link to={reverseUrl(routes.item, { id: 1 })}>Link to item</Link>
      <Link to={reverseUrl(routes.form.subForm, { id: 2, sub: 'test' })}>Link to sub form</Link>
      {/* TS Error: Property 'id' is missing */}
      <Link to={reverseUrl(routes.form.subForm, { sub: 'test' })}>Error link</Link>
  </div>
);

```

## Quick Start
### Requirements
- npm or Yarn
- Node.js 10.0.0 or higher
- Typescript 3.5.0 or higher


### Installation
```bash
$ npm install typed-route
```

If you are using Yarn, use the following command.

```bash
$ yarn add typed-route
```

## Usage

### typedRoute
`typedRoute` - generic function creates string with saved context

`typedRoute<'name'>('/:name')` - creates a string route with one param `{ name: string }`

`typedRoute<'id' | 'name'>('/:id/:name')` - creates a string route with a few params `{ id: string, name: string }`

`typedRoute<'id', 'name'>('/:id/:name?')` - you can add optional params `{ id: string, name?: string }`

### routeMap
Creates a route map merging all routes string and contexts

```ts
let routes;
routes = routeMap('/base', {
  page1: '/page1',
  page2: routeMap('/page2', {
    info: '/info',
    form: '/form'
  })
});
console.log(routes);
/* {
  index: '/base',
  page1: '/base/page1',
  page2: {
    index: '/base/page2',
    info: '/base/page2/info',
    form: '/base/page2/form'
  }
} */

```

### reverseUrl
Type safe function generates an url using typed route and route params
```ts
reverseUrl(
  typedRoute('/item'),
); // item

reverseUrl(
  typedRoute<'id'>('/item/:id'),
  { id: 1 }
); // item/1

reverseUrl(
  typedRoute<'id'>('/item/:id'),
); // TS Error

reverseUrl(
  typedRoute<'id'>('/item/:id'),
  {}
); // TS Error: Property 'id' is missing

reverseUrl(
  typedRoute<'id' | 'optional'>('/item/:id/:second'),
  { id: 1, second: 2 }
); // item/1/2

reverseUrl(
  typedRoute<'id', 'optional'>('/item/:id/:optional?'),
  { id: 1 }
); // item/1

reverseUrl(
  typedRoute<'id', 'optional'>('/item/:id/:optional?'),
  { id: 1, optional: 'test' }
); // item/1/test
```

### InferTypedRoute
Infer params from types route
```ts
let route = typedRoute<'id'>('/item/:id');
type I1 = InferTypedRoute<typeof route>;
// { id: string }

route = typedRoute<'id' | 'second'>('/item/:id/:second');
type I2 = InferTypedRoute<typeof route>;
// { id: string; second: string }

route = typedRoute<'id', 'optional'>('/item/:id/:optional?');
type I3 = InferTypedRoute<typeof route>;
// { id: string; optional?: string }

const routes = {
  list: '/list',
  form: routeMap(typedRoute<'id'>('/form/:id'), {
    subForm: routeMap(typedRoute<'sub'>('/:sub'), {
      detail: '/detail',
    })
  })
};
type I5 = InferTypedRoute<typeof routes.form.subForm.detail>;
// { id: string; sub: string }
```
You can use it with react-router
```tsx
type SubFormProps = RouteComponentProps<InferTypedRoute<typeof routes.form.subForm.detail>>;

const SubFormPage: React.FC<SubFormProps> = ({ match }) => (
  <div>
    Subform params:
    { match.params.id }
    { match.params.sub }
  </div>
);
``` 

### InferRouteMap
Generates route map type params
```ts
const routes = {
  list: '/list',
  form: routeMap(typedRoute<'id'>('/form/:id'), {
    info: '/info',
    subForm: routeMap(typedRoute<'sub'>('/:sub'), {
      detail: '/detail',
    })
  })
};
type RoutesParams = InferRouteMap<typeof routes>;
/* {
 list: object;
 form: {
   index: { id: string };
   info: { id: string };
   subForm: {
     index: { id: string };
     detail: { id: string; sub: string }
   }
 }
*/
```
And you can use it with react-router instead of InferTypedRoute
```tsx
type SubFormProps = RouteComponentProps<RoutesParams['form']['subForm']['detail']>;

const SubFormPage: React.FC<SubFormProps> = ({ match }) => (
  <div>
    Subform params:
    { match.params.id }
    { match.params.sub }
  </div>
);
``` 