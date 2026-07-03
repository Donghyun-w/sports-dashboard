# Sport Dashboard

NBA와 NFL의 라이브 스코어, 경기 결과, 경기 요약을 보여주는 대시보드입니다.

## 사용 API

- [BALLDONTLIE 메인 사이트](https://www.balldontlie.io/)
- [NBA API 문서](https://docs.balldontlie.io/)
- [NFL API 문서](https://nfl.balldontlie.io/)

## 실행 방법

1. `.env.example`을 복사해서 `.env.local`을 만듭니다.
2. `BALLDONTLIE_API_KEY`에 발급받은 키를 넣습니다.
3. 한 터미널에서 API 서버를 실행합니다.
4. 다른 터미널에서 웹 화면을 실행합니다.

### API 서버

`npm run dev:api`

### 웹 화면

`npm run dev`

## 참고

- 프런트엔드가 직접 외부 API 키를 들고 호출하지 않도록 로컬 API 서버를 두었습니다.
- API 연결에 실패하면 화면은 마지막 데이터 또는 데모 데이터를 유지합니다.
# my-website
