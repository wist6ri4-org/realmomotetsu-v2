import { useState, useCallback } from "react";

interface UseSelectInputReturn {
    value: string;
    setValue: (newValue: string) => void;
    handleChange: (
        event:
            | React.ChangeEvent<HTMLInputElement>
            | (Event & { target: { value: unknown; name: string } })
    ) => void;
    reset: () => void;
}

export const useSelectInput = (initialValue: string = ""): UseSelectInputReturn => {
    const [value, setValue] = useState<string>(initialValue);

    const handleChange = useCallback(
        (
            event:
                | React.ChangeEvent<HTMLInputElement>
                | (Event & { target: { value: unknown; name: string } })
        ) => {
            const newValue = event.target.value as string;
            setValue(newValue);
            console.log("選択された値:", newValue);
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
