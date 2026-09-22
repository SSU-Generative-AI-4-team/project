# Design

이 폴더는 Design 담당자가 와이어프레임 → 화면 디자인 → 프론트엔드 구현까지 전 과정을 진행하는 공간입니다.

## 폴더 구조

| 폴더 | 용도 |
|---|---|
| [`wireframes/`](wireframes/README.md) | 저해상도 와이어프레임(초안) |
| [`screens/`](screens/README.md) | 고해상도 화면 디자인(최종 목업) |
| [`frontend/`](frontend/README.md) | 프론트엔드 구현 코드 |
| [`decisions/`](decisions/README.md) | 모든 설계 결정의 근거 기록 |

`Design/CLAUDE.md`는 Claude Code가 이 폴더에서 작업할 때 자동으로 따르는 하네스 규칙 문서입니다(300자 이내 유지).

## 작업 흐름

1. `wireframes/`에 초안 작성
2. `screens/`에 최종 화면 디자인 작성
3. 같은 화면명으로 `decisions/`에 근거 문서 작성 (템플릿: [`decisions/TEMPLATE.md`](decisions/TEMPLATE.md))
4. 확정되면 `frontend/`에서 구현

세 폴더(`wireframes`, `screens`, `decisions`)의 파일명은 화면명을 동일하게 맞춰서, 하나의 화면을 세 폴더를 오가며 추적할 수 있게 합니다. 예: `login-v1.png` (wireframes) → `login.png` (screens) → `login-decision.md` (decisions).

## Figma MCP 연결

프로젝트 루트가 아닌 `Design/.mcp.json`에 Figma 공식 원격 MCP 서버(`https://mcp.figma.com/mcp`)가 등록되어 있습니다. `Design/` 폴더 안에서 Claude Code를 실행하면 최초 1회 브라우저에서 Figma 계정으로 OAuth 로그인하라는 안내가 뜨며, 로그인 후에는 팀원 누구나 별도 설정 없이 Figma 디자인 컨텍스트를 조회할 수 있습니다.
