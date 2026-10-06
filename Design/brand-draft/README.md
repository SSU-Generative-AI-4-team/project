# 6주차 준비물 — 로고 · 키 비주얼 초안 (팀 검토 전)

| 항목 | 내용 |
| --- | --- |
| 작성일 | 2026-10-06 |
| 기준 문서 | `PRD.md` v0.1, `기획/brand_홍석민(챕터 4까지 완성).md` |
| 도구 | Claude Code (SVG 코드로 직접 그림, 5주차 강의 36쪽 방식) |

## 로고 (`logo/`)

| 방향 | 파일 | 뜻 | 5주차 3기준 (32px · 흑백 · 설명 없이) |
| --- | --- | --- | --- |
| A. 타는 메모지 | `logo-A.svg` | 쓴 종이 모서리에 불이 붙음 | 32px 통과 · 흑백 통과 · "쓴 걸 태운다"로 읽힘 |
| B. 타는 편지봉투 | `logo-B.svg` | 부치지 못한 말을 태운다 | 32px 통과 · 흑백 통과 · "편지를 태운다"로 읽힘 |
| C. 타는 말풍선 | `logo-C.svg` | 털어놓은 말이 탄다 | 32px 통과 · 흑백 통과 · "말을 태운다"로 읽힘 |

- v1(빈 원, 연기, 종이 조각)은 "한눈에 무슨 서비스인지 모르겠다"는 피드백으로 폐기하고 v2로 다시 그림
- 주의: 불꽃 + 일상 아이콘 조합이라 직관적인 대신 흔해 보일 수 있음 (5주차 "업종에서 흔한 상징" 기준)
- 글자(서비스명)는 이름이 정해진 뒤 폰트로 붙인다 (5주차: 그림은 AI, 글자는 폰트)

## 키 비주얼 (`keyvisual/`)

| 비율 | 파일 | 글자 자리 |
| --- | --- | --- |
| 16:9 (웹 상단 · 썸네일) | `kv-16x9.svg` | 왼쪽 |
| 1:1 (인스타 피드) | `kv-1x1.svg` | 위아래 |
| 9:16 (릴스 · 스토리) | `kv-9x16.svg` | 위 1/3 |

- 장면: 한지 한 장의 모서리가 타 들어가고, 써 둔 줄이 위쪽부터 흐려지며, 불씨와 연기가 흩어진다
- 세 장 모두 같은 장면 · 같은 색 · 비율만 다름

## 더 풍부한 키 비주얼이 필요할 때 — Gemini용 프롬프트 (5주차 다섯 칸)

```
A single sheet of off-white hanji paper on a wooden desk, its top-right corner slowly burning into a thin ember edge, faint handwriting lines fading near the burn, a few small embers and one thin wisp of smoke rising, editorial illustration, flat shapes with soft paper grain, hands and faces absent, top-down view, warm evening desk lamp light, muted palette with one accent in the orange of a dying ember on an off-white background, no text, no logos, no watermark, generous negative space on the left for text, 16:9
```
- 1:1은 마지막 줄을 `subject centered, 1:1`로, 9:16은 `subject in the lower half, upper third empty for text, 9:16`로 바꾼다
- 처음 한 장이 마음에 들면 "Same scene, same light, same colors. Extend to 16:9…"처럼 편집으로 비율만 바꾼다 (5주차 44쪽)
