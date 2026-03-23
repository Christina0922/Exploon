# Exploon (MVP)

복잡한 텍스트를 이해하기 쉬운 **4칸 만화(이미지 + 캡션)**로 바꿔주는 MVP입니다.

## 준비물

1. OpenAI API Key
2. 프로젝트 루트에 `.env.local` 생성

`.env.local` 예시는 `/.env.local.example`을 참고하세요.

## 실행 방법

```bash
cd d:/1000_b_project/Exploon
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 접속.

## 동작 방식(간단)

1. 입력 텍스트(또는 PDF/TXT)에서 내용을 읽습니다.
2. GPT가 4개의 패널(JSON)로 나눠서 캡션을 만듭니다.
3. 각 패널 설명으로 이미지 생성을 요청합니다.
4. 화면에 4장을 세로로 표시합니다.

## 참고

- 이미지(OCR)는 MVP에서 실제 OCR을 하지 않고, 업로드 이미지는 “참고용”으로만 취급합니다.
- No DB / No Auth 입니다(스탯리스 MVP).

