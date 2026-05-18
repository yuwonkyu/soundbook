# SoundBook 설정 체크리스트

## Supabase 연결 (현재 보류 중)

> 무료 플랜 프로젝트 슬롯 부족으로 목 데이터로 운영 중.
> 준비되면 아래 순서대로 진행.

### 1단계 — Supabase 프로젝트 확보
- [ ] 기존 프로젝트 중 하나 일시정지(Pause) **또는** 새 계정으로 프로젝트 생성
- [ ] 프로젝트 생성 완료 확인

### 2단계 — 스키마 적용
- [ ] Supabase Dashboard → **SQL Editor** 열기
- [ ] `supabase/schema.sql` 전체 복붙 → **Run**
- [ ] `books`, `scenes`, `audio_mappings` 테이블 생성 확인

### 3단계 — API 키 발급
- [ ] **Anthropic** : [console.anthropic.com](https://console.anthropic.com) → API Keys
- [ ] **Freesound** : [freesound.org/apiv2/apply](https://freesound.org/apiv2/apply) → 앱 등록 후 Client Secret 복사

### 4단계 — `.env.local` 작성
`.env.local.example` 을 복사해서 값 채우기:

```
NEXT_PUBLIC_SUPABASE_URL=         # Supabase → Project Settings → API → URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Supabase → Project Settings → API → anon public
SUPABASE_SERVICE_ROLE_KEY=        # Supabase → Project Settings → API → service_role secret
ANTHROPIC_API_KEY=                # Anthropic Console
FREESOUND_API_KEY=                # Freesound 앱 등록
```

### 5단계 — 동작 확인
- [ ] `npm run dev` 재시작
- [ ] 아래 curl로 첫 책 import 테스트

```bash
curl -X POST http://localhost:3000/api/books/import \
  -H "Content-Type: application/json" \
  -d '{"gutenbergId": 1342}'
# 반환된 bookId로 /book/{bookId} 접속
```

- [ ] `/book/{bookId}` 에서 리더 동작 확인
- [ ] `/editor/{bookId}` 에서 에디터 동작 확인

---

## Vercel 배포

- [ ] `npx vercel` 실행
- [ ] Vercel 대시보드 → **Environment Variables** 에 위 5개 키 등록
- [ ] 재배포 후 프로덕션 URL 확인

---

> **참고**: `.env.local`의 `NEXT_PUBLIC_SUPABASE_URL`이 비어있으면
> 자동으로 목 데이터 모드로 동작합니다 (`src/lib/is-mock.ts`).
