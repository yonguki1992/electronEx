export type ResultWrapperType<T extends Record<string, any>> = Partial<T> & {
    result: boolean
};
export class ResultWrapper {
    // constructor(props?: Record<string, any>) {
    //     this.result = false;
    //     if (typeof props === "object") {
    //         Object
    //             .entries(props)
    //             .forEach(([key, value]) => {
    //                 (this as any)[key] = value;
    //             })
    //     }
    // }
    static create<T extends Record<string, any>>(props?: Partial<T>): ResultWrapperType<T> {
        let res = { result: false };
        if (!!props) {
            res = { ...res, ...props };
        }
        return res as ResultWrapperType<T>;
    }
}