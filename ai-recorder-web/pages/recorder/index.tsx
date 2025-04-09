import Header from "@/components/Header";
import { useCallback, useEffect, useRef, useState } from "react";
import cn from "classnames";
import { formatTime } from "@/modules/Util";
import { useDatabase } from "@/components/DataContext";
import { useRouter } from "next/router";

// base64로 인코딩된 무자열을 blob 객체로 변환하는 함수
const base64ToBlob = (base64: string, mimeType: string) => {
  // 바이너리 문자열로 다시 디코딩 (atob 함수는 브라우저 내장 함수로, base64 문자열 디코딩 하는 역할)
  const byteCharacters = atob(base64);
  const byteArrays = [];

  // 바이너리 문자열을 512바이트씩 나누어 처리
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    // 현재 오프셋에서 512바이트 길이의 문자열을 잘라냄
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);

    // slice로 잘라낸 문자열의 각 문자를 UTF-16 코드로 변환하여 배열에 저장
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    // UTF-16 코드 배열(byteNumbers)을 Uint8Array로 변환 (Uint8Array는 8비트 부호 없는 정수 배열로, 바이너리 데이터를 다루기 위한 형식임)
    const byteArray = new Uint8Array(byteNumbers);
    // 변환된 Uint8Array를 byteArrays 배열에 추가
    byteArrays.push(byteArray);
  }

  // Uint8Array 배열을 Blob 객체로 변환하여 반환
  return new Blob(byteArrays, { type: mimeType });
};

export default function Recorder() {
  const [state, setState] = useState<"recording" | "paused" | null>(null); // 녹음 상태
  const [toastVisible, setToastVisible] = useState<boolean>(false); // 토스트 상태
  const [time, setTime] = useState<number>(0); // 녹음 시간
  const [audioUrl, setAudioUrl] = useState<string | null>(null); // 저장된 녹음 오디오 파일
  const [photos, setPhotos] = useState<string[]>([]); // 찍은 사진들

  const mediaRecorderRef = useRef<MediaRecorder | null>(null); // 녹음 기능을 제어하는 MediaRecorder 인스턴스 저장
  const chunksRef = useRef<Blob[]>([]); // 녹음된 오디오 데이터 청크들을 저장
  const timerRef = useRef<NodeJS.Timeout | null>(null); // 녹음 시간을 측정하는 타이머 ID 저장

  const startTimer = useCallback(
    () =>
      (timerRef.current = setInterval(() => setTime((prev) => prev + 1), 1000)),
    []
  );

  const stopTimer = useCallback(() => {
    if (timerRef.current != null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const showToast = useCallback(() => setToastVisible(true), []);

  useEffect(() => {
    // 특정 시간 후에 토스트 종료
    if (toastVisible) {
      const toastId = setTimeout(() => setToastVisible(false), 1500);

      return () => clearTimeout(toastId);
    }
  }, [toastVisible]);

  const onStartRecord = useCallback(() => {
    setTime(0);
    setAudioUrl(null);
    startTimer();
    setState("recording");
  }, [startTimer]);

  const { create } = useDatabase();
  const router = useRouter();

  const transcribeAudio = useCallback(
    async ({ url, ext }: { url: string; ext: string }) => {
      const response = await fetch(url);
      const audioBlob = await response.blob();

      const formData = new FormData();
      // 3번째 인자로 파일이름 작성하는데 파일 이름 자체는 아무거나 상관없지만 확장자가 틀리면 에러발생함
      formData.append("file", audioBlob, `recording.${ext}`);

      const transcriptionRes = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = (await transcriptionRes.json()) as {
        transcription: {
          text: string;
          segments: {
            start: number;
            end: number;
            text: string;
          }[];
        };
      };

      const id = `${Date.now()}`; // 나중에 uuid 라이브러리 사용하면 좋을 듯

      create({
        id,
        text: data.transcription.text,
        scripts: data.transcription.segments.map((seg) => ({
          start: seg.start,
          end: seg.end,
          text: seg.text.trim(), // trim 메서드는 문자열 양쪽 공백 제거
        })),
        photos,
      });

      // 여기서 create로 데이터 베이스에 저장하고 /recording/id로 이동시키고 싶어서 [id].tsx 를 추가하려고 하는데 url에 /recording/id/photo 이런식으로 사진도
      // 저장하려면 [id].tsx 형식의 파일 라우팅 말고 recording 폴더안에 [id] 폴더를 만들고 그 안에 index.tsx 파일 만들면됨
      router.push(`/recording/${id}`);
    },
    [create, photos, router]
  );

  const onStopRecord = useCallback(
    ({ url, ext }: { url: string; ext: string }) => {
      // 오디오 url 저장 (url은 녹음이 저장된 위치)
      setAudioUrl(url);
      setState(null);
      stopTimer();
      showToast();
      transcribeAudio({ url, ext });
    },
    [showToast, stopTimer, transcribeAudio]
  );

  const hasReactNativeWebview =
    typeof window != "undefined" && window.ReactNativeWebView != null;

  const postMessageToRN = useCallback(
    ({ type, data }: { type: string; data?: any }) => {
      window.ReactNativeWebView?.postMessage(JSON.stringify({ type, data }));
    },
    []
  );

  const onPauseRecord = useCallback(() => {
    stopTimer();
    setState("paused");
  }, [stopTimer]);

  const onResumeRecord = useCallback(() => {
    startTimer();
    setState("recording");
  }, [startTimer]);

  useEffect(() => {
    // 핸들러는 웹뷰일 때만 등록하면 됨
    if (hasReactNativeWebview) {
      const handleMessage = (event: any) => {
        const { type, data } = JSON.parse(event.data);

        if (type === "onStartRecord") {
          // 앱에서 녹음이 시작됬구나
          onStartRecord();
        } else if (type === "onStopRecord") {
          // 앱에서 녹음이 멈췄구나
          // onStopRecord({ url, ext });여기서 url은 blob을 url로 변환 했었음, 웹에서오는 오디오 데이터를 base64 string으로 받았음
          // 이거를 blob으로 바꾸고 거기서 url을 얻어서 전달 해줘야함 (base64ToBlob 함수 참고)
          const { audio, mimeType, ext } = data;
          const blob = base64ToBlob(audio, mimeType);
          const url = URL.createObjectURL(blob);

          onStopRecord({ url, ext });
        } else if (type === "onPauseRecord") {
          // 앱에서 녹음이 일시정지 됬구나
          onPauseRecord();
        } else if (type === "onResumeRecord") {
          // 앱에서 녹음이 다시 시작 됬구나
          onResumeRecord();
        } else if (type === "onTakePhoto") {
          // concat은 두 array를 합쳐주기 때문에 data를 배열로 넣어줘야함
          setPhotos((prev) => prev.concat([data]));
        }
      };

      // window, document 둘 다 넣어줘야 iOS, 안드로이드 둘 다 동작함
      // message - 웹뷰에서 메시지가 도착했을 때 발생하는 이벤트
      window.addEventListener("message", handleMessage); // 안드로이드 지원
      document.addEventListener("message", handleMessage); // iOS 지원

      return () => {
        window.removeEventListener("message", handleMessage);
        document.removeEventListener("message", handleMessage);
      };
    }
  }, [
    hasReactNativeWebview,
    onPauseRecord,
    onResumeRecord,
    onStartRecord,
    onStopRecord,
  ]);

  const handleStartRecord = useCallback(() => {
    if (hasReactNativeWebview) {
      postMessageToRN({ type: "start-record" });
      // 이렇게 햇을때 이제 앱에 start-record라는 메시지가 갈거고 앱은 이 start-record 메시지가 왔으면 녹음을 해야겠다 해서 앱에 있는 오디오 리소스를 이용해서 녹음을 시작하게됨
      return;
    }

    // 웹에서 record 할때는 mediaRecorder 이용해서 구현가능함
    window.navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then((stream) => {
        // 두 번째 인자 오디오 타입
        const mimeType = "audio/webm"; // audio/webm 크롬에서만 지원 (사파리 안됨)
        const mediaRecorder = new MediaRecorder(stream, { mimeType });

        mediaRecorderRef.current = mediaRecorder;

        // 녹음 시작될 때
        mediaRecorder.onstart = () => {
          onStartRecord();
        };

        // 녹음 중 데이터 저장로직
        mediaRecorder.ondataavailable = (event) =>
          chunksRef.current.push(event.data);

        // 녹음 종료될 때
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, {
            type: chunksRef.current[0].type,
          });

          // 다음 녹음을 위해 데이터 초기화
          chunksRef.current = [];
          const url = URL.createObjectURL(blob);
          onStopRecord({ url, ext: "webm" });
          // 녹음 종료 후 스트림 중지
          stream.getAudioTracks().forEach((track) => track.stop());
        };
        mediaRecorder.start();
      });
  }, [hasReactNativeWebview, onStartRecord, onStopRecord, postMessageToRN]);

  const stop = useCallback(() => {
    if (hasReactNativeWebview) {
      // hasReactNativeWebview 있다면 앱으로 stop-record 메시지 보내고 종료
      postMessageToRN({ type: "stop-record" });
      return;
    }

    if (mediaRecorderRef.current != null) {
      mediaRecorderRef.current.stop();
    }
  }, [hasReactNativeWebview, postMessageToRN]);

  const pause = useCallback(() => {
    if (hasReactNativeWebview) {
      postMessageToRN({ type: "pause-record" });
      return;
    }

    if (mediaRecorderRef.current != null) {
      mediaRecorderRef.current.pause();
    }
  }, [hasReactNativeWebview, postMessageToRN]);

  const resume = useCallback(() => {
    if (hasReactNativeWebview) {
      postMessageToRN({ type: "resume-record" });
      return;
    }

    if (mediaRecorderRef.current != null) {
      mediaRecorderRef.current.resume();
    }
  }, [hasReactNativeWebview, postMessageToRN]);

  const handlePauseRecord = useCallback(() => {
    if (state === "recording") {
      pause();
      onPauseRecord();
    } else if (state === "paused") {
      resume();
      onResumeRecord();
    }
  }, [onPauseRecord, onResumeRecord, pause, resume, state]);

  const handleSaveRecord = useCallback(() => {
    // record stop 로직
    stop();
  }, [stop]);

  const onPressRecord = useCallback(() => {
    if (state == null) {
      handleStartRecord();
    } else if (state === "recording" || state === "paused") {
      handlePauseRecord();
    }
  }, [handleStartRecord, handlePauseRecord, state]);

  const onPressCamera = useCallback(() => {
    postMessageToRN({ type: "open-camera" });
  }, [postMessageToRN]);

  return (
    <div className="h-screen bg-white flex flex-col">
      <Header
        title="녹음하기"
        renderRight={() => {
          if (!hasReactNativeWebview) {
            return <></>;
          }

          return (
            <button type="button" onClick={onPressCamera} className="mr-16">
              <span className="material-icons text-textGray text-30">
                photo_camera
              </span>
            </button>
          );
        }}
      />
      <div className="flex flex-1 flex-col items-center pt-211">
        <button
          type="button"
          onClick={onPressRecord}
          className="size-120 rounded-full bg-black flex items-center justify-center"
        >
          <span
            className={cn("material-icons text-70", {
              "text-green": state == null,
              "text-white": state === "recording" || state === "paused",
            })}
          >
            {state === "paused" ? "pause" : "mic"}
          </span>
        </button>
        <p
          className={cn("mt-42 text-20 font-semibold", {
            "text-gray": state == null,
            "text-darkGray": state === "recording" || state === "paused",
          })}
        >
          {formatTime(time)}
        </p>
        {state === "recording" && (
          <button
            type="button"
            onClick={handlePauseRecord}
            className="mt-42 bg-black rounded-27 px-42 py-16 items-center flex text-white"
          >
            <span className="material-icons text-20 mr-4">pause</span>
            <span className="text-15 font-semibold">일시정지</span>
          </button>
        )}
        {(state === "recording" || state === "paused") && (
          <button
            type="button"
            onClick={handleSaveRecord}
            className={cn(
              "bg-green rounded-27 px-42 py-16 items-center flex text-white",
              {
                "mt-16": state === "recording",
                "mt-42": state === "paused",
              }
            )}
          >
            <span className="material-icons text-20 mr-4">check</span>
            <span className="text-15 font-semibold">저장하기</span>
          </button>
        )}
        {toastVisible && (
          <div className="absolute bottom-21 flex border-1 border-green w-[358px] py-13 px-17 rounded-6 bg-lightGray">
            <span className="material-icons text-24 text-green mr-7">
              check
            </span>
            <p className="text-15 font-semibold text-title">
              저장이 완료되었습니다.
            </p>
          </div>
        )}
        {audioUrl != null && (
          <audio controls>
            <source src={audioUrl} type="audio/webm" />
          </audio>
        )}
      </div>
    </div>
  );
}
