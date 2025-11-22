export default class Store {
  store: any = {}
  constructor(options: any) {
    if (options.schema) {
      for (const key in options.schema) {
        if (options.schema[key].default !== undefined) {
          this.store[key] = options.schema[key].default
        }
      }
    }
  }
  get(key: string) {
    return this.store[key]
  }
  set(key: string, value: any) {
    this.store[key] = value
  }
}
