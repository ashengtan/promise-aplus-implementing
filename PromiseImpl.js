// Promise Implementing
// see: https://promisesaplus.com/
// see: http://malcolmyu.github.io/malnote/2015/06/12/Promises-A-Plus/

const STATUS_PENDING = 'pending'
const STATUS_FULFILLED = 'fulfilled'
const STATUS_REJECTED = 'rejected'

const invokeArrayFns = (fns, arg) => {
  for (let i = 0; i < fns.length; i++) {
    fns[i](arg)
  }
}

// 2.3 The Promise Resolution Procedure
// Promise 解决过程
const promiseResolutionProcedure = (promise, x, resolve, reject) => {
  // 2.3.1 If promise and x refer to the same object, reject promise with a TypeError as the reason
  // 如果 `promise` 和 `x` 指向同一对象，以 `TypeError` 为据因拒绝执行 `promise`
  if (promise === x) {
    return reject(new TypeError('Chaining cycle detected for promise'))
  }

  // 2.3.2 If `x` is a promise, adopt its state:
  //   2.3.2.1 If `x` is pending, `promise` must remain pending until `x` is fulfilled or rejected.
  //   2.3.2.2 If/when `x` is fulfilled, fulfill `promise` with the same value.
  //   2.3.2.3 If/when `x` is rejected, reject `promise` with the same reason.
  // 如果 `x` 是一个 promise，则需要递归执行
  if (x instanceof PromiseImpl) {
    return x.then(
      value => promiseResolutionProcedure(promise, value, resolve, reject),
      reject
    )
  }

  let called = false

  if ((x !== null && typeof x === 'object') || typeof x === 'function') {
    // 2.3.3 Otherwise, if x is an object or function
    try {
      // 2.3.3.1 Let then be x.then
      let then = x.then

      if (typeof then === 'function') {
        // 2.3.3.3 If then is a function, call it with `x` as `this`, first argument resolvePromise, and second argument rejectPromise
        // 如果 `then` 是函数，将 `x` 作为函数的作用域 `this` 调用之。
        // 传递两个回调函数作为参数，第一个参数叫做 `resolvePromise` ，第二个参数叫做 `rejectPromise`
        then.call(
          // call it with `x` as `this`
          x,
          // `resolvePromise`
          // 2.3.3.3.1 If/when `resolvePromise` is called with a value `y`, run `[[Resolve]](promise, y)`.
          // 如果 `resolvePromise` 以值 `y` 为参数被调用，则运行 `[[Resolve]](promise, y)`
          // 注：递归调用 `resolvePromise`，因为 `promise` 中可以嵌套 `promise`
          y => {
            // 2.3.3.3.3 If both `resolvePromise` and `rejectPromise` are called, or multiple calls to the same argument are made,
            // the first call takes precedence, and any further calls are ignored.
            // 如果 `resolvePromise` 和 `rejectPromise` 均被调用，或者被同一参数调用了多次，
            // 则优先采用首次调用并忽略剩下的调用
            if (called) {
              return
            }
            called = true

            promiseResolutionProcedure(promise, y, resolve, reject)
          },
          // `rejectPromise`
          // 2.3.3.3.2 If/when `rejectPromise` is called with a reason `r`, reject `promise` with `r`
          // 如果 `rejectPromise` 以据因 `r` 为参数被调用，则以据因 `r` 拒绝 `promise`
          r => {
            // 2.3.3.3.3
            if (called) {
              return
            }
            called = true

            reject(r)
          }
        )
      } else {
        // 2.3.3.4 If `then` is not a function, fulfill `promise` with `x`
        resolve(x)
      }
    } catch (e) {
      // 2.3.3.3.3
      if (called) {
        return
      }
      called = true

      // 2.3.3.2 If retrieving the property `x.then` results in a thrown exception `e`,
      // reject `promise` with `e` as the reason.
      // 如果取 `x.then` 的值时抛出错误 `e` ，则以 `e` 为据因拒绝 `promise`

      // 2.3.3.3.4 If calling `then` throws an exception `e`
      //   2.3.3.3.4.1 If `resolvePromise` or `rejectPromise` have been called, ignore it
      //   2.3.3.3.4.2 Otherwise, reject `promise` with `e` as the reason

      reject(e)
    }

  } else {
    // 2.3.4 If `x` is not an object or function, fulfill `promise` with `x`
    resolve(x)
  }
}

class PromiseImpl {
  constructor(executor) {
    // `Promise` 当前的状态
    this.status = STATUS_PENDING
    // fulfilled 的值
    this.value = null
    // rejected 的原因
    this.reason = null
    // 用于保存 `then()` 中的回调，一个 `Promise` 对象可以注册多个 `then()` 回调函数
    this.onFulfilledCbs = []
    // 用于保存 `catch()` 中的回调，一个 `Promise` 对象可以注册多个 `catch()` 回调函数
    this.onRejectedCbs = []

    const resolve = value => {
      if (this.status === STATUS_PENDING) {
        this.status = STATUS_FULFILLED
        this.value = value
        invokeArrayFns(this.onFulfilledCbs, this.value)
      }
    }

    const reject = reason => {
      if (this.status === STATUS_PENDING) {
        this.status = STATUS_REJECTED
        this.reason = reason
        invokeArrayFns(this.onRejectedCbs, this.reason)
      }
    }

    try {
      executor(resolve, reject)
    } catch (e) {
      reject(e)
    }
  }

  then(onFulfilled, onRejected) {
    // 2.2.1 Both `onFulfilled` and `onRejected` are optional arguments:
    //   2.2.1.1 If `onFulfilled` is not a function, it must be ignored
    //   2.2.1.2 If `onRejected` is not a function, it must be ignored

    // 2.2.7.3 If `onFulfilled` is not a function and `promise1` is fulfilled, 
    // `promise2` must be fulfilled with the same value as `promise1`.
    // 2.2.7.4 If `onRejected` is not a function and `promise1` is rejected, 
    // `promise2` must be rejected with the same reason as `promise1`.
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value
    onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason }

    let promise2 = new PromiseImpl((resolve, reject) => {
      // 2.2.2 If `onFulfilled` is a function:
      //   2.2.2.1 it must be called after `promise` is fulfilled, with promise’s value as its first argument.
      //   2.2.2.2 it must not be called before `promise` is fulfilled.
      //   2.2.2.3 it must not be called more than once.
      if (this.status === STATUS_FULFILLED) {
        setTimeout(() => {
          try {
            // 2.2.7.1 If either `onFulfilled` or `onRejected` returns a value `x`, 
            // run the Promise Resolution Procedure `[[Resolve]](promise2, x)`.
            // 如果 `onFulfilled` 或者 `onRejected` 返回一个值 `x` ，
            // 则运行 Promise 解决过程：`[[Resolve]](promise2, x)`。
            // 在这里是指运行 `promiseResolutionProcedure()` 方法
            let x = onFulfilled(this.value)
            promiseResolutionProcedure(promise2, x, resolve, reject)
          } catch (e) {
            // 2.2.7.2 If either `onFulfilled` or `onRejected` throws an exception `e`, 
            // `promise2` must be rejected with `e` as the reason.
            // 如果 `onFulfilled` 或者 `onRejected` 抛出一个异常 `e` ，则 `promise2` 必须拒绝执行，并返回拒因 `e`
            reject(e)
          }
        }, 0)
      }

      // 2.2.3 If onRejected is a function:
      //   2.2.3.1 it must be called after promise is rejected, with promise’s reason as its first argument.
      //   2.2.3.2 it must not be called before promise is rejected.
      //   2.2.3.3 it must not be called more than once.
      if (this.status === STATUS_REJECTED) {
        setTimeout(() => {
          try {
            // 2.2.7.1
            let x = onRejected(this.reason)
            promiseResolutionProcedure(promise2, x, resolve, reject)
          } catch (e) {
            // 2.2.7.2
            reject(e)
          }
        }, 0)
      }

      if (this.status === STATUS_PENDING) {
        this.onFulfilledCbs.push(() => {
          setTimeout(() => {
            try {
              let x = onFulfilled(this.value)
              promiseResolutionProcedure(promise2, x, resolve, reject)
            } catch (e) {
              reject(e)
            }
          }, 0)
        })

        this.onRejectedCbs.push(() => {
          setTimeout(() => {
            try {
              let x = onRejected(this.reason)
              promiseResolutionProcedure(promise2, x, resolve, reject)
            } catch (e) {
              reject(e)
            }
          }, 0)
        })
      }
    })

    // 2.2.4 `onFulfilled` or `onRejected` must not be called until the execution context stack contains only platform code.
    // 确保 `onFulfilled` 和 `onRejected `方法异步执行，且应该在 `then` 方法被调用的那一轮事件循环之后的新执行栈中执行。
    // 这里并没有要求必须微任务机制（micro-task）来实现这个事件队列，采用宏任务机制（macro-task）也是可以的。
    // 在上面的代码中，我们采用了宏任务 `setTimeout()` 来实现，这样也是可以通过测试用例的。

    // 2.2.7 `then` must return a promise

    return promise2
  }

  catch(onRejected) {
    this.then(null, onRejected)
  }

  finally(onFinally) {
    return this.then(
      value => PromiseImpl.resolve(onFinally()).then(() => value), 
      reason => PromiseImpl.resolve(onFinally()).then(() => { throw reason })
    )
  }

  static resolve(value) {
    return new PromiseImpl((resolve, reject) => resolve(value))
  }

  static reject(reason) {
    return new PromiseImpl((resolve, reject) => reject(reason))
  }

  static all(iterable) {
    // TODO: Implement `Promise.all(iterable)`
  }

  static race(iterable) {
    // TODO: Implement `Promise.race(iterable)`
  }

  static allSettled(iterable) {
    // TODO: Implement `Promise.allSettled(iterable)`
  }

  static any(iterable) {
    // TODO: Implement `Promise.any(iterable)`
  }
}

PromiseImpl.defer = PromiseImpl.deferred = () => {
  const dfd = {}
  dfd.promise = new PromiseImpl((resolve, reject) => {
    dfd.resolve = resolve
    dfd.reject = reject
  })

  return dfd
}

module.exports = PromiseImpl