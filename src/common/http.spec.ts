import { asList, stringList } from './http';

describe('http helpers', () => {
  it('unwraps list payloads from the live backends', () => {
    expect(asList([{ id: 1 }])).toHaveLength(1);
    expect(asList({ data: [{ id: 2 }] })).toHaveLength(1);
    expect(asList({ products: [{ id: 3 }] })).toHaveLength(1);
    expect(asList({ status: 'ok' })).toHaveLength(0);
  });

  it('splits comma and newline lists', () => {
    expect(stringList('a, b\nc')).toEqual(['a', 'b', 'c']);
    expect(stringList(['x'])).toEqual(['x']);
  });
});
