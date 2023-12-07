// Firebase 불러오게 하는 API키
var firebaseConfig = {
    apiKey: "AIzaSyCWya5cdmV31Mh4hsiQbGxNBy9rEEcj1Ak",
    authDomain: "goal-3e7c0.firebaseapp.com",
    databaseURL: "https://goal-3e7c0-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "goal-3e7c0",
    storageBucket: "goal-3e7c0.appspot.com",
    messagingSenderId: "367138004790",
    appId: "1:367138004790:web:adfb2a07f686a849ac9d97",
    measurementId: "G-3BC8SBXDN2"
    };

    // Firebase 불러오기
    firebase.initializeApp(firebaseConfig);

    // Firebase Authentication 불러오기
    var auth = firebase.auth();

    // Firebase 데이터베이스 참조
    var database = firebase.database();

    // 로그인
    function login() {
        event.preventDefault()
        var signInEmail = document.getElementById("signInEmail").value;
        var signInPassword = document.getElementById("signInPassword").value;

        auth.signInWithEmailAndPassword(signInEmail, signInPassword)
            .then(function(userCredential) {
            var user = userCredential.user;
            showUserDashboard(user);
            displayGoals();
            })
            .catch(function(error) {
            alert("로그인 실패: " + error.message);
            });
    }

    // 회원가입
    function signup() {
        var signUpEmail = document.getElementById("signUpEmail").value;
        var signUpPassword = document.getElementById("signUpPassword").value;

        auth.createUserWithEmailAndPassword(signUpEmail, signUpPassword)
            .then(function(userCredential) {
            var user = userCredential.user;
            alert("회원가입 성공");
            })
            .catch(function(error) {
            alert("회원가입 실패: " + error.message);
            });
        }

    // 페이지 로드 시 현재 로그인 상태 확인
    window.onload = function() {
        auth.onAuthStateChanged(function(user) {
            if (user) {
                showUserDashboard(); // 이미 로그인되어 있으면 대시보드 표시
                askOpenAI();
                displayGoals();
            } else {
                hideUserDashboard(); // 로그인되어 있지 않으면 로그인 및 회원가입 폼 표시
            }
        });
    };

    function logout() {
    firebase.auth().signOut().then(function() {
        // 로그아웃 성공
        console.log("로그아웃 성공");
        hideUserDashboard(); // 사용자 대시보드 숨기기
    }).catch(function(error) {
        // 로그아웃 실패
        console.error("로그아웃 실패: ", error);
    });
}


    // 사용자 대시보드 표시
    function showUserDashboard(user) {
        document.getElementById("loginForm").style.display = "none";
        document.getElementById("signUpForm").style.display = "none";
        document.getElementById("logout").style.display = "flex";
        document.getElementById('wise_saying').style.display = "block";
        document.getElementById("goalInputBox").style.display = "block";
        document.getElementById("goal_list").style.display = "block";
        document.getElementById("todayTasks").style.display = "block";
        }

    // 사용자 대시보드 숨기기
    function hideUserDashboard() {
        document.getElementById("loginForm").style.display = "flex";
        document.getElementById("signUpForm").style.display = "flex";
        document.getElementById("logout").style.display = "none";
        document.getElementById('wise_saying').style.display = "none";
        document.getElementById("goalInputBox").style.display = "none";
        document.getElementById("goal_list").style.display = "none";
        document.getElementById("todayTasks").style.display = "none";
        }

        
        async function fetchQuote() {
            try {
                // 서버의 'get-quote' 엔드포인트로 요청을 보냅니다.
                const response = await fetch('http://localhost:3000/get-quote', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ question: "나에게 영감을 줄 수 있는 명언을 알려주세요." })
                });

                if (!response.ok) {
                    throw new Error('서버 응답 오류');
                }

                const data = await response.json();
                document.getElementById("quote").textContent = data.quote;
            } catch (error) {
                document.getElementById("quote").textContent = '명언을 불러오는 데 실패했습니다: ' + error.message;
            }
        }

        window.onload = fetchQuote;


let goals = [];
    
// 데이터 쓰기
function writeData() {
    event.preventDefault()
    var Goal = document.getElementById("Goal").value;
    var importance = document.getElementById("importanceInput").value;
    var emergency = document.getElementById("emergencyInput").value;
    var deadline = document.getElementById("deadlineInput").value;
    var user = firebase.auth().currentUser;
    
    if (importance < 1 || importance > 10 || emergency < 1 || emergency > 10) {
            alert('중요도와 긴급도는 1부터 10까지의 숫자만 입력 가능합니다.');
            return;
        }

    if (user) {
    var userId = user.uid;
    database.ref("user_data/" + userId).push({
        Goal: Goal,
        importance: importance,
        emergency: emergency,
        deadline: deadline
    });
    
    database.ref("user_data/" + userId).on("child_added", function(snapshot) {
        var goal = snapshot.val();
        displayGoals();
        });
    
    } else {
    alert("로그인한 사용자만 데이터를 저장할 수 있습니다.");
    }
}

// 데이터 읽기 및 표시
function displayGoals() {
    const todayList = document.getElementById("todayTaskList");
    const goalList = document.getElementById("goalList");
    todayList.innerHTML = '';
    goalList.innerHTML = '';
    var user = firebase.auth().currentUser;

    if (user) {
        var userId = user.uid;
        database.ref("user_data/" + userId).once("value", function(snapshot) {
            goals = []; // 목표 배열 초기화
            snapshot.forEach(function(childSnapshot) {
                var goalKey = childSnapshot.key; // 목표의 고유 식별자(키) 가져오기
                var goal = childSnapshot.val();
                goals.push({
                    key: goalKey,
                    goal: goal.Goal,
                    importance: goal.importance,
                    emergency: goal.emergency,
                    deadline: goal.deadline
                });
            });
            goals.sort((a, b) => (b.importance + b.emergency) - (a.importance + a.emergency));

            // 상위 5개의 목표를 '오늘 할 일'에 표시
            const todayTasks = goals.slice(0, 5);
            for (let goal of todayTasks) {
                todayList.innerHTML += `
                    <tr>
                        <td>${goal.goal}</td>
                        <td>${goal.importance}</td>
                        <td>${goal.emergency}</td>
                        <td>${goal.deadline}</td>
                        <td><button class="addbutton" onclick="deleteGoal('${goal.key}')">삭제</button></td>
                    </tr>`;
            }

            // 나머지 목표들을 '정렬된 목표 리스트'에 표시
            const remainingGoals = goals.slice(5);
            for (let goal of remainingGoals) {
                goalList.innerHTML += `
                    <tr>
                        <td>${goal.goal}</td>
                        <td>${goal.importance}</td>
                        <td>${goal.emergency}</td>
                        <td>${goal.deadline}</td>
                        <td><button class="addbutton" onclick="deleteGoal('${goal.key}')">삭제</button></td>
                    </tr>`;
            }
        });
    }
}

// 변수를 추가하여 중복 호출 방지
var isWritingData = false;

// 데이터 쓰기
function writeData() {
    event.preventDefault();

    if (isWritingData) {
        // 이미 데이터를 저장 중인 경우, 추가 저장을 방지
        alert('데이터를 저장 중입니다. 잠시 후 다시 시도하세요.');
        return;
    }

    isWritingData = true;

    var Goal = document.getElementById("Goal").value;
    var importance = document.getElementById("importanceInput").value;
    var emergency = document.getElementById("emergencyInput").value;
    var deadline = document.getElementById("deadlineInput").value;
    var user = firebase.auth().currentUser;

    if (importance < 1 || importance > 10 || emergency < 1 || emergency > 10) {
        alert('중요도와 긴급도는 1부터 10까지의 숫자만 입력 가능합니다.');
        isWritingData = false; // 데이터 저장 완료 후 변수 초기화
        return;
    }

    if (user) {
        var userId = user.uid;
        var newData = {
            Goal: Goal,
            importance: importance,
            emergency: emergency,
            deadline: deadline
        };

        checkDuplicateAndSave(userId, newData);
    } else {
        alert("로그인한 사용자만 데이터를 저장할 수 있습니다.");
        isWritingData = false; // 데이터 저장 완료 후 변수 초기화
    }
}

// 중복 체크 후 데이터 저장
function checkDuplicateAndSave(userId, newData) {
    // 중복 데이터 체크 로직을 구현
    // 중복 데이터가 없다면 데이터 저장
    database.ref("user_data/" + userId).push(newData)
        .then(function() {
            isWritingData = false; // 데이터 저장 완료 후 변수 초기화
            displayGoals();
        })
        .catch(function(error) {
            alert("데이터 저장 실패: " + error.message);
            isWritingData = false; // 데이터 저장 실패 시 변수 초기화
        });
}

// 목표 삭제 함수
function deleteGoal(goalKey) {
    var user = firebase.auth().currentUser;
    if (user) {
        var userId = user.uid;
        database.ref("user_data/" + userId + "/" + goalKey).remove()
        .then(function() {
            console.log("목표 삭제 성공");
            displayGoals(); // 목표 목록 새로고침
        })
        .catch(function(error) {
            console.error("목표 삭제 실패: ", error);
        });
    } else {
        alert("로그인한 사용자만 목표를 삭제할 수 있습니다.");
    }
}
