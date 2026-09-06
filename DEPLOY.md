# 배포 가이드 (무료 클라우드)

이 프로젝트는 아래 3개의 무료 서비스에 나눠서 배포합니다.

| 역할 | 서비스 | 이유 |
| --- | --- | --- |
| DB (MySQL) | [Aiven](https://aiven.io) | 신용카드 없이 가입 가능, MySQL 무료 플랜을 기간 제한 없이 제공 |
| 백엔드 (FastAPI) | [Render](https://render.com) | GitHub 연동만으로 무료 웹 서비스 배포 가능 |
| 프론트엔드 (React) | [Vercel](https://vercel.com) | 정적 사이트 무료 배포, GitHub 연동 자동 배포 |

Railway는 30일 체험 크레딧만 주고 이후 유료 전환되고, Fly.io는 2026년 기준 신규 가입자에게 무료 티어를 주지 않아서 제외했습니다.

---

## 0. 사전 준비: GitHub에 코드 올리기

1. github.com에서 새 저장소 생성 (이름 예: `boardgame-rental-system`, public/private 무관)
2. 로컬에서:
   ```bash
   git remote add origin <저장소 URL>
   git push -u origin main
   ```

---

## 1. Aiven에서 무료 MySQL 만들기

1. aiven.io 가입 (GitHub 계정으로 가입 가능)
2. **Create service** → **MySQL** → **Free** 플랜 선택 → 리전 선택 → 생성
3. 서비스 상태가 `Running`이 될 때까지 대기 (1~2분)
4. Overview 탭에서:
   - **Service URI** 복사 (형식: `mysql://user:password@host:port/defaultdb?ssl-mode=REQUIRED`)
   - **CA Certificate** 다운로드 (`ca.pem`)

### 접속 문자열 변환

SQLAlchemy + PyMySQL 형식으로 바꿔야 합니다:

```
mysql+pymysql://user:password@host:port/defaultdb?ssl_ca=<ca.pem 경로>
```

- 앞부분을 `mysql://` → `mysql+pymysql://` 로 변경
- `ssl_ca` 파라미터에 CA 인증서 파일 경로 지정 (백엔드 배포 시 이 파일을 어디에 두는지는 3단계 참고)

---

## 2. 로컬에서 운영 DB에 초기 데이터 넣기

배포 전에, 새 Aiven DB에 게임 목록과 관리자 계정을 먼저 넣어둡니다.

```bash
cd backend
source .venv/bin/activate
export DATABASE_URL="mysql+pymysql://user:password@host:port/defaultdb?ssl_ca=/절대경로/ca.pem"
python -m app.seed.import_excel "/Users/takjh2000/Downloads/보드게임 대여 시스템-2.xlsx"   # 재고 이관
python -m app.seed.create_admin admin admin1234! 관리자                                    # admin 계정 생성
```

> 스크립트 실행 후 `unset DATABASE_URL` 하거나 새 터미널을 열어 로컬 `.env` 설정으로 돌아가세요.

---

## 3. Render에 백엔드 배포

1. render.com 가입 (GitHub 계정으로 가입 가능), GitHub 저장소 접근 권한 부여
2. **New** → **Blueprint** → 방금 만든 저장소 선택 → 저장소 루트의 `render.yaml`을 자동 인식 → **Apply**
   - (Blueprint가 안 보이면 **New → Web Service**로 수동 생성: Root Directory `backend`, Build Command `pip install -r requirements.txt`, Start Command `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, Plan `Free`)
3. 서비스 생성 후 **Environment** 탭에서 환경변수 설정:
   - `DATABASE_URL` = 1단계에서 만든 접속 문자열 (단, `ssl_ca` 경로는 `/etc/secrets/aiven-ca.pem` 로)
   - `JWT_SECRET` = 새로운 랜덤 문자열 (터미널에서 `openssl rand -hex 32`로 생성)
   - `ALLOWED_ORIGINS` = 일단 `http://localhost:5173` (5단계에서 Vercel 주소 추가 예정)
4. 같은 **Environment** 탭의 **Secret Files**에서 파일 추가:
   - Path: `/etc/secrets/aiven-ca.pem`
   - Contents: 1단계에서 다운받은 `ca.pem` 내용 붙여넣기
5. 배포가 끝나면 `https://<서비스명>.onrender.com/health` 접속해서 `{"status":"ok"}` 확인

> 무료 플랜은 15분간 요청이 없으면 슬립 상태가 되고, 다음 요청 시 첫 응답이 30초~1분 정도 걸릴 수 있습니다. 동아리 소규모 사용에는 문제없는 수준입니다.

---

## 4. Vercel에 프론트엔드 배포

1. vercel.com 가입 (GitHub 계정으로 가입 가능)
2. **Add New → Project** → 같은 GitHub 저장소 선택
3. **Root Directory**를 `frontend`로 지정 (Framework Preset은 Vite 자동 감지)
4. **Environment Variables**에 추가:
   - `VITE_API_BASE_URL` = 3단계에서 확인한 Render 백엔드 URL (예: `https://boardgame-rental-backend.onrender.com`)
5. Deploy 클릭, 완료되면 `https://<프로젝트명>.vercel.app` 형태의 주소가 발급됨

---

## 5. 마무리: CORS 연결

1. Render 백엔드 대시보드로 돌아가서 `ALLOWED_ORIGINS` 값을 아래처럼 수정:
   ```
   http://localhost:5173,https://<프로젝트명>.vercel.app
   ```
2. 저장하면 자동 재배포됨 (또는 Manual Deploy)

---

## 6. 최종 확인

1. Vercel 주소로 접속해서 게임 목록이 뜨는지 확인 (비로그인 상태에서도 보여야 함)
2. 일반 회원 가입 → 대여 → 반납 테스트
3. `admin` / `admin1234!` 로 로그인 → 관리자 메뉴(게임/회원/대여 관리) 접근 확인
4. **로그인 후 반드시 admin 비밀번호를 새 비밀번호로 변경** (공개된 배포 환경이므로)
