export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl font-bold mb-6 bg-linear-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
          SoundBook
        </h1>
        <p className="text-xl text-gray-400 mb-4">
          AI가 소설을 읽고 장면마다 어울리는 음악을 찾아드립니다
        </p>
        <p className="text-gray-500 mb-12">
          텍스트의 감정과 분위기를 분석하여 BGM·효과음을 자동 매핑
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
          <a
            href="/book/sample"
            className="px-8 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-medium transition-colors"
          >
            샘플 책 읽기
          </a>
          <a
            href="/editor/sample"
            className="px-8 py-3 border border-gray-600 hover:border-gray-400 rounded-lg font-medium transition-colors"
          >
            에디터 열기
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          {[
            {
              title: "감정 분석",
              desc: "Claude AI가 각 장면의 감정·분위기를 자동으로 분류합니다",
            },
            {
              title: "오디오 매핑",
              desc: "Freesound CC 라이브러리에서 어울리는 BGM·효과음을 찾습니다",
            },
            {
              title: "직접 수정",
              desc: "에디터에서 매핑 결과를 검토하고 원하는 대로 바꿀 수 있습니다",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="p-6 rounded-xl bg-gray-900 border border-gray-800"
            >
              <h3 className="font-semibold mb-2 text-purple-300">{item.title}</h3>
              <p className="text-sm text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
