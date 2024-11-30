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

export function useTsUtils() {
    const bypassValue: MatcherBypass<any> = (value: any) => value;
    const returnFalse: MatcherFalse = (): false => false;
    const returnTrue: MatcherTrue = (): true => true;
    /**
     * 주어진 값이 유효한지 확인합니다.
     * @param {any} value - The value to check.
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
    // 기본 옵션 정의
    const defaultValidationOption: MatcherCallbacks<any, false> = {
        predicate: (v) => !isValidValue(v),
        action: returnFalse,
    };
    const defaultFilterOption: MatcherCallbacks<any, any> = {
        predicate: isValidValue,
        action: bypassValue,
    };
    const checkValidation = <
        Payload extends Record<string, any>,
        Option extends Partial<Record<keyof Payload, MatcherCallbacks<any, false>>>
            & Record<"default", MatcherCallbacks<any, false>>
    >(
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

    const filteringPayload = <
        Payload extends Record<string, any>,
        Option extends Partial<Record<keyof Payload, MatcherCallbacks<any, any>>> & Record<"default", MatcherCallbacks<any, any>>
    >(
        payload: Payload,
        option: Option = { default: defaultFilterOption } as Option
    ): Partial<Payload> => {
        if ( !isValidValue( payload ) || typeof payload !== "object" ) {
            return payload;
        }
        return (Object.keys(payload) as (keyof Payload)[])
            .reduce(
                (acc: Partial<Payload>, key: keyof Payload): Partial<Payload> => {
                    const {predicate, action: bypass} = option[key] || option.default!;
                    if (matchHelper(payload[key]).case(predicate, bypass).caseEnd()) {
                        acc[key] = payload[key];
                    }
                    return acc;
                },
                {} as Partial<Payload>
            );
    }

    const matchHelper = <V, R> (value?: V): MatcherType<V, R> => {
        let matched: boolean = false; // 조건 충족 여부 추적
        let result: R; // 최종 결과 저장
        return {
            case ( predicate: (v?: V) => boolean, callback: (v?: V) => R ): MatcherType<V, R> {
                if ( !callback ) {
                    throw new Error("callback is not a function.");
                }
                if ( !matched && predicate( value ) ) {
                    matched = true;
                    result = callback( value );
                }
                return this; // 체이닝 유지
            },
            default ( callback: (v?: V) => R ): R {
                if ( !callback ) {
                    throw new Error("callback is not a function.");
                }
                if ( !matched ) {
                    result = callback( value );
                    matched = true; // 기본값도 매칭된 것으로 처리
                }
                return result;
            },
            caseEnd (): R|undefined {
                return matched ? result : undefined; // 매칭된 조건이 없으면 undefined 반환
            },
        };
    };

    const recordTime = (
        task: (...param: any[]) => any,
        label: string
    ): (...params: any[]) => Promise<any> => {
        return async (...params: any[]): Promise<any> => {
            console.time(label);
            try {
                return await task(...params);
            } catch (error) {
                console.error(error);
            } finally {
                console.timeEnd(label);
            }
        };
    }
    return {
        matchHelper,
        bypassValue,
        returnFalse,
        returnTrue,
        isValidValue,
        checkValidation,
        filteringPayload,
        recordTime
    };
}