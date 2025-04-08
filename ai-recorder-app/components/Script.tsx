import { formatTime } from "@/modules/Util";

interface Props {
  scripts: { start: number; end: number; text: string }[];
}

export default function Script({ scripts }: Props) {
  return (
    <div className="flex flex-col px-16 py-24">
      <div className="flex flex-col gap-18">
        {scripts.map((script, index) => {
          return (
            <div key={index}>
              <div className="text-textGray text-15 font-normal">
                {`${formatTime(script.start)}-${formatTime(script.end)}`}
              </div>
              <div className="mt-10 text-15 font-normal text-black">
                {script.text}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
