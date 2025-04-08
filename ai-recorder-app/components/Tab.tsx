import cn from "classnames";

interface Props {
  title: string;
  focused?: boolean;
  onClick?: () => void;
}

export default function Tab({ title, focused, onClick }: Props) {
  return (
    <button
      className={cn(
        "flex flex-1 justify-center items-center text-[16px] font-[500] py-[11px]",
        focused ? "border-b-2 border-green text-black" : "text-textGray"
      )}
      onClick={onClick}
    >
      {title}
    </button>
  );
}
