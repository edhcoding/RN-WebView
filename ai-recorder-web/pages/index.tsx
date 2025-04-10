import { Data, useDatabase } from "@/components/DataContext";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const onClickRecord = useCallback(() => {
    router.push("/recorder");
  }, [router]);

  const [recordings, setRecordings] = useState<Data[]>([]);

  const { getAll } = useDatabase();

  useEffect(() => {
    setRecordings(getAll());
  }, [getAll]);

  return (
    // flex를 준 이유가 앱에서 flex 안주면 녹음하기 버튼이 따라 올라옴
    <div className="h-screen bg-[#F6F6F9] relative flex">
      <div className="flex flex-col gap-[13px] overflow-y-scroll p-[16px] w-full">
        {recordings.map((recording) => {
          const { id, text, createdAt } = recording;
          const createdAtString = new Date(createdAt).toLocaleString();

          return (
            <div
              key={id}
              className="h-[96px] bg-[#FFFFFF] flex flex-row items-center px-[14px] py-[18px] rounded-[10px]"
              onClick={() => {
                router.push(`/recording/${id}`);
              }}
            >
              <div className="mr-[14px]">
                <div className="w-[28px] h-[28px] rounded-[14px] bg-[#09CC7F] items-center justify-center flex">
                  <span className="material-icons text-[#FFFFFF] !text-[18px]">
                    mic
                  </span>
                </div>
              </div>
              <div className="flex-1 flex flex-col overflow-hidden">
                <p className="truncate text-[#636366] text-[14px]">{text}</p>
                <p
                  className="mt-[8px] text-[#848487] text-[13px]"
                  // suppressHydrationWarning 속성을 추가하게 된 이유는 렌더링 하이드레이션 오류 방지(next.js가 ssr을 하기 때문에 서버와 클라이언트 결과가 달라서 오류가 나는 것을 방지하기 위해서)
                  suppressHydrationWarning
                >
                  {createdAtString}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <button
        className="bg-black py-[10px] px-[18px] rounded-[25px] flex items-center absolute bottom-[29px] right-[16px]"
        onClick={onClickRecord}
      >
        <span className="material-icons text-white !text-[24px]">mic</span>
        <span className="text-white text-[14px] ml-[3px]">녹음하기</span>
      </button>
    </div>
  );
}
