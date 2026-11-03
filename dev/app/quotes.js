// Public-domain excerpts. Korean paraphrases written for this prototype, pending team editorial review.
// Sources are recorded per card and in Research/sources/source-log.md.
export const BOOKS = Object.freeze([
  { id: 'random', name: '해치에게 맡기기', detail: '여섯 권 중에서 골라요' },
  { id: 'analects', name: '논어', detail: '배움과 함께하는 마음' },
  { id: 'mencius', name: '맹자', detail: '나를 돌아보는 시간' },
  { id: 'mingxin', name: '명심보감', detail: '일상에 두는 작은 기준' },
  { id: 'xiaoxue', name: '소학', detail: '말과 행동을 가다듬기' },
  { id: 'caigentan', name: '채근담', detail: '조금 떨어져 바라보기' },
  { id: 'tao', name: '도덕경', detail: '서두르지 않는 걸음' }
]);
const source = name => `https://zh.wikisource.org/wiki/${name}`;
export const QUOTES = Object.freeze([
  { id:'an-1', book:'analects', chapter:'학이 1', original:'學而時習之，不亦說乎。', reading:'학이시습지, 불역열호.', meaning:'배운 것을 때때로 익히는 데에도 기쁨이 있어요.', source:source('論語/學而第一') },
  { id:'an-2', book:'analects', chapter:'학이 1', original:'有朋自遠方來，不亦樂乎。', reading:'유붕자원방래, 불역락호.', meaning:'먼 곳에서 벗이 찾아오는 일은 반가운 즐거움이에요.', source:source('論語/學而第一') },
  { id:'me-1', book:'mencius', chapter:'진심 상 4', original:'反身而誠，樂莫大焉。', reading:'반신이성, 낙막대언.', meaning:'자신을 돌아보아 스스로에게 참될 때, 그보다 큰 기쁨은 없다고 해요.', source:source('孟子/盡心上#4') },
  { id:'me-2', book:'mencius', chapter:'진심 상 17', original:'無為其所不為，無欲其所不欲。', reading:'무위기소불위, 무욕기소불욕.', meaning:'해서는 안 될 일을 하지 않고, 바라서는 안 될 것을 바라지 않는 데서 시작해요.', source:source('孟子/盡心上#17') },
  { id:'mi-1', book:'mingxin', chapter:'안분편', original:'知足者貧賤亦樂。', reading:'지족자빈천역락.', meaning:'충분함을 아는 사람은 넉넉하지 않은 형편에서도 즐거움을 찾는다고 해요.', source:source('明心寶鑑') },
  { id:'mi-2', book:'mingxin', chapter:'안분편', original:'滿招損，謙受益。', reading:'만초손, 겸수익.', meaning:'자만하면 잃기 쉽고, 겸손하면 배워 얻는 것이 있어요.', source:source('明心寶鑑') },
  { id:'xi-1', book:'xiaoxue', chapter:'경신 2 · 예기 인용', original:'毋不敬，儼若思，安定辭。', reading:'무불경, 엄약사, 안정사.', meaning:'공경하는 마음으로, 생각하듯 차분한 모습과 안정된 말을 지녀요.', source:source('小學#敬身2') },
  { id:'xi-2', book:'xiaoxue', chapter:'경신 4 · 논어 인용', original:'己所不欲，勿施於人。', reading:'기소불욕, 물시어인.', meaning:'내가 원하지 않는 일을 다른 사람에게도 하지 않아요.', source:source('小學#敬身4') },
  { id:'ca-1', book:'caigentan', chapter:'후집 69', original:'寵辱不驚，閑看庭前花開花落。', reading:'총욕불경, 한간정전화개화락.', meaning:'칭찬과 모욕에 휩쓸리지 않고, 뜰 앞의 꽃이 피고 지는 것을 바라봐요.', source:source('菜根譚') },
  { id:'ca-2', book:'caigentan', chapter:'후집 65', original:'心地上無風濤，隨在皆青山綠樹。', reading:'심지상무풍도, 수재개청산녹수.', meaning:'마음에 거센 물결이 없으면, 어디서든 푸른 산과 나무를 만나는 것 같아요.', source:source('菜根譚') },
  { id:'ta-1', book:'tao', chapter:'33장', original:'知足者富。', reading:'지족자부.', meaning:'지금 가진 것의 충분함을 아는 사람이 부유하다고 해요.', source:source('道德經_(王弼本)#三十三章') },
  { id:'ta-2', book:'tao', chapter:'64장', original:'千里之行，始於足下。', reading:'천리지행, 시어족하.', meaning:'천 리를 가는 길도 발아래 한 걸음에서 시작해요.', source:source('道德經_(王弼本)#六十四章') }
]);
export const quoteById = id => QUOTES.find(quote => quote.id === id);
export const bookName = id => BOOKS.find(book => book.id === id)?.name ?? BOOKS[0].name;
