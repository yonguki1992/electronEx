import {describe, expect, it, assert} from 'vitest';
import {useTsUtils} from "../src/composables/common/useTsUtils";
import {reactive, ref, toRef} from "vue";
import {ResultWrapper} from "../src/model";
const {
  recordTime,
  matchHelper,
  isValidValue,
  bypassValue,
  returnFalse,
  filteringPayload,
  checkValidation,
  doConcurrentAsyncTask,
  timeoutTask
} = useTsUtils();

const testFailMsg: string = "검증 실패";
describe("전체 테스트", () => {
  describe("1. useTsUtils 테스트", () => {
    describe("1.1. isValidValue 테스트", () => {
      it( "1.1.1. 빈 객체 검증 => false", () => {
        assert.isFalse(isValidValue({}), testFailMsg);
      });

      it( "1.1.2. 빈 배열 검증 => false", () => {
        assert.isFalse(isValidValue([]), testFailMsg);
      });

      it( "1.1.3. 빈 문자열 검증 => false", () => {
        assert.isFalse(isValidValue(''), testFailMsg);
      });

      it( "1.1.4. { a: undefined } 검증 => false", () => {
        assert.isFalse(isValidValue({ a: undefined }), testFailMsg);
      });

      it( "1.1.5. { a: null } 검증 => false", () => {
        assert.isFalse(isValidValue({ a: null }), testFailMsg);
      });

      it( "1.1.6. { a: '' } 검증 => true", () => {
        assert.isTrue(isValidValue({ a: '' }), testFailMsg);
      });

      it( "1.1.7. ({a: null, b: undefined, c: ''}) 검증 => true", () => {
        assert.isTrue(isValidValue({ a: null, b: undefined, c: '' }), testFailMsg);
      });

      it( "1.1.8. ({a: null, b: undefined, c: null}) 검증 => false", () => {
        assert.isFalse(isValidValue({ a: null, b: undefined, c: null }), testFailMsg);
      });

      it( "1.1.9. nested object({a: {}}) 검증 => true", () => {
        assert.isTrue(isValidValue({ a: {} }), testFailMsg)
      });

      it( "1.1.10. function 검증 => true", () => {
        assert.isTrue(isValidValue(() => ''), testFailMsg)
      });
    });
    const testPayload = {
      test0: "1",
      test1: "2",
      test2: "3",
      test3: "4",
      test4: "5",
      test5: "6",
      test6: "7",
      test7: "8"
    };
    const testPayload2 = { ...testPayload, test8: [] };
    describe("1.2. matchHelper 테스트", () => {
      it( "1.2.1. targetValue 비교(case 에 match 됐을 때, default O)", () => {
        expect(matchHelper<string, string>("test")
            .case(v => v === "teest", v => {
              const msg = `${v}는 teest 입니다.`;
              console.log(msg);
              return msg;
            })
            .case(v => v === "test", v => {
              const msg = `${v}는 test 입니다.`;
              console.log(msg);
              return msg;
            })
            .case(v => v === "tst", v => {
              const msg = `${v}는 tst 입니다.`;
              console.log(msg);
              return msg;
            })
            .default(v => {
              const msg = `${v}는 제4의 값.`;
              console.log(msg);
              return msg;
            })
        ).eq("test는 test 입니다.", testFailMsg);
      });

      it( "1.2.2. targetValue 비교(아무것도 match 되지 않았을 때, default O)", () => {
        expect(matchHelper<string, string>("test4")
            .case(v => v === "teest", v => {
              const msg = `${v}는 teest 입니다.`;
              console.log(msg);
              return msg;
            })
            .case(v => v === "test", v => {
              const msg = `${v}는 test 입니다.`;
              console.log(msg);
              return msg;
            })
            .case(v => v === "tst", v => {
              const msg = `${v}는 tst 입니다.`;
              console.log(msg);
              return msg;
            })
            .default(v => {
              const msg = `${v}는 제4의 값.`;
              console.log(msg);
              return msg;
            })
        ).eq("test4는 제4의 값.", testFailMsg);
      });

      it( "1.2.3. targetValue 비교(case 에 match 됐을 때, default X)", () => {
        expect(matchHelper<string, string>("tst")
            .case(v => v === "teest", v => {
              const msg = `${v}는 teest 입니다.`;
              console.log(msg);
              return msg;
            })
            .case(v => v === "test", v => {
              const msg = `${v}는 test 입니다.`;
              console.log(msg);
              return msg;
            })
            .case(v => v === "tst", v => {
              const msg = `${v}는 tst 입니다.`;
              console.log(msg);
              return msg;
            })
            .caseEnd()
        ).eq("tst는 tst 입니다.", testFailMsg);
      });

      it( "1.2.4. targetValue 비교(아무것도 match 되지 않았을 때, default X)", () => {
        assert.isUndefined(matchHelper<string, string>("test4")
            .case(v => v === "teest", v => {
              const msg = `${v}는 teest 입니다.`;
              console.log(msg);
              return msg;
            })
            .case(v => v === "test", v => {
              const msg = `${v}는 test 입니다.`;
              console.log(msg);
              return msg;
            })
            .case(v => v === "tst", v => {
              const msg = `${v}는 tst 입니다.`;
              console.log(msg);
              return msg;
            })
            .caseEnd(),
            testFailMsg
        );
      });
    });

    describe("1.3. form validator 테스트", () => {
      it( "1.3.1. default form validator return true", () => {
        assert.isTrue(checkValidation(testPayload), testFailMsg);
      });

      it( "1.3.2. default form validator return false", () => {
        assert.isFalse(checkValidation(testPayload2), testFailMsg);
      });

      it( "1.3.3. custom form validator1 return false", () => {
        assert.isFalse(checkValidation(testPayload2, {
          default: {
            predicate: (v: any) => !isValidValue(v),
            action: returnFalse
          },
          test1: {
            predicate: (v: string) => {
              console.log("test1 :>> ", v);
              return v !== "2";
            },
            action: returnFalse
          },
          test8: {
            predicate: (v: any[]) => {
              console.log("test8 :>> ", v, v.length);
              return v.length === 0;
            },
            action: () => {
              console.log("test8 여기 걸릴 줄 알았다 ㅋ :>> ", 123);
              return false;
            }
          }
        }), testFailMsg);
      });

      it( "1.3.4. custom form validator2 return true", () => {
        assert.isTrue(checkValidation(testPayload2, {
          default: {
            predicate: (v: any) => !isValidValue(v),
            action: returnFalse
          },
          test1: {
            predicate: (v: string) => {
              console.log("test1 :>> ", v);
              return v !== "2";
            },
            action: returnFalse
          },
          test8: {
            predicate: (v: any[]) => {
              console.log("test8 :>> ", v, v.length);
              return v.length !== 0;
            },
            action: () => {
              console.log("test8 여기 걸릴 줄 알았다 ㅋ :>> ", 123);
              return false;
            }
          }
        }, () => {
          console.log("success :>> oh~~");
          return true;
        }), testFailMsg);
      });

      it( "1.3.5. custom form validator3 return false", () => {
        assert.isFalse(checkValidation(testPayload2, {
          default: {
            predicate: (v: any) => isValidValue(v),
            action: returnFalse
          }
        }, () => {
          console.log("success :>> oh~~");
          return true;
        }), testFailMsg);
      });

      it( "1.3.6. empty payload return false", () => {
        assert.isFalse(checkValidation({}), testFailMsg);
      });

      it( "1.3.7. invalid payload return false", () => {
        assert.isFalse(checkValidation(null), testFailMsg);
      });

      it( "1.3.8. nested payload return true", () => {
        assert.isFalse(checkValidation({ test: "test", test2: testPayload }, {
          default: { predicate: (v: any) => !isValidValue(v), action: returnFalse },
          test2: {
            predicate: (v: any) => checkValidation(v),
            action: returnFalse
          }
        }), testFailMsg);
      });
    });
    describe("1.4. form filter 테스트", () => {
      it( "1.4.1. default form filter", () => {
        expect(filteringPayload(testPayload2)).to.deep.eq(testPayload);
      });

      it( "1.4.2. custom form filter1", () => {
        expect(filteringPayload(testPayload2, {
          test8: {
            predicate: (v: any) => v.length === 0,
            action: bypassValue
          },
          default: {
            predicate: isValidValue,
            action: bypassValue
          }
        })).to.deep.eq(testPayload2);
      });

      it( "1.4.3. custom form filter2", () => {
        expect(filteringPayload(testPayload2, {
          test8: {
            predicate: (v: any) => v.length === 0,
            action: bypassValue
          },
          default: {
            predicate: isValidValue,
            action: bypassValue
          }
        })).to.deep.eq(testPayload2);
      });

      it( "1.4.4. empty payload form filter", () => {
        expect(filteringPayload({})).to.deep.eq({});
      });

      it( "1.4.5. invalid payload form filter", () => {
        const invalidTarget = null;
        expect(filteringPayload(invalidTarget)).to.deep.eq(invalidTarget);
      });
    });
  });

  describe("2. recordTime 테스트", () => {
    const waitForMilliSec = 3 * 1000;
    const testLen = 16500000;
    const labels = [
      `2.1. recordTime 테스트 ${waitForMilliSec/1000} seconds`,
      `2.2. traditional if-else recordTime ${testLen.toLocaleString()} loops`,
      `2.3. Map iterator[switchLike] recordTime ${testLen.toLocaleString()} loops`,
      `2.4. matchHelper recordTime ${testLen.toLocaleString()} loops`
    ];

    const testTarget = `TEST${testLen}`;
    const keyGen = (v: number) => `TEST${(v + 1).toString().padStart(`${testLen}`.length, "0")}`
    // 전통방식 if-else
    const recordIfElseLoops = recordTime((param) => {
      let i = 0
      for (let len = param; i < len; i++) {
        if (testTarget === keyGen(i)) {
          break;
        }
      }
      return i + 1;
    }, labels[1]);

    // Map iterator[switchLike]
    const cases = new Map();
    const defaultAction = (v: number) => testTarget === keyGen(v);
    for (let i = 0; i < testLen; i++) {
      if ( i === testLen - 1 ) {
        cases.set("default", () => defaultAction(testLen - 1));
      } else {
        cases.set(keyGen(i), defaultAction);
      }
    }
    const recordSwitchLikeLoops = recordTime((param) => {
      let i = 0
      for (const [key, validator] of cases[Symbol.iterator]()) {
        i++;
        if (validator(key)) {
          break;
        }
      }
      return i;
    }, labels[2]);

    // matchHelper 이용 if-else chaining
    const recordMatcherLoops = recordTime((param) => {
      let matcher = matchHelper<string, number>(testTarget);
      let i = 0;
      for(let len = param; i < len-1; i++) {
        matcher = matcher.case(v => v === keyGen(i), () => i);
      }
      return matcher.default(() => i + 1);
    }, labels[3]);

    it(labels[0], async () => {
      const recordFunc = recordTime(timeoutTask, labels[0]);
      await recordFunc(waitForMilliSec);
    });

    it(labels[1], async () => {
      expect((await recordIfElseLoops(testLen)).resultData).eq(testLen);
    });

    it(labels[2], async () => {
      expect((await recordSwitchLikeLoops(testLen)).resultData).eq(testLen);
    });

    it(labels[3], async () => {
      expect((await recordMatcherLoops(testLen)).resultData).eq(testLen);
    });
  });

  describe("3. 비동기 작업 lock 테스트", () => {
    const testRefNames = [ 'test1', 'test2', 'test3' ];
    const lockRef = reactive(testRefNames
        .reduce((acc, next) => ({ ...acc, [next]: false }), {})
    );
    const rejectTimer = (timeOut, error) => timeoutTask(timeOut, error);

    it("3.0. timeoutTask 테스트", async () => {
      await Promise.all([
        rejectTimer(1000, new Error("test")).catch(e => expect(e).instanceof(Error)),
        recordTime(timeoutTask, "3.0. timeoutTask 테스트")(2000),
      ]);
    });

    it("3.1. 비동기 작업 lock 테스트1", async () => {
      const test1Ref = toRef(lockRef, testRefNames[0]);
      const asyncTaskWait = doConcurrentAsyncTask(async (timeOut) => {
        await timeoutTask(timeOut);
        const res = ResultWrapper.create();
        res.result = true;
        return res;
      }, test1Ref);
      let res = await asyncTaskWait(2000);
      assert.isTrue(res.result, testFailMsg);
      res = await asyncTaskWait(1000);
      assert.isTrue(res.result, testFailMsg);
    });

    it("3.2. 비동기 작업 lock 테스트2(임계영역 침범)", async () => {
      const test1Ref = toRef(lockRef, testRefNames[0]);
      const asyncTaskWait = doConcurrentAsyncTask(timeoutTask, test1Ref);
      const asyncTaskWaitWithOption = doConcurrentAsyncTask(timeoutTask, test1Ref, {
        showRejectedReason: true,
        onReject: () => assert.isTrue(lockRef.test1, testFailMsg)
      });
      await Promise.all([
        asyncTaskWait(2000),
        asyncTaskWaitWithOption(1000)
      ]);
    });

    it("3.3. 비동기 작업 lock 테스트3(error handler)", async () => {
      const test2Ref = toRef(lockRef, testRefNames[1]);
      const test3Ref = toRef(lockRef, testRefNames[2]);

      const asyncTaskThrowsErrorWithHandler = doConcurrentAsyncTask(rejectTimer, test2Ref, {
        showErrorLog: true,
        onError: e => assert.isOk(e, testFailMsg)
      });
      const asyncTaskThrowsError = doConcurrentAsyncTask(rejectTimer, test3Ref);

      await Promise.all([
        asyncTaskThrowsErrorWithHandler(1000, new Error('test1')),
        asyncTaskThrowsError(1000, new Error('test2'))
          .catch(e => {
            console.error(e);
            assert.isOk(e, testFailMsg)
          })
      ]);
    });
  });
});