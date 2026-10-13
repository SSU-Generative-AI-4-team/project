# 해치 컬러 팔레트 가이드

## 1. 전체 방향

> **기본 화면은 한지 크림·아이보리처럼 밝고 차분하게 유지하고, 해치 블루를 메인 UI 컬러로 사용한다. 골드와 레드는 캐릭터 및 강조 요소에만 제한적으로 사용한다.**

### 권장 색상 비율

| 비중 | 컬러 | 역할 |
|---|---|---|
| 70% | Hanji Cream / Ivory | 배경·카드·여백 |
| 20% | Haechi Blue | 버튼·링크·선택 상태 |
| 10% | Gold + Red | 강조·캐릭터·포인트 |

---

## 2. 브랜드 컬러

| 컬러 | HEX | 역할 |
|---|---|---|
| Haechi Gold | `#F0B237` | 해치 머리, 따뜻한 강조 |
| Haechi Red | `#EB4531` | 해치 귀·코, 강한 포인트 |
| Haechi Blue | `#2A6090` | 메인 브랜드/UI 컬러 |
| Haechi Ivory | `#FDF5E9` | 밝은 표면·캐릭터 바디 |
| Hanji Cream | `#F2EBDD` | 기본 배경색 |
| Ink Black | `#2A2826` | 기본 텍스트 컬러 |
| Warm Black | `#38322B` | 보조 텍스트·짙은 오브젝트 |

---

## 3. UI 적용 규칙

### Background

```text
기본 페이지 배경
#F2EBDD  Hanji Cream

밝은 카드 / 입력창 / 모달
#FDF5E9  Haechi Ivory
```

순백색 `#FFFFFF`을 메인 배경으로 사용하기보다 **한지색 계열을 기본**으로 사용한다.

### Primary

```text
Primary
#2A6090
```

사용 위치:
- 주요 CTA 버튼
- 활성화된 메뉴
- 링크
- 선택 상태
- 주요 아이콘
- Progress / Toggle 등

**UI에서 가장 많이 보이는 유채색은 Haechi Blue가 되도록 유지한다.**

### Accent

```text
Gold  #F0B237
Red   #EB4531
```

둘 다 메인 UI 컬러가 아니라 **포인트 컬러**로 사용한다.

권장 역할:
- Gold → 따뜻함 / 완료 / 작은 강조
- Red → 캐릭터 / 아주 중요한 포인트

특히 Red는 화면 전체에서 반복적으로 사용하지 않는다.

---

## 4. 텍스트 컬러

### 기본 본문

```text
#2A2826
```

완전한 검정 `#000000` 대신 **Ink Black**을 사용한다.

### 보조 정보

```text
#38322B
```

실제 UI에서는 투명도를 활용해 다음처럼 사용할 수 있다.

```css
color: rgba(42, 40, 38, 0.65);
```

---

## 5. 색 사용 우선순위

```text
Hanji Cream
      ↓
Ivory
      ↓
Ink Black
      ↓
Haechi Blue
      ↓
Gold
      ↓
Red
```

화면을 처음 봤을 때 다음 순서로 인식되는 것이 가장 좋다.

> **크림색 화면 → 먹색 정보 → 블루 인터랙션 → 해치의 노랑·빨강**

---

## 6. 해치 캐릭터와 UI 컬러 분리

### 캐릭터

```text
Gold
Red
Blue
Ivory
Black
```

캐릭터는 고유 색상을 그대로 유지한다.

### UI

```text
Hanji Cream
Ivory
Ink Black
Blue
```

UI는 위 네 가지를 중심으로 제한한다.

> **캐릭터가 화면에서 가장 컬러풀한 요소가 되도록 한다.**

---

## 7. 추천 조합

### 기본 화면

```text
Background    #F2EBDD
Surface       #FDF5E9
Text          #2A2826
Primary       #2A6090
```

### Primary Button

```text
Background    #2A6090
Text          #FDF5E9
```

### Secondary Button

```text
Background    #FDF5E9
Border        #2A6090
Text          #2A6090
```

### 강조 카드

```text
Background    #FDF5E9
Accent        #F0B237
Text          #2A2826
```

---

## 8. 피해야 할 사용

### 피할 것

- 한 화면에서 Blue + Red + Gold를 동일 비중으로 사용
- Red를 일반 CTA 버튼에 반복 사용
- Gold를 넓은 배경색으로 사용
- 새 파스텔 컬러를 임의로 계속 추가
- `#000000`처럼 지나치게 강한 검정 사용
- 순백색 UI를 기본으로 사용
- 그라데이션을 과하게 사용

### 권장 원칙

> **배경은 조용하게, UI는 블루 중심, 캐릭터만 컬러풀하게.**

---

## 9. Design Token

### Brand Token

```css
:root {
  --haechi-gold: #F0B237;
  --haechi-red: #EB4531;
  --haechi-blue: #2A6090;

  --haechi-ivory: #FDF5E9;
  --hanji-cream: #F2EBDD;

  --ink-black: #2A2826;
  --warm-black: #38322B;
}
```

### Semantic Token

```css
:root {
  --color-background: #F2EBDD;
  --color-surface: #FDF5E9;

  --color-text-primary: #2A2826;
  --color-text-secondary: #38322B;

  --color-primary: #2A6090;

  --color-accent-warm: #F0B237;
  --color-accent-red: #EB4531;
}
```

---

## 10. 최종 한 줄 원칙

> **한지색으로 공간을 만들고, 먹색으로 정보를 보여주며, 쪽빛 블루로 행동을 유도하고, 골드와 레드는 해치의 개성을 보여주는 데만 사용한다.**
