# 팀 저장소 규칙 (Claude Code · Codex 공통)

작업 전에 이 문서를 읽는다. 하위 폴더에서 작업하면 그 폴더의 `AGENTS.md`도 함께 따른다.

## 폴더 지도

```
project/
├── AGENTS.md      이 문서 (루트 규칙)
├── CLAUDE.md      @AGENTS.md 한 줄
├── PRD.md         기준 문서
├── 기획/          종합·제안·설계 문서
├── Research/      원본 조사 → Research/AGENTS.md
├── Design/        와이어프레임·화면·프론트엔드 → Design/AGENTS.md
└── dev/           개발 코드
    └── landing/   랜딩 페이지
```

## 규칙

| 규칙 | 내용 |
|---|---|
| 기준 문서 | `PRD.md` 하나. 모든 기획 문서는 PRD를 기준으로 쓴다 |
| 문서 위치 | 루트에는 규칙 문서와 PRD만 둔다. 종합·제안·설계 문서는 `기획/`에 둔다 |
| 파일 이름 | `기획/`은 `주제_이름.md` (예: `유저루프_조재영.md`) |
| 문서 머리 표 | 작성일 / 작성자 / 기준 문서(PRD) / 원본 조사 |
| 인용 | `[이름]` = `Research/outputs/경쟁사조사/`의 그 사람 원본 조사. 원본에 URL이 없는 내용은 `[미확인]`을 붙인다. **종합 문서는 근거로 인용하지 않는다.** 원본을 인용한다 |
| 출처 기록 | 새 URL은 `Research/sources/source-log.md`에 추가한다 |
| 산출물 | 문서당 md 하나, 필요하면 html 하나. 이미지·검증 파일 같은 중간 산출물은 올리지 않는다. 다이어그램은 md 안의 Mermaid를 우선 쓴다 |
| 도구 위치 | 리서치 스킬(`/market` 등)은 `Research/`에서, Figma MCP는 `Design/`에서 Claude Code를 실행해야 켜진다 |
| 다른 사람 파일 | 고치거나 옮기면 커밋 메시지와 팀 채팅으로 알린다 |
| 규칙 파일 | 규칙 본문은 `AGENTS.md`에 쓰고, `CLAUDE.md`는 `@AGENTS.md` 한 줄로 둔다. 새 폴더에 규칙이 필요해도 같은 방식이다 |
