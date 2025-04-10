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
  photos?: string[]; // string인 이유는 base64로 인코딩된 이미지 데이터를 저장하기 위해서
  createdAt: number;
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
  const [database, setDatabase] = useState<Database>({}); // 녹음 데이터 저장할 전체 데이터베이스

  console.log("database", database);

  // 웹쪽에서의 데이터베이스 로직 구현할거 리스트
  // 1. 앱에다가 데이터베이스 로드 해달라고 메시지 보내기
  // 2. 데이터베이스 저장해달라고 메시지 보내기
  // 3. 앱에서 데이터베이스 로드했을때 처리하는 로직
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
