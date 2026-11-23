THIEF & DETECTIVE - 실행 및 인터넷 배포 안내

[로컬 실행]
1. Windows에 Node.js LTS 설치: https://nodejs.org/
2. 이 폴더를 VS Code로 엽니다.
3. 터미널 > 새 터미널에서 다음을 실행합니다.
   npm install
   npm start
4. 브라우저에서 http://localhost:3000 으로 접속합니다.

[싱글 플레이]
메인 화면 > 혼자 플레이 > 싱글 플레이.
싱글은 AI와 브라우저에서 바로 플레이할 수 있습니다.

[같은 Wi-Fi 친구와 플레이]
1. 호스트 PC에서 npm start 실행
2. 호스트 PC의 사설 IP 주소를 확인합니다(Windows 명령 프롬프트에서 ipconfig).
3. 친구는 http://호스트PC의IP:3000 으로 접속합니다.
4. Windows 방화벽에서 Node.js의 개인 네트워크 통신을 허용해야 할 수 있습니다.

[인터넷 공개 링크 만들기 - Render 무료 플랜]
이 프로젝트는 웹 화면과 WebSocket 멀티플레이 서버를 하나의 Node.js 서비스로 제공합니다.
따라서 Render에서 Static Site가 아니라 반드시 Web Service로 배포해야 합니다.

1. GitHub 계정으로 로그인하고 New repository를 만듭니다.
2. 저장소 이름을 thief-detective로 정하고 Public 또는 Private로 생성합니다.
3. 이 ZIP의 압축을 풀고 THIEF_DETECTIVE 폴더 안의 파일 6개를 저장소 최상위에 업로드합니다.
   index.html, style.css, app.js, server.js, package.json, README.txt
4. https://render.com 에서 GitHub 계정으로 가입/로그인하고 GitHub 저장소 접근을 허용합니다.
5. Render Dashboard > New > Web Service를 선택합니다.
6. thief-detective 저장소를 연결합니다.
7. 설정:
   Name: thief-detective (또는 사용 가능한 다른 이름)
   Language/Runtime: Node
   Build Command: npm install
   Start Command: npm start
   Instance Type: Free
8. Create Web Service를 누르고 배포가 끝날 때까지 기다립니다.
9. Render가 제공하는 https://서비스이름.onrender.com 주소를 엽니다.
10. 친구에게 같은 주소를 보내고, 한 명이 방을 만들면 다른 친구는 그 방 코드를 입력합니다.

[무료 플랜의 주의점]
- 무료 웹 서비스는 15분 동안 요청이 없으면 잠들 수 있습니다.
- 잠든 뒤 첫 접속은 다시 켜지는 데 약 1분 정도 걸릴 수 있습니다.
- 무료 서비스는 테스트/취미 프로젝트에 적합하며 항상 켜져 있는 서비스는 아닙니다.
- Render 무료 서비스의 파일 시스템은 영구 저장소가 아니므로 이 게임처럼 방/참가자 정보를 메모리에 두는 경우 서버가 재시작되면 방이 사라집니다.
- 인터넷 공개 멀티플레이는 HTTPS 페이지에서 WSS(WebSocket Secure)를 사용합니다. 게임은 현재 접속 주소에 맞춰 자동으로 WSS를 선택합니다.

[현재 버전의 범위]
- 싱글: 간단한 AI와 1:1 대결
- 온라인: 방 생성/참가, 방 코드, 역할 배정, 채팅, 은신 장소 선택, 추리, 결과 공유
- 현재는 3D 분위기의 그래픽을 적용한 라운드형 추리 게임 프로토타입이며, 자유 이동형 3D 캐릭터 게임은 아닙니다.
- 공개 서비스로 널리 운영하기 전에는 악성 이용자 대응, 입력 검증 강화, 개인정보 안내 및 부하 테스트가 필요합니다.
