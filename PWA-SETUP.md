# 모바일 PWA 설정 안내

풋살 매니저 앱이 모바일 PWA로 설정되었습니다! 이제 스마트폰에서 네이티브 앱처럼 사용할 수 있습니다.

## 완료된 작업

### 1. PWA Manifest (`manifest.json`)
- 앱 이름, 설명, 아이콘 설정
- 전체화면(standalone) 모드
- 세로 방향(portrait) 고정
- 브랜드 컬러 (#00ff88) 적용

### 2. Service Worker (`sw.js`)
- 정적 리소스 자동 캐싱
- 오프라인 지원
- 캐시 우선 전략으로 빠른 로딩

### 3. 앱 아이콘 (`icon.svg`)
- 풋살 테마의 SVG 아이콘
- 축구공과 경기장 라인 디자인
- 네온 그린 브랜드 컬러

### 4. HTML 메타 태그
- PWA manifest 링크
- iOS Safari 최적화
- 테마 컬러 설정
- Service Worker 자동 등록

## 모바일에서 설치하기

### 안드로이드 (Chrome)
1. Chrome 브라우저로 앱 접속
2. 주소창 옆 메뉴(⋮) 클릭
3. **"홈 화면에 추가"** 선택
4. 설치 완료!

### iOS (Safari)
1. Safari 브라우저로 앱 접속  
2. 하단 공유 버튼 클릭
3. **"홈 화면에 추가"** 선택
4. 설치 완료!

## 주요 기능
- ✅ 오프라인에서도 사용 가능
- ✅ 홈 화면에서 바로 실행
- ✅ 전체화면 네이티브 앱 경험
- ✅ 빠른 로딩 속도 (캐싱)

## 테스트 방법

### 로컬 서버 실행
```powershell
# futsal-app 디렉토리에서
python -m http.server 8000
# 또는
npx serve
```

### 모바일 접속
1. PC와 스마트폰을 같은 Wi-Fi에 연결
2. PC의 IP 주소 확인 (예: 192.168.0.10)
3. 스마트폰 브라우저에서 `http://192.168.0.10:8000` 접속
4. 위 설치 방법 참고하여 홈 화면에 추가

## PNG 아이콘 생성 (선택사항)

현재 SVG 아이콘을 사용 중입니다. PNG가 필요한 경우:

**온라인 변환**
1. https://cloudconvert.com/svg-to-png 접속
2. `icon.svg` 업로드
3. 192x192 및 512x512로 각각 변환
4. `icon-192.png`, `icon-512.png`로 저장

**또는 로컬 변환 (ImageMagick 필요)**
```powershell
magick convert icon.svg -resize 192x192 icon-192.png
magick convert icon.svg -resize 512x512 icon-512.png
```
