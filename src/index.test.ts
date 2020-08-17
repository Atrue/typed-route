import { A } from 'ts-toolbelt';
import {
  routeMap, typedRoute, reverseUrl, TypedRoute, InferTypedRoute, InferRouteMap,
// eslint-disable-next-line import/extensions,import/no-unresolved
} from './index';

type InferAssertEqual<T, Expected> = A.Equals<InferTypedRoute<T>, InferTypedRoute<Expected>>

describe('typedRoute', () => {
  it('should be compiled', () => {
    expect(typedRoute('test')).toStrictEqual('test');
    expect(typedRoute<'p1' | 'p2'>('test')).toStrictEqual('test');
    expect(typedRoute<'p1' | 'p2', 'o1' | 'o2'>('test')).toStrictEqual('test');
    expect(typedRoute<{ arg: string }>('test')).toStrictEqual('test');
  });
});

describe('routeMap', () => {
  it('should generate simple routeMap', () => {
    expect(routeMap('', {
      base: '/',
      page1: '/page1',
    })).toStrictEqual({
      index: '',
      base: '/',
      page1: '/page1',
    });
  });

  it('should generate deep routeMap', () => {
    expect(routeMap('', {
      base: '/',
      page1: '/page1',
      page2: routeMap('/page2', {
        base: '/',
        info: '/info',
        sub: routeMap('/sub/:param', {
          info: '/info',
        }),
      }),
    })).toStrictEqual({
      index: '',
      base: '/',
      page1: '/page1',
      page2: {
        index: '/page2',
        base: '/page2/',
        info: '/page2/info',
        sub: {
          index: '/page2/sub/:param',
          info: '/page2/sub/:param/info',
        },
      },
    });
  });

  it('should generate index routes', () => {
    const routes = {
      base: '/',
      page1: '/page1',
      page2: routeMap('/page2', {
        base: '/',
        info: '/info',
        sub: routeMap('/sub/:param', {
          index: '/index',
          info: '/info',
        }),
      }),
    };
    expect(routes.page2.index).toEqual('/page2');
    expect(routes.page2.sub.index).toEqual('/page2/sub/:param/index');
  });

  it('should generate correct types', () => {
    const routes = {
      test: '',
      page2: routeMap(typedRoute<'id'>('/:id'), {
        info: '/info',
        sub: routeMap(typedRoute<'param'>('/sub/:param'), {
          info: '/info',
          last: typedRoute<never, 'last'>('/:last'),
        }),
      }),
    };
    const hasCorrectInfoType: InferAssertEqual<
      typeof routes.page2.info,
      TypedRoute<{ id: string | number }>
    > = 1;
    expect(hasCorrectInfoType).toBe(1);

    const hasCorrectLastType: InferAssertEqual<
      typeof routes.page2.sub.last,
      TypedRoute<{ id: string | number, param: string | number, last?: string | number }>
      > = 1;
    expect(hasCorrectLastType).toBe(1);

    const assertLastIsOptional: InferAssertEqual<
      typeof routes.page2.sub.last,
      TypedRoute<{ id: string | number, param: string | number, last: string | number }>
      > = 0;
    expect(assertLastIsOptional).toBe(0);

    const assertEmptyLastParam: InferAssertEqual<
      typeof routes.page2.sub.last,
      TypedRoute<{ id: string | number, param: string | number }>
      > = 0;
    expect(assertEmptyLastParam).toBe(0);

    type InferredRoutes = InferRouteMap<typeof routes>;
    const hasCorrectInferredRoutes: A.Equals<
      InferredRoutes['page2']['sub']['index'],
      { id: string | number, param: string | number }
    > = 1;
    expect(hasCorrectInferredRoutes).toBe(1);
  });
});

describe('reverseUrl', () => {
  it('should return the same url if url is static', () => {
    expect(reverseUrl('test')).toEqual('test');
    expect(reverseUrl('/url/next', { param: 1 })).toEqual('/url/next');
  });

  it('should throw an error if pass no params for dynamic url', () => {
    expect(() => reverseUrl('/:id')).toThrow('Expected "id" to be a string');
    expect(() => reverseUrl('/:id/sub/:next')).toThrow();
  });

  it('should generate url', () => {
    expect(reverseUrl('/:id', { id: 1 })).toEqual('/1');
    expect(reverseUrl('/:id/sub/:next', { id: 1, next: 'test' })).toEqual('/1/sub/test');
    expect(reverseUrl('/:id/sub/:next/:optional?', { id: 1, next: 'test' })).toEqual('/1/sub/test');
    expect(reverseUrl('/:id/sub/:next/:optional?', { id: 1, next: 'test', optional: 5 })).toEqual('/1/sub/test/5');
  });
});

describe('example', () => {
  it('should compile and work', () => {
    const routes = routeMap('', {
      page2: routeMap(typedRoute<'id'>('/:id'), {
        info: '/info',
        sub: routeMap(typedRoute<'param'>('/sub/:param'), {
          info: '/info',
          last: typedRoute<never, 'last'>('/:last?'),
        }),
      }),
    });
    expect(reverseUrl(routes.page2.sub.last, {
      id: 1,
      param: 'test',
    })).toEqual('/1/sub/test');
    expect(reverseUrl(routes.page2.sub.last, {
      id: 1,
      param: 'test',
      last: 5,
    })).toEqual('/1/sub/test/5');
  });
});
