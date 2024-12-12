export default class Utils {
  /**
   * @description 同 {Promise.withResolvers}
   * @returns {{ promise: Promise, resolve: (value: any) => void, reject:(reason?: any) => void }}
   */
  static withResolvers() {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    const resolver = { promise, resolve, reject };
    return resolver;
  }
  static BoxTypeEnum = {
    cloud: 1,
    rect: 2,
    line: 3,
  }
  static ManagerTypeEnum = {
    pdf: 'pdf',
  }
  static EventTypeEnum = {
    POINT: 'POINT',
    MARK: 'MARK',
    DONE: 'DONE',
  }
}