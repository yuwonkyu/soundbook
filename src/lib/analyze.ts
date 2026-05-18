import Anthropic from "@anthropic-ai/sdk";

export type SceneEmotion = {
  scene: string;
  emotion: string;       // e.g. "tension", "joy", "melancholy", "fear", "calm"
  intensity: number;     // 0–1
  tags: string[];        // e.g. ["battle", "night", "rain"]
};

const client = new Anthropic();

export async function analyzeSceneEmotions(
  passages: string[]
): Promise<SceneEmotion[]> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `다음 소설 단락들의 감정과 분위기를 분석해서 JSON 배열로 반환해줘.
각 항목은 { scene, emotion, intensity, tags } 형태여야 해.
emotion은 영문 소문자 한 단어 (tension/joy/melancholy/fear/calm/mystery/romance 중 하나).
intensity는 0~1 사이 숫자.
tags는 배경·상황 키워드 2~4개 영문 소문자 배열.

단락들:
${passages.map((p, i) => `[${i}] ${p}`).join("\n\n")}

JSON 배열만 반환해. 다른 설명 없이.`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(text) as SceneEmotion[];
}
