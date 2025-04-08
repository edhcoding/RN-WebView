// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import OpenAI from "openai";
import fs from "fs";

// formidable의 parser와 next.js api bodyParser가 충돌나서 이렇게 꺼줘야함
export const config = {
  api: {
    bodyParser: false,
  },
};

// openai 초기화
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || "",
});

// 오디오 인풋 데이터를 받을때는 서버 API로 파일을 전송할때는 formdata 형식으로 전송, 그래서 api가 form에서 데이터를 파싱해줘야함, 이런 작업을 해주는 여려 라이브러리가 있음(formidable)
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Input: audio input
  // OpenAI: audio -> text
  // Output: text

  // 이 handler는 post만 허용
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  // form 데이터 받아서 오디오 데이터를 파싱
  // keepExtensions: true 하면 파일 확장자 그대로 저장
  const form = formidable({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err)
      return res.status(500).json({ error: "Failed to parse form data" });

    const file = files.file?.[0];
    if (file == null) {
      console.error("No file uploaded");
      return res.status(500).json({ error: "No file uploaded" });
    }

    try {
      // 음성을 텍스트로 변환 (whisper api)
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(file.filepath),
        model: "whisper-1",
        language: "ko",
        response_format: "verbose_json", // 이 옵션 안주면 그냥 text만 반환되는데, 시간 정보도 필요함 - verbose_json 옵션 주면 각 텍스트가 오디오에서 어떤 시각에 있는 정보까지 반환됨
      });

      console.log("transcription", transcription);
      return res.status(200).json({ transcription });
    } catch (error) {
      console.error("Error transcribing audio", error);
      return res.status(500).json({ error: "Error transcribing audio" });
    } finally {
      // 파일을 전부 처리햇으니까 지워줘야함
      fs.unlink(file.filepath, (unlinkErr) => {
        if (unlinkErr) {
          console.error("Error deleting file", unlinkErr);
        }
      });
    }
  });
}
