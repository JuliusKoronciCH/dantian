export type PropertyPath<T> = {
  [K in keyof T]: K extends string
    ? T[K] extends object
      ? `${K}.${PropertyPath<T[K]>}` | K
      : K
    : never;
}[keyof T];

export type GetValueType<
  T,
  Path extends PropertyPath<T>,
> = Path extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? Rest extends PropertyPath<T[Key]>
      ? GetValueType<T[Key], Rest>
      : never
    : never
  : Path extends keyof T
    ? T[Path]
    : never;

export type NestedEvent<T> = {
  type: PropertyPath<T>;
  payload: GetValueType<T, PropertyPath<T>>;
};
export type SystemEvent<T> =
  | { type: '@@INIT'; payload: T }
  | { type: '@@HYDRATED'; payload: T };
