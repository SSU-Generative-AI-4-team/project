# Research

TEAM4 프로젝트의 리서치 폴더. 시장·경쟁사 조사, 사용자 리서치, 기술·문헌 조사를 여기서 진행하고 산출물을 관리한다.

조사 종류는 달라도 **산출물 형태와 품질 기준은 같게** 만드는 것이 이 폴더의 목적이다.

## 폴더 구조

```
Research/
├── CLAUDE.md          # 공통 작업 규칙 (Claude가 자동으로 읽음)
├── .claude/
│   ├── skills/        # 리서치 종류별 실행 절차
│   └── agents/        # 자료 수집 서브에이전트
├── templates/         # 산출물 표준 포맷
├── notes/             # 진행 중인 조사 노트
├── sources/           # 출처 로그 (source-log.md)
└── outputs/           # 팀에 공유하는 확정 산출물
```

## 조사 시작하기

Claude Code에서 조사 내용을 말하면 해당 스킬이 자동으로 호출된다. 직접 지정하려면 슬래시 커맨드를 쓴다.

| 조사 종류 | 커맨드 | 이럴 때 |
|---|---|---|
| 시장·경쟁사 | `/Research:market` | 경쟁 서비스 비교, 벤치마킹, 가격·기능 조사 |
| 사용자 | `/Research:user-interview` | 인터뷰 설계, 녹취 정리, 페인포인트 도출, 설문 |
| 기술·문헌 | `/Research:literature` | 선행 연구, 기술 스펙, 표준 문서, 논문 요약 |

### 예시

```
경쟁사 3곳의 온보딩 흐름을 비교해줘
→ Research:market 자동 호출

인터뷰 스크립트 만들어줘. 주제는 결제 이탈이야
→ Research:user-interview 자동 호출
```

## 작업 흐름

1. **조사 질문을 정한다** — "무엇을 조사할까"가 아니라 "이 조사로 어떤 결정을 내릴까"
2. 스킬이 절차대로 수집·검증·정리를 진행한다
3. 결과가 `notes/`에 `templates/research-note.md` 포맷으로 저장된다
4. 출처가 `sources/source-log.md`에 누적된다
5. 팀에 공유할 단계가 되면 `outputs/`로 옮긴다

## 산출물 규칙 요약

전체 규칙은 [`CLAUDE.md`](./CLAUDE.md)에 있다. 핵심만:

- 모든 사실 주장에 **출처 URL + 접근 날짜**
- 중요한 수치는 **독립된 출처 2곳** 이상. 1곳이면 `[단일 출처]` 표시
- 확인 못 한 것은 **빈 채로 두고** `[미확인]` / `[조사 필요]` 표시 — 추측으로 채우지 않는다
- 파일명: `notes/YYYY-MM-DD-주제슬러그.md`, `outputs/주제슬러그.md`
- 인터뷰 대상자는 **익명 코드**(P1, P2…)로 기록. 실명·연락처를 문서에 남기지 않는다

## 템플릿

| 파일 | 용도 |
|---|---|
| [`templates/research-note.md`](./templates/research-note.md) | 모든 조사의 표준 노트 포맷 |
| [`templates/comparison-matrix.md`](./templates/comparison-matrix.md) | 경쟁사·옵션 비교표 |
| [`templates/interview-guide.md`](./templates/interview-guide.md) | 인터뷰 스크립트 + 기록 |

## 팀원에게 공유할 때

확정된 산출물만 `outputs/`에 둔다. `notes/`는 작업 중인 초안이므로 공유 대상이 아니다.

공유 전 확인:
- [ ] 미확인 항목이 표시돼 있는가
- [ ] 출처가 `sources/source-log.md`에 기록돼 있는가
- [ ] 개인정보가 익명화됐는가

## 하네스 수정

조사를 하다 보면 규칙이나 절차에 고칠 점이 생긴다. 그때마다 고친다.

- 모든 조사에 적용할 규칙 → `CLAUDE.md`
- 특정 조사 종류의 절차 → `.claude/skills/{종류}/SKILL.md`
- 산출물 형태 → `templates/`

스킬 파일을 수정하면 새 세션부터 반영된다.
