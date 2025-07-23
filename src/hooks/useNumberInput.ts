import { useState, useCallback } from "react";

interface UseNumberInputReturn {
    value: number;
    setValue: (newValue: number) => void;
    handleChange: (
        event:
            | number
            | React.ChangeEvent<HTMLInputElement>
            | (Event & { target: { value: unknown; name: string } })
            | null
    ) => void;
    reset: () => void;
}

export const useNumberInput = (initialValue: number = 0): UseNumberInputReturn => {
    const [value, setValue] = useState<number>(initialValue);

    const handleChange = useCallback(
        (
            event:
                | number
                | React.ChangeEvent<HTMLInputElement>
                | (Event & { target: { value: unknown; name: string } })
                | null
        ) => {
            if (typeof event === "number") {
                setValue(event);
            } else if (event === null) {
                setValue(0);
            } else {
                const newValue = Number(event.target.value);
                console.log("入力された値:", newValue);
                setValue(newValue);
            }
        },
        []
    );

    const reset = useCallback(() => {
        setValue(initialValue);
    }, [initialValue]);

    return {
        value,
        setValue,
        handleChange,
        reset,
    };
};
