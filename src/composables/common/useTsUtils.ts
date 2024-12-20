import {Ref} from "vue";
import {ResultWrapper, ResultWrapperType} from "@/model";
export type MatcherPredicate<V> = (v?: V) => boolean;
export type MatcherAction<V, R> = (v?: V) => R;
export type MatcherBypass<R> = (v: R) => R;
export type MatcherEnd<R> = () => R|undefined;
export type MatcherTrue = () => true;
export type MatcherFalse = () => false;
export type MatcherType<V, R> = {
    case: (
        predicate: MatcherPredicate<V>,
        callback: MatcherAction<V, R>
    ) => MatcherType<V, R>;
    default: (
        callback: MatcherAction<V, R>
    ) => R;
    caseEnd: MatcherEnd<R>;
}
export type MatcherCallbacks<V, R> = {
    predicate: MatcherPredicate<V>;
    action: MatcherAction<V, R>;
}
export type TaskLockAction = {
    showErrorLog?: boolean,
    showRejectedReason?: boolean,
    onError?: (e: unknown|Error) => void,
    onReject?: () => void
}

export function useTsUtils() {
    /**
     *  필터링함수(filteringPayload)에 사용하는 기본 Action<br>
     *  인자값을 그대로 리턴함
     *  @param {any} value - 들어온값
     *  @return {any} - 들어왔다가 나간 값
     *  @see {matchHelper}
     *  @see {filteringPayload}
     */
    const bypassValue: MatcherBypass<any> = (value: any) => value;
    /**
     *  검증함수(checkValidation)에 사용하는 기본 Action<br>
     *  내부 로직을 커스텀해서 거짓을 반환하면서 특정 로직도 동작하게 만들면 된다.
     *  @return {false} - 항상 false
     *  @see {matchHelper}
     *  @see {checkValidation}
     */
    const returnFalse: MatcherFalse = (): false => false;
    /**
     *  검증함수(checkValidation)에 사용하는 기본 Action<br>
     *  내부 로직을 커스텀해서 참을 반환하면서 특정 로직도 동작하게 만들면 된다.
     *  @return {true} - 항상 true
     *  @see {matchHelper}
     *  @see {checkValidation}
     */
    const returnTrue: MatcherTrue = (): true => true;
    /**
     * 주어진 값이 유효한지 확인
     * @param {any} [value] - The value to check.
     * @param {boolean} [required=true] - string, array, object 등은 빈 값도 유효한지 결정하는 플래그.
     * @param {Set} [seen=new Set()] - 순환참조를 회피하기 위해 이미 참조한 값인지 체크
     * @returns {boolean} - 값이 유효하면 true를 반환하고, 그렇지 않으면 false를 반환합니다.
     */
    const isValidValue = (value?: any, required: boolean = true, seen: Set<any> = new Set()): boolean => {
        const valueType = typeof value;
        if ( valueType === "undefined" || value === null ) {
            return false;
        }
        // 이미 확인한 값인지 확인합니다.
        if ( seen.has( value ) ) {
            return true;
        }
        switch ( valueType ) {
            case "function":
            case "boolean":
            case "symbol":
                return true;
            case "number":
                return !isNaN( value );
            case "string":
            case "bigint":
                return !required || value.toString().trim().length !== 0;
            case "object":
                // 확인한 값을 추가합니다.
                seen.add( value );
                if ( !required ) {
                    return true;
                }
                if ( Array.isArray( value ) ) {
                    return value.length !== 0;
                }
                if ( value instanceof Map || value instanceof Set ) {
                    return value.size !== 0;
                }
                const keys = Object.keys( value );
                if ( keys.length  === 0 ) {
                    return false;
                }
                let res = false;
                for ( let i = 0, len = keys.length; i < len; i++ ) {
                    const key = keys[ i ];
                    if ( Object.prototype.hasOwnProperty.call( value, key ) ) {
                        // 재귀적으로 isValidValue를 호출할 때, 새로운 seen Set을 전달합니다.
                        if ( isValidValue( value[ key ], false, seen ) ) {
                            res = true;
                            break;
                        }
                    }
                }
                return res;
            default:
                return false;
        }
    }
    /** 기본 옵션 정의 */
    const defaultValidationOption: MatcherCallbacks<any, false> = {
        predicate: (v) => !isValidValue(v),
        action: returnFalse,
    };
    const defaultFilterOption: MatcherCallbacks<any, any> = {
        predicate: isValidValue,
        action: bypassValue,
    };
    /** 기본 옵션 정의 */
    /**
     *  전통적인 if-else 나 switch 를 선언형태로 사용할 수 있게 도와주는 함수
     *  @param {V} [value] - 비교할 값
     *  @return {MatcherType<V, R>} - MatcherType 은 case, default, caseEnd 세 메서드를 가지고 있는데<br>
     *      필요한 만큼 case 로 체이닝하면 됨.<br>
     *      기본값(if-else 로 치면 else, switch 는 default case)이 필요하면<br>
     *      가장 마지막에 default 메서드를 체이닝하고<br>
     *      필요없으면 caseEnd 를 체이닝. 대신 결과값은 없을 수도 있음.
     *      ex) const resCd = 404; // 예를들면 not found 에러같은거
     *          matchHelper<number, void>(resCd)
     *              .on(v => Array.from({ length: 9 }, (_, idx) => 400+idx).includes(v), v => {
     *                  // 404 니까 여기에 걸리겠지~~
     *                  console.error(`client error! error code :>> ${v}`);
     *              })
     *              .on(v => Array.from({ length: 12 }, (_, idx) => 500+idx).includes(v), v => {
     *                  console.error(`internal server error! error code :>> ${v}`);
     *              })
     *              .otherWise(v => {
     *                  console.log(`request success! response code :>> ${v}`);
     *              })
     *  @template V
     *  @template R - 결과(어떻게 반환할 것인지)
     *  @see {MatcherType}
     */
    const matchHelper = <V, R> (value?: V): MatcherType<V, R> => {
        let matched: boolean = false; // 조건 충족 여부 추적
        let result: R; // 최종 결과 저장
        return {
            case (
                predicate: MatcherPredicate<V>,
                callback: MatcherAction<V, R>
            ): MatcherType<V, R> {
                if (!callback) {
                    throw new Error("callback is not a function.");
                }
                if (!matched && predicate(value)) {
                    matched = true;
                    result = callback(value);
                }
                return this; // 체이닝 유지
            },
            default (callback: MatcherAction<V, R>): R {
                if (!callback) {
                    throw new Error("callback is not a function.");
                }
                if (!matched) {
                    result = callback(value);
                    matched = true; // 기본값도 매칭된 것으로 처리
                }
                return result;
            },
            caseEnd (): R|undefined {
                return matched ? result : undefined; // 매칭된 조건이 없으면 undefined 반환
            },
        };
    };
    /**
     *  matchHelper 만든김에 object 형태의 폼 유효성 검증하려고 만든 함수<br>
     *  검증 로직(predicate)결과값에 따라 true 혹은 false 를 반환함.
     *  @param {Payload} payload - 검증할 object
     *  @param {Option} [option] - 검증로직 커스텀
     *  @param {MatcherTrue} [success] - 성공시 true 반환과 함께 어떤 기능(callback) 실행할 것인지.
     *  @template Payload extends Record<string, any>
     *  @template Option extends Partial<Record<keyof Payload, MatcherCallbacks<any, false>>>
     *             & Record<"default", MatcherCallbacks<any, false>>
     *  @see {matchHelper}
     *  @see {MatcherType}
     *  @see {MatcherCallbacks}
     *  @see {MatcherAction}
     */
    const checkValidation = <
        Payload extends Record<string, any>,
        Option extends Partial<Record<keyof Payload, MatcherCallbacks<any, false>>>
            & Record<"default", MatcherCallbacks<any, false>>
    > (
        payload: Payload,
        option: Option = { default: defaultValidationOption } as Option,
        success: MatcherTrue = returnTrue
    ): boolean => {
        if ( !isValidValue( payload ) || typeof payload !== "object"  ) {
            return false;
        }
        return (Object.keys(payload) as (keyof Payload)[])
            .reduce((matcher: MatcherType<void, boolean>, key: keyof Payload): MatcherType<void, boolean> => {
                const {predicate, action: failure} = option[key] || option.default;
                return matcher.case(() => predicate(payload[key]), failure);
            }, matchHelper<void, boolean>())
            .default(success);
    }

    /**
     *  matchHelper 만든 김에 object 쭉정이 속성 필터링 용도의 함수<br>
     *  필터링 로직(predicate)결과값에 따라 해당 속성을 bypass 하거나 제거 한다.
     *  @param {Payload} payload - 필터링할 object
     *  @param {Payload} [option] - 필터링로직 커스텀
     *  @return {Partial<Payload>} - 필터링로직 결과로 새로 태어난 object
     *  @template Payload extends Record<string, any>
     *  @template Option extends Partial<Record<keyof Payload, MatcherCallbacks<any, any>>> & Record<"default", MatcherCallbacks<any, any>>
     *  @see {matchHelper}
     *  @see {MatcherType}
     *  @see {MatcherCallbacks}
     *  @see {MatcherAction}
     */
    const filteringPayload = <
        Payload extends Record<string, any>,
        Option extends Partial<Record<keyof Payload, MatcherCallbacks<any, any>>> & Record<"default", MatcherCallbacks<any, any>>
    > (
        payload: Payload,
        option: Option = { default: defaultFilterOption } as Option
    ): Partial<Payload> => {
        if ( !isValidValue( payload ) || typeof payload !== "object" ) {
            return payload;
        }
        return (Object.keys(payload) as (keyof Payload)[])
            .reduce(
                (acc: Partial<Payload>, key: keyof Payload): Partial<Payload> => {
                    const {predicate, action: bypass} = option[key] || option.default;
                    const res = matchHelper(payload[key]).case(predicate, bypass).caseEnd();
                    if (!res) {
                        return acc;
                    }
                    return { ...acc, [key]: res };
                },
                {} as Partial<Payload>
            );
    }
    /**
     *  함수 실행시간 알아보려고 만든 Wrapper<br>
     *  테스트해보니 3초 정도 timeOut 으로 멈춰놓으면<br>
     *  3.005 초 나오니까 아주까지는 아니어도 근사하게 동작시간 체크할 수 있음.
     *  @param {(...param: any[]) => any} task
     *  @param {string} label
     *  @return {(...param: any[]) => Promise<ResultWrapperType<{ resultData: any, error: Error|unknown }>>}
     */
    const recordTime = (
        task: (...param: any[]) => any,
        label: string
    ): ((...params: any[]) => Promise<ResultWrapperType<{ resultData: any, error: Error|unknown }>>)=> {
        return async (...params: any[]): Promise<ResultWrapperType<{ resultData: any, error: Error|unknown }>> => {
            const resultWrapper = ResultWrapper.create<{ resultData: any, error: Error|unknown }>();
            let res: any;
            console.time(label);
            try {
                res = await task(...params);
            } catch (error) {
                console.error(error);
                resultWrapper.error = error;
                return resultWrapper;
            } finally {
                console.timeEnd(label);
            }
            resultWrapper.resultData = res;
            resultWrapper.result = true;
            return resultWrapper;
        };
    }
    /**
     *  동시에 동작하면 안 되는 비동기 동작이 있다면 lock 을 걸고 거절함
     *  @param {() => Promise<ResultWrapperType<T>>}targetTask
     *  @param {Ref<boolean>} lockRef - lock 걸기위한 반응형 상태
     *  @param {TaskLockAction} [option] - 제어 옵션들
     *  @return {Promise<ResultWrapperType<T>>}
     *  @template T extends Record<string, any> | { error: Error|unknown }
     *  @throws Error
     */
    const doConcurrentAsyncTask = <T extends Record<string, any> | { error: Error|unknown }> (
        targetTask: (...params: any[]) => Promise<ResultWrapperType<T>>,
        lockRef: Ref<boolean>,
        option?: TaskLockAction
    ): ((...params: any[]) => Promise<ResultWrapperType<T>>) => {
        return async (...params: any[]): Promise<ResultWrapperType<T>> => {
            const taskOption = option || {};
            if (lockRef.value) {
                const {
                    showRejectedReason,
                    onReject
                } = taskOption;
                showRejectedReason && console.error('Another task is already running!');
                onReject?.();
                return ResultWrapper.create<T>();
            }
            lockRef.value = true;
            try {
                return await targetTask(...params);
            } catch (error: Error|unknown) {
                const {
                    showErrorLog,
                    onError
                } = taskOption;
                !!showErrorLog && console.error(error);
                if (!onError) {
                    throw error;
                }
                onError(error);
                return ResultWrapper.create<T>({ error } as T);
            } finally {
                lockRef.value = false;
            }
        };
    }
    /**
     *. Promise + setTimeout = sleep
     *  @param {number} timeout - 시간값(밀리초)
     *  @param {boolean|Error} rejected -
     *  @param {object} timerObj 타이머 결과
     *  @param {number} [timerObj.timer] 타이머
     */
    const timeoutTask = (
        timeout: number,
        rejected: boolean|Error = false,
        timerObj: { timer?: ReturnType<typeof setTimeout> } = {},
    ): Promise<void> => new Promise((resolve, reject) => {
        timerObj.timer = setTimeout(() => matchHelper(rejected)
            .case(v => !v, () => resolve())
            .case(v => typeof v === 'boolean' && v, () => reject())
            .case(v => typeof v === 'object', reject)
            .caseEnd(),
            timeout
        );
    });

    return {
        matchHelper,
        bypassValue,
        returnFalse,
        returnTrue,
        isValidValue,
        checkValidation,
        filteringPayload,
        doConcurrentAsyncTask,
        recordTime,
        timeoutTask
    };
}