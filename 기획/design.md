# design.md — 해칫 (hatch eat) 화면 규칙 · 6주차  (brand.md와 함께 AI에게 준다)

| 항목 | 내용 |
| --- | --- |
| 작성일 | 2026-10-13 |
| 작성자 | 홍석민 (Claude Code로 작성) |
| 기준 문서 | `기획/PRD_1006.md`, `기획/brand_1013.md` |
| 원본 조사 | 없음 (brand_1013의 시각 방향·이미지 스타일 블록, `Design/decisions/logo-decision.md`에서 도출) |
| 수정 | 2026-10-13 김서영: 색을 `Design/brand/color/haechi_color_palette_guideline.md`(해치 블루 메인)로, 제목 글꼴을 영남일보체로 교체 |

## 브랜드 색 — `Design/brand/color/haechi_color_palette_guideline.md` 기준 (2026-10-13 교체)

원칙: **배경은 조용하게, UI는 블루 중심, 캐릭터만 컬러풀하게.** 화면은 "크림색 화면 → 먹색 정보 → 블루 인터랙션 → 해치의 노랑·빨강" 순서로 읽혀야 한다.

### UI 색 (5개를 넘기지 않는다)

| 토큰 | HEX | 이름 | 쓰는 곳 | 대비 |
| --- | --- | --- | --- | --- |
| bg | **#F2EBDD** | 한지 크림 Hanji Cream | 페이지 기본 배경 | — |
| surface | **#FDF5E9** | 해치 아이보리 Haechi Ivory | 카드 · 입력창 · 모달 · 쓰기 한지 | — |
| text | **#2A2826** | 먹 Ink Black | 본문 글씨 | bg 위 12.4:1 ✅ |
| muted | **rgba(42, 40, 38, 0.72)** | 옅은 먹 | 보조 글자 · 안내 | bg 위 약 5:1 ✅ |
| primary | **#2A6090** | 해치 블루 Haechi Blue | 주요 버튼 · 링크 · 선택 상태 · 주요 아이콘 · 진행 표시 | bg 위 5.58:1 ✅ · 아이보리 글자 6.12:1 ✅ |

선: `rgba(42, 40, 38, 0.15)` (먹을 옅게. 새 색을 만들지 않는다)

### 강조 색 (UI 메인 색이 아니다)

| 이름 | HEX | 쓰는 곳 | 쓰지 않는 곳 |
| --- | --- | --- | --- |
| 해치 골드 Haechi Gold | **#F0B237** | 해치 갈기, 완료 표시, 작은 강조 칩(글자는 먹 7.8:1) | 넓은 배경, 글자색(크림 위 1.6:1 ❌) |
| 해치 레드 Haechi Red | **#EB4531** | 해치 귀 · 코, 아주 중요한 포인트 하나 | 일반 버튼, 반복 사용, 글자색(아이보리 위 3.6:1 ❌) |
| 웜 블랙 Warm Black | **#38322B** | 짙은 오브젝트(벼루 · 먹 같은 그림 요소) | — |

### 비율과 규칙

- **70% 한지 크림 · 아이보리 / 20% 해치 블루 / 10% 골드 + 레드.** 화면에서 가장 많이 보이는 유채색은 블루다
- 캐릭터(해치)는 골드 · 레드 · 블루 · 아이보리 · 검정 고유색을 그대로 쓴다. 화면에서 가장 컬러풀한 것은 해치다
- 순백 `#FFFFFF` 배경, 순검정 `#000000` 글씨, 넓은 그라데이션, 새 파스텔 색은 쓰지 않는다
- 한 화면에서 블루 · 레드 · 골드를 같은 비중으로 쓰지 않는다
- 근거(muted): 가이드의 보조 글자 `rgba(42, 40, 38, 0.65)`는 한지 크림 위 4.4:1로 본문 기준(4.5:1)에 조금 못 미쳐 0.72로 올렸다
- 변경: 10/13 초안의 이끼 초록 `#3F6B57` · 안개 `#F5F8F4` 팔레트는 이 가이드로 바꿨다. 확정 로고 · 키 비주얼의 노랑 · 빨강 · 파랑과 한 앱으로 보이게 하기 위해서다

## 시맨틱 색 (상태에만 — 뜻으로 부른다)

success: **#F0B237** (골드, 아이콘 · 칩 배경, 글자는 먹)   danger: **#EB4531** (레드, 아이콘 · 테두리만, 글자는 먹)   info · warning: **muted** (아이콘으로 구분)   항상 아이콘 · 문구와 함께, 색만으로 구분하지 않는다

- 근거: 가이드는 새 색 추가를 피하라고 한다. 상태 색도 브랜드 강조색 두 개로만 쓴다. 레드와 골드는 글자색으로 대비가 부족해서 글자는 늘 먹으로 쓴다

## 글자 (2개)

heading: **영남일보체 YNAMNEWS, Bold**   body: **Pretendard, 400/600**   해치 말풍선: **영남일보체 YNAMNEWS, Medium**

크기 5단계만: 13 · 15 · 17 · 22 · 28   본문 15, 줄 간격 1.5

- 파일: `Design/brand/font/YNAMNEWS(B).otf` · `YNAMNEWS(M).otf` (다온폰트 제작, 2024)
- 근거(heading): 손으로 쓴 듯 둥근 획의 고딕이라 점토 인형 해치와 결이 맞고, 제목과 말풍선이 해치의 목소리처럼 읽힌다
- 근거(body): Pretendard(OFL 상업용 무료)는 꾸밈이 없어 안내 문구가 **담백하고** 작은 크기에서도 또렷하다. 본문까지 손글씨 결이면 읽느라 느려진다
- `[확인 필요]` 영남일보체 라이선스: 폰트 파일에는 "Copyright 2024 DAONFONT. All right reserved."만 적혀 있고 사용 범위가 없다. 상업 이용 · 웹폰트 임베딩 · 공개 저장소 재배포가 되는지 배포처에서 확인하기 전까지 폰트 파일을 공개 저장소에 올리지 않는다
- 변경: 10/13 초안의 고운바탕(heading)은 영남일보체로 바꿨다

## 간격 — 8의 배수

좌우 여백 16 · 요소 사이 8 · 카드 안 16 · 섹션 사이 24 · 화면 위아래 32

## 버튼 (3종 × 상태 4)

primary: primary 채움, 아이보리(surface) 글자, 높이 48, 가로 꽉   secondary: surface 채움, 테두리 1px primary, 글자 primary   danger: surface 채움, 테두리 1px danger, 글자 text(먹)

상태: default / pressed(10% 어둡게) / loading(글자 → 진행 문구) / disabled(muted 40%)

모서리: **8** 전부 같은 값   한 화면에 primary 버튼은 1개, 아래 고정

- 근거(모서리 8): 무드 명사 '한지결'의 종이 한 장과 '서안'의 낮은 책상은 네모난 사물이라 999(알약)는 맞지 않는다. 한편 '수호하는 해치'는 둥근 몸이고 한지 가장자리도 칼로 자른 듯 날카롭지 않아서 0은 너무 딱딱하다. 그래서 네모를 유지하되 모서리만 부드럽게 한다.

## 입력

높이 48 · 배경 surface(#FDF5E9) · 테두리 1px line · 포커스 시 primary · 기본값은 미리 채워 둔다 · 질문 하나당 3초 안에 답할 수 있게

## 패턴 (바꾸지 않는다)

뒤로가기 왼쪽 위 · 탭바 아래 · 추가 버튼 오른쪽 아래 · 당겨서 새로고침 · 위험한 동작은 위쪽 작게 + 확인 한 번

## 이미지

키 비주얼 · 로고 · 새 이미지는 brand_1013.md의 '이미지 스타일 블록'으로만 생성. 로고(`Design/brand/logo/haechi_yellow.png`)는 첫 화면 왼쪽 위 1회

## 말투

버튼·에러·빈 화면 문구는 brand_1013.md 보이스 규칙(형용사 3 · 금지어 12)을 따른다. 에러는 "무엇을 하면 되는지"까지 쓴다

| 종류 | 기본 문구 1 | 기본 문구 2 |
| --- | --- | --- |
| 버튼 | 해치에게 건네기 | 먹 조금 더 갈기 |
| 에러 | 해치가 아직 받지 못했어요. 적은 글은 그대로 있으니 한 번 더 건네 주세요. | 한지가 비어 있어요. 한 글자라도 적으면 건넬 수 있어요. |
| 빈 화면 | 남겨두기 싫은 말을 여기에 적어 보세요. 적은 글은 어디에도 저장되지 않아요. | 아직 필사한 글이 없어요. 먹이 다 진해지면 이곳에 한 장씩 모여요. |

- 근거(문구): 서비스 안내는 담백한 해요체로 쓴다. 해치 하오체는 말풍선에만 쓰므로 여기에는 넣지 않는다. 동작은 "태우다"가 아니라 "건네다·먹다"로 쓴다.
- 검증(금지어): 12개 금지어(힐링·치유·태우다·연속 N일·오랜만이에요·아무것도 남지 않아요 등)를 모두 대조했고 해당 없음. "저장되지 않아요"는 원문 기준이라 금지어 11과 충돌하지 않는다. 재촉하는 말("지금", "서두르세요", "!")도 없다.

## 코드로 옮길 때 (HTML :root 변수 이름 — 이 이름 그대로)

--color-primary --color-text --color-muted --color-line --color-bg --color-surface --color-success --color-warning --color-danger --color-info --color-accent-warm --color-accent-red · --font-heading --font-body · --fs-xs~xl · --sp-1~4 · --radius · --btn-h

```css
:root {
  /* Brand token — Design/brand/color/haechi_color_palette_guideline.md */
  --haechi-gold: #F0B237;
  --haechi-red: #EB4531;
  --haechi-blue: #2A6090;
  --haechi-ivory: #FDF5E9;
  --hanji-cream: #F2EBDD;
  --ink-black: #2A2826;
  --warm-black: #38322B;

  /* Semantic token */
  --color-bg: var(--hanji-cream);
  --color-surface: var(--haechi-ivory);
  --color-text: var(--ink-black);
  --color-muted: rgba(42, 40, 38, 0.72);
  --color-line: rgba(42, 40, 38, 0.15);
  --color-primary: var(--haechi-blue);
  --color-accent-warm: var(--haechi-gold);
  --color-accent-red: var(--haechi-red);
  --color-success: var(--haechi-gold);
  --color-warning: var(--color-muted);
  --color-danger: var(--haechi-red);
  --color-info: var(--color-muted);

  --font-heading: "YNAMNEWS", "Pretendard", "Apple SD Gothic Neo", sans-serif;
  --font-body: "Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif;
  --fs-xs: 13px; --fs-s: 15px; --fs-m: 17px; --fs-l: 22px; --fs-xl: 28px;
  --sp-1: 8px; --sp-2: 16px; --sp-3: 24px; --sp-4: 32px;
  --radius: 8px;
  --btn-h: 48px;
}
```
