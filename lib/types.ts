export type IsObject<T> = T extends object ? true : false;

export type PropertyPath<T> = {
  [K in keyof T]: IsObject<T[K]> extends true ? PropertyPath<T[K]> : string;
}[keyof T];

export type GetValueType<
  T,
  P extends PropertyPath<T>,
> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? GetValueType<T[K], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;

export interface NestedEvent<T> {
  type: PropertyPath<T>;
  payload: GetValueType<T, PropertyPath<T>>;
}
export type SystemEvent<T> =
  | { type: '@@INIT'; payload: T }
  | { type: '@@HYDRATED'; payload: T };
