# frontend

`landing.html`은 해칫 랜딩페이지의 로컬 시안입니다. 영남일보체 M/B, 확정 로고와 해치 이미지를 프로젝트의 `../brand/`에서 불러옵니다.

- 결정 근거: `../decisions/landing-font-decision.md`
- 모바일과 데스크톱을 지원합니다.
- CTA는 페이지 안의 체험 창을 엽니다. 체험 원문은 전송/저장하지 않고 완료 또는 닫기 시 지웁니다.
- 먹 갈기, 필사첩, 실서비스 연결과 배포는 포함되지 않았습니다.
- 모집 상태와 인원은 확인되지 않아 표시하지 않습니다.

프로젝트 루트에서 정적 서버로 열거나 `landing.html`을 브라우저로 직접 열어 확인할 수 있습니다.

## cardnews.html

카드뉴스 10장(4:5) 편집 화면입니다. 글자는 카드 위에서 고치고, 이미지는 카드마다 바꿉니다. 고친 내용은 브라우저에 저장됩니다. PNG 저장은 프로젝트 루트에서 `python3 -m http.server`로 연 뒤 `localhost:8000/Design/frontend/cardnews.html`에서 합니다. 근거: `../decisions/cardnews-decision.md`, 대본: `../../기획/카드뉴스_김서영.md`

### cardnews_png/

확정 카드뉴스 10장(2026-10-15)을 1080×1350 PNG로 저장한 최종본입니다. 패들렛 업로드와 8주차 발표에 씁니다. 카드를 고치면 `cardnews.html`에서 다시 저장해 이 폴더를 바꿉니다. 계정명은 예시 `@hatch_eat`입니다.
