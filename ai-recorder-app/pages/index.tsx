import { useRouter } from "next/router";
import { useCallback } from "react";

export default function Home() {
  const router = useRouter();

  const onClickRecord = useCallback(() => {
    router.push("/recorder");
  }, [router]);

  return (
    <div className="h-screen bg-bg relative flex">
      <div className="flex flex-col gap-13 overflow-y-scroll p-16 w-full">
        <div
          className="h-96 bg-white flex flex-row items-center px-14 py-18 rounded-10"
          onClick={() => {
            // router.push(`/recording/${id}`);
          }}
        >
          <div className="mr-14">
            <div className="w-28 h-28 rounded-14 bg-green items-center justify-center flex">
              <span className="material-icons text-white text-18">mic</span>
            </div>
          </div>
        </div>
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
