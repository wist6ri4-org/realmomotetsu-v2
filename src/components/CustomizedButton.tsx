const ColorStyle = {
    red: "bg-red-500 hover:bg-red-600 text-white",
    blue: "bg-blue-500 hover:bg-blue-600 text-white",
    green: "bg-green-500 hover:bg-green-600 text-white",
    gray: "bg-gray-500 hover:bg-gray-600 text-white",
    yellow: "bg-yellow-500 hover:bg-yellow-600 text-white",
};

const SizeStyle = {
    small: "px-2 py-1 text-sm rounded-md",
    medium: "px-4 py-2 text-base rounded-md",
    large: "px-6 py-3 text-lg rounded-lg",
};

type Color = keyof typeof ColorStyle;
type Size = keyof typeof SizeStyle;

type ButtonProps = {
    color: Color;
    size: Size;
    onClick?: () => void;
    disabled?: boolean;
    children?: React.ReactNode;
};

const Button: React.FC<ButtonProps> = ({
    color,
    size,
    onClick,
    disabled = false,
    children,
}: ButtonProps) => {
    return (
        <button
            className={`${ColorStyle[color]} ${SizeStyle[size]} cursor-pointer focus:outline-none font-semibold`}
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </button>
    );
};

export default Button;
