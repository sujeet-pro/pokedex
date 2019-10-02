export interface IResolveResponse<T> {
  data: T | null;
  error: any;
}

export type IResolveResponseAny = IResolveResponse<any>;
