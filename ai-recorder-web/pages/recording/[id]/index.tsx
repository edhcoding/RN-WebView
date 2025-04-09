import { Data, useDatabase } from "@/components/DataContext";
import Header from "@/components/Header";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import Tab from "@/components/Tab";
import Script from "@/components/Script";
import Summary from "@/components/Summary";

const hasReactNativeWebview =
  typeof window != "undefined" && window.ReactNativeWebView != null;

export default function Recording() {
  const router = useRouter();

  const [data, setData] = useState<Data | null>(null); // 데이터 상태 (데이터 베이스에서 가져온 데이터)
  const { get, update } = useDatabase();

  useEffect(() => {
    if (typeof router.query.id === "string") {
      const document = get({ id: router.query.id });
      if (document != null) {
        setData(document);
        return;
      } else {
        throw new Error("Cannot load data");
      }
    }
  }, [get, router.query.id]);

  const [focusedTab, setFocusedTab] = useState<"script" | "summary">("script"); // 현재 선택된 탭

  const onPressScriptTab = useCallback(() => {
    setFocusedTab("script");
  }, []);
  const onPressSummaryTab = useCallback(() => {
    setFocusedTab("summary");
  }, []);

  const [summarizing, setSummarizing] = useState(false); // 요약 중인지 여부
  const onPressSummarize = useCallback(async () => {
    const text = data?.text;

    if (text == null || typeof router.query.id != "string") return;

    setSummarizing(true);

    try {
      setFocusedTab("summary");

      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const result = await response.json();
      console.log("result", result.summary);

      if (result.summary != null) {
        update({ id: router.query.id, summary: result.summary });
      } else {
        throw new Error("Summary is undefined");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSummarizing(false);
    }
  }, [data?.text, router.query.id, update]);

  console.log("summarizing", summarizing);

  const onPressImageButton = useCallback(() => {
    router.push(`/recording/${router.query.id}/photo`);
  }, [router]);

  return (
    <div className="h-screen bg-white flex flex-col">
      <Header
        title={"음성 기록"}
        renderRight={() => {
          if (!hasReactNativeWebview) {
            return <></>;
          }

          return (
            <button className="mr-16" onClick={onPressImageButton}>
              <span className="material-icons text-gray text-30">image</span>
            </button>
          );
        }}
      />
      <div className="flex">
        <Tab
          title={"음성 기록"}
          focused={focusedTab === "script"}
          onClick={onPressScriptTab}
        />
        <Tab
          title={"요약"}
          focused={focusedTab === "summary"}
          onClick={onPressSummaryTab}
        />
      </div>
      {!summarizing && data?.summary == null && (
        <button
          className="relative bg-green mb-18 flex justify-center items-center py-13 rounded-6 text-16 font-bold text-white mx-16 mt-24"
          onClick={onPressSummarize}
        >
          요약하기
          <span className="material-icons text-white text-24 absolute right-17">
            east
          </span>
        </button>
      )}
      <div className="flex-1 overflow-y-scroll overscroll-none">
        {focusedTab === "script" && data?.scripts != null && (
          <Script scripts={data.scripts} />
        )}
        {focusedTab === "summary" && (
          <Summary text={data?.summary} loading={summarizing} />
        )}
      </div>
    </div>
  );
}
