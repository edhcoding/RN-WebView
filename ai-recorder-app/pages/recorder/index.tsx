import Header from "@/components/Header";
import { useCallback, useEffect, useRef, useState } from "react";
import cn from "classnames";
import { formatTime } from "@/modules/Util";

export default function Recorder() {
  const [state, setState] = useState<"recording" | "paused" | null>(null); // 녹음 상태
  const [toastVisible, setToastVisible] = useState<boolean>(false); // 토스트 상태
  const [time, setTime] = useState<number>(0); // 녹음 시간
  const [audioUrl, setAudioUrl] = useState<string | null>(null); // 저장된 녹음 오디오 파일

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

      const data = await transcriptionRes.json();
      console.log("data", data);
    },
    []
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

  const handleStartRecord = useCallback(() => {
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
  }, [onStartRecord, onStopRecord]);

  const pause = useCallback(() => {
    if (mediaRecorderRef.current != null) {
      mediaRecorderRef.current.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (mediaRecorderRef.current != null) {
      mediaRecorderRef.current.resume();
    }
  }, []);

  const handlePauseRecord = useCallback(() => {
    if (state === "recording") {
      pause();
      stopTimer();
      setState("paused");
    } else if (state === "paused") {
      resume();
      startTimer();
      setState("recording");
    }
  }, [pause, resume, startTimer, state, stopTimer]);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current != null) {
      mediaRecorderRef.current.stop();
    }
  }, []);

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

  return (
    <div className="h-screen bg-white flex flex-col">
      <Header title="녹음하기" />
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
