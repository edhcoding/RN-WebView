import { colors } from "@/styles/tailwind/color";
import { TailSpin } from "react-loader-spinner";

interface Props {
  text?: string;
  loading?: boolean;
}

export default function Summary({ text, loading }: Props) {
  return (
    <div className="h-full pt-22 px-20">
      {loading ? (
        <div className="flex items-center justify-center size-full">
          <TailSpin color={colors.green} width={50} height={50} />
        </div>
      ) : (
        <div className="text-15 font-normal text-black">{text}</div>
      )}
    </div>
  );
}
