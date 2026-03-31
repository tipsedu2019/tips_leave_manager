<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Tips Leave Manager

사내 연차, 반차, 병가, 대체휴일을 관리하는 React + Vite + Firebase 앱입니다.

## 주요 기능

- Google 로그인
- 휴가 신청 및 승인/반려
- 입사일 기준 자동 연차 갱신
- 연차 이월 무기한 누적
- 오래된 이월 연차부터 우선 차감
- 전사 휴가 현황 공유
- 사유는 관리자/부관리자만 열람
- 부관리자에게 최고관리자와 동일한 운영 권한 부여
- 관리자 작업 이력 기록

## 로컬 실행

1. 의존성 설치
   `npm install`
2. 개발 서버 실행
   `npm run dev`
3. 브라우저에서 `http://localhost:3000` 접속

## Firebase 필수 설정

1. Firebase Authentication에서 Google 로그인을 활성화합니다.
2. Authorized domains에 아래 도메인을 추가합니다.
   `localhost`
   `127.0.0.1`
3. Firestore 규칙을 배포합니다.
   `npx firebase-tools login`
   `npx firebase-tools deploy --only firestore:rules`

## Vercel 배포 전 체크

1. GitHub에 이 프로젝트를 올립니다.
2. Vercel에서 저장소를 연결해 배포합니다.
3. 배포 후 생성된 도메인을 Firebase Authentication의 Authorized domains에 추가합니다.
   예: `your-project.vercel.app`
4. 커스텀 도메인을 쓰면 그 도메인도 Firebase Authorized domains에 추가합니다.

## 배포 후 꼭 확인할 것

- Google 로그인
- 휴가 신청 생성
- 관리자/부관리자 승인
- 일반 직원 계정에서 전사 휴가 현황 열람
- 일반 직원 계정에서 사유 비노출 확인
