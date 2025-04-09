import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type Script = {
  start: number;
  end: number;
  text: string;
};

export type Data = {
  id: string; // 스크립트 id
  text: string; // 전체 스크립트
  scripts: Script[]; // 시간별 스크립트 정보
  summary?: string; // 요약 스크립트
  photos?: string[];
  createdAt?: number;
};

type Database = { [id: string]: Data | undefined };

type ScriptContextType = {
  create: (data: Data) => void;
  get: ({ id }: { id: string }) => Data | undefined;
  update: ({ id, summary }: { id: string; summary?: string }) => void;
  getAll: () => Data[];
};

const ScriptContext = createContext<ScriptContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [database, setDatabase] = useState<Database>({
    "202403150001": {
      id: "202403150001",
      text: "안녕하세요. 오늘은 인공지능과 머신러닝의 차이점에 대해 설명드리겠습니다. 인공지능은 인간의 지능을 모방하여 학습, 추론, 적응, 수정 등을 수행할 수 있는 시스템을 의미합니다. 반면에 머신러닝은 인공지능의 한 분야로, 데이터를 기반으로 패턴을 학습하고 결정을 내리는 알고리즘을 말합니다. 딥러닝은 머신러닝의 한 종류로, 인간의 뉴런과 비슷한 인공신경망을 사용하여 더 복잡한 패턴을 학습할 수 있습니다. 실생활에서는 음성 인식, 이미지 인식, 자연어 처리 등 다양한 분야에서 활용되고 있습니다. 특히 최근에는 ChatGPT와 같은 대화형 AI가 큰 주목을 받고 있죠. 이러한 기술들은 우리의 일상생활을 더욱 편리하게 만들어주고 있습니다.",
      scripts: [
        {
          start: 0,
          end: 8,
          text: "안녕하세요. 오늘은 인공지능과 머신러닝의 차이점에 대해 설명드리겠습니다.",
        },
        {
          start: 8,
          end: 15,
          text: "인공지능은 인간의 지능을 모방하여 학습, 추론, 적응, 수정 등을 수행할 수 있는 시스템을 의미합니다.",
        },
        {
          start: 15,
          end: 22,
          text: "반면에 머신러닝은 인공지능의 한 분야로, 데이터를 기반으로 패턴을 학습하고 결정을 내리는 알고리즘을 말합니다.",
        },
        {
          start: 22,
          end: 30,
          text: "딥러닝은 머신러닝의 한 종류로, 인간의 뉴런과 비슷한 인공신경망을 사용하여 더 복잡한 패턴을 학습할 수 있습니다.",
        },
        {
          start: 30,
          end: 38,
          text: "실생활에서는 음성 인식, 이미지 인식, 자연어 처리 등 다양한 분야에서 활용되고 있습니다.",
        },
        {
          start: 38,
          end: 45,
          text: "특히 최근에는 ChatGPT와 같은 대화형 AI가 큰 주목을 받고 있죠.",
        },
        {
          start: 45,
          end: 52,
          text: "이러한 기술들은 우리의 일상생활을 더욱 편리하게 만들어주고 있습니다.",
        },
      ],
      summary:
        "인공지능과 머신러닝, 딥러닝의 개념과 차이점, 그리고 실생활 활용 사례에 대한 설명",
      createdAt: 1710633600000, // 2024-03-15 00:00:00
    },
  }); // 녹음 데이터 저장할 전체 데이터베이스

  console.log("database", database);

  const [loaded, setLoaded] = useState(false);
  const hasReactNativeWebview =
    typeof window !== "undefined" && window.ReactNativeWebView != null;

  useEffect(() => {
    if (!loaded && hasReactNativeWebview) {
      window.ReactNativeWebView?.postMessage(
        JSON.stringify({ type: "load-database" })
      );
    }
  }, [hasReactNativeWebview, loaded]);

  useEffect(() => {
    if (loaded && hasReactNativeWebview) {
      window.ReactNativeWebView?.postMessage(
        JSON.stringify({ type: "save-database", data: database })
      );
    }
  }, [loaded, hasReactNativeWebview, database]);

  useEffect(() => {
    if (hasReactNativeWebview) {
      const handleMessage = (event: any) => {
        const { type, data } = JSON.parse(event.data);
        if (type === "onLoadDatabase") {
          setDatabase(data);
          setLoaded(true);
        }
      };
      window.addEventListener("message", handleMessage);
      document.addEventListener("message", handleMessage);
      return () => {
        window.removeEventListener("message", handleMessage);
        document.removeEventListener("message", handleMessage);
      };
    }
  }, [hasReactNativeWebview]);

  const create = useCallback((data: Data) => {
    setDatabase((prev) => ({
      ...prev,
      [data.id]: data,
    }));
  }, []);

  const get = useCallback(
    ({ id }: { id: string }) => {
      return database[id];
    },
    [database]
  );

  const getAll = useCallback(() => {
    return Object.values(database) as Data[];
  }, [database]);

  const update = useCallback(
    ({ id, summary }: { id: string; summary?: string }) => {
      setDatabase((prev) => {
        const prevData = prev[id];
        if (prevData == null) return prev;

        return {
          ...prev,
          [id]: {
            ...prevData,
            ...(summary != null ? { summary } : {}),
          },
        };
      });
    },
    []
  );

  return (
    <ScriptContext.Provider value={{ create, get, update, getAll }}>
      {children}
    </ScriptContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(ScriptContext);

  if (context === undefined) {
    throw new Error("useDatabase must to be within a DataProvider");
  }

  return context;
};
