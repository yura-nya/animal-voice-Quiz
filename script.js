
// ==============================
// わんにゃんトーククイズ
// ==============================

// 最初から入っているサンプル問題
let sampleQuestions = [];

const STORAGE_KEY = "wan_nyan_custom_questions_v1";

let customQuestions = loadCustomQuestions();
let currentQuestions = [];
let currentIndex = 0;
let correctCount = 0;
let currentMode = "all";
let answered = false;
let selectedPhoto = null;

// ==============================
// 画面切り替え
// ==============================

const screens = document.querySelectorAll(".screen");

function showScreen(id) {
  screens.forEach(screen => {
    screen.classList.remove("active");
  });

  document.getElementById(id).classList.add("active");
  window.scrollTo(0, 0);
}

// ==============================
// 保存データ
// ==============================

function loadCustomQuestions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (error) {
    return [];
  }
}

function saveCustomQuestions() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(customQuestions)
    );
    return true;
  } catch (error) {
    alert(
      "保存できませんでした。写真の容量が大きすぎる可能性があります。別の写真で試してください。"
    );
    return false;
  }
}

function updateCounts() {
  document.getElementById("questionCount").textContent =
    sampleQuestions.length + customQuestions.length;

  document.getElementById("customCount").textContent =
    customQuestions.length + "問";
}

// ==============================
// クイズ問題を作る
// ==============================

function shuffle(array) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function startQuiz(mode) {
  currentMode = mode;

  const allQuestions = [
    ...sampleQuestions,
    ...customQuestions
  ];

  let filteredQuestions = allQuestions;

  if (mode === "dog" || mode === "cat") {
    filteredQuestions = allQuestions.filter(
      question => question.type === mode
    );
  }

  if (filteredQuestions.length === 0) {
    alert("この種類の問題はまだ登録されていないよ！");
    return;
  }

  // 4種類以上の正解セリフがあるか確認
  const uniqueAnswers = [
    ...new Set(allQuestions.map(question => question.correct))
  ];

  if (uniqueAnswers.length < 4) {
    alert(
      "クイズを始めるには、異なる正解セリフを4種類以上登録してね！"
    );
    return;
  }

  // 10問になるまで問題を繰り返して補充
  currentQuestions = [];

  while (currentQuestions.length < 10) {
    currentQuestions.push(...shuffle(filteredQuestions));
  }

  currentQuestions = currentQuestions.slice(0, 10);

  currentIndex = 0;
  correctCount = 0;

  showScreen("quizScreen");
  showQuestion();
}

// ==============================
// 問題を表示
// ==============================

function showQuestion() {
  answered = false;

  const question = currentQuestions[currentIndex];

  document.getElementById("progress").textContent =
    `第${currentIndex + 1}問 / 10問`;

  document.getElementById("score").textContent =
    `⭐ ${correctCount}点`;

  document.getElementById("progressBar").style.width =
    `${(currentIndex + 1) * 10}%`;

  const photo = document.getElementById("animalPhoto");
  photo.src = question.photo;

  document.getElementById("animalTag").textContent =
    question.type === "dog" ? "🐶 DOG" : "🐱 CAT";

  document.getElementById("feedback").textContent = "";
  document.getElementById("nextButton").classList.add("hidden");

  // すべての問題から正解セリフを集める
  const allAnswers = [
    ...sampleQuestions,
    ...customQuestions
  ]
    .map(item => item.correct)
    .filter(text => text !== question.correct);

  // 重複するセリフを除外
  const uniqueAnswers = [...new Set(allAnswers)];

  // 正解以外からランダムに3つ選ぶ
  const wrongChoices = shuffle(uniqueAnswers).slice(0, 3);

  // 4つの選択肢を作る
  const choices = [
    {
      text: question.correct,
      correct: true
    },
    ...wrongChoices.map(text => ({
      text,
      correct: false
    }))
  ];

  const shuffledChoices = shuffle(choices);
  const container = document.getElementById("choices");

  container.innerHTML = "";

  shuffledChoices.forEach(choice => {
    const button = document.createElement("button");

    button.className = "choice-btn";
    button.textContent = choice.text;

    button.addEventListener("click", () => {
      answerQuestion(button, choice.correct);
    });

    container.appendChild(button);
  });
}

// ==============================
// 正解動画の埋め込み再生
// ==============================

function playAnswerVideo(url) {
  const area = document.getElementById("answerVideo");
  const player = document.getElementById("answerVideoPlayer");

  player.replaceChildren();
  area.classList.add("hidden");

  if (!url) return;

  let videoId;

  // YouTube
  const youtube = url.match(
    /(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );

  if (youtube) {
    videoId = youtube[1];

    const iframe = document.createElement("iframe");
    iframe.src =
      "https://www.youtube.com/embed/" + videoId + "?autoplay=1&playsinline=1";
    iframe.allow = "autoplay; encrypted-media; picture-in-picture";
    iframe.allowFullscreen = true;
    iframe.style.width = "100%";
    iframe.style.aspectRatio = "16 / 9";
    iframe.style.border = "0";

    player.appendChild(iframe);
    area.classList.remove("hidden");
    return;
  }

  // TikTok
  const tiktok = url.match(/\/video\/(\d+)/);

  if (tiktok && /tiktok\.com/i.test(url)) {
    const iframe = document.createElement("iframe");
    iframe.src =
      "https://www.tiktok.com/player/v1/" + tiktok[1] + "?autoplay=1";
    iframe.allow = "autoplay; fullscreen";
    iframe.allowFullscreen = true;
    iframe.style.width = "100%";
    iframe.style.height = "600px";
    iframe.style.border = "0";

    player.appendChild(iframe);
    area.classList.remove("hidden");
    return;
  }

  // X（旧Twitter）
  const twitter = url.match(
    /(?:twitter\.com|x\.com)\/[^/]+\/status\/(\d+)/
  );

  if (twitter) {
    const blockquote = document.createElement("blockquote");
    blockquote.className = "twitter-tweet";

    const link = document.createElement("a");
    link.href = "https://x.com/i/status/" + twitter[1];

    blockquote.appendChild(link);
    player.appendChild(blockquote);

    area.classList.remove("hidden");

    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    script.charset = "utf-8";

    document.body.appendChild(script);
    return;
  }

  area.classList.remove("hidden");
  player.textContent =
    "このURLは対応していないか、動画を埋め込めない形式だよ。";
}

// ==============================
// 回答判定
// ==============================

function answerQuestion(button, isCorrect) {
  if (answered) return;

  answered = true;

  const buttons = document.querySelectorAll(".choice-btn");

  buttons.forEach(item => {
    item.disabled = true;
  });

  const feedback = document.getElementById("feedback");

  if (isCorrect) {
    correctCount++;

    button.classList.add("correct");
    feedback.textContent = "🎉 正解！！かわいいね！";
// 正解した問題の動画を再生
playAnswerVideo(
  currentQuestions[currentIndex].videoUrl
);
  } else {
    button.classList.add("wrong");

    buttons.forEach(item => {
      const question = currentQuestions[currentIndex];

      if (item.textContent === question.correct) {
        item.classList.add("correct");
      }
    });

    feedback.textContent =
      "🤣 残念！正解は「" +
      currentQuestions[currentIndex].correct +
      "」でした！";
  }

  document.getElementById("score").textContent =
    `⭐ ${correctCount}点`;

  document.getElementById("nextButton").classList.remove("hidden");
}

// ==============================
// 次の問題・結果
// ==============================

function nextQuestion() {
  currentIndex++;

  if (currentIndex >= 10) {
    showResult();
  } else {
    showQuestion();
  }
}

function showResult() {
  showScreen("resultScreen");

  document.getElementById("finalScore").textContent =
    `${correctCount} / 10`;

  let message = "";
  let icon = "";

  if (correctCount === 10) {
    icon = "👑";
    message = "おめでとう！動物が大好きなフレンズなんだね！";
  } else if (correctCount >= 8) {
    icon = "🏆";
    message = "ハッピーハッピーハッピー！";
  } else if (correctCount >= 5) {
    icon = "🐾";
    message = "あと少し！猫の手も借りたいね！";
  } else {
    icon = "🤣";
    message = "君の負け！なんで負けたか明日までに考えといてください！";
  }

  document.getElementById("resultIcon").textContent = icon;
  document.getElementById("resultMessage").textContent = message;
}

// ==============================
// 写真を縮小して保存容量を節約
// ==============================

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const maxSize = 900;
        let width = image.width;
        let height = image.height;

        if (width > height && width > maxSize) {
          height = height * maxSize / width;
          width = maxSize;
        } else if (height > maxSize) {
          width = width * maxSize / height;
          height = maxSize;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, width, height);

        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };

      image.onerror = reject;
      image.src = reader.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ==============================
// 問題追加・写真読み込み
// ==============================

const photoInput = document.getElementById("photoInput");
const previewPhoto = document.getElementById("previewPhoto");
const uploadText = document.getElementById("uploadText");

photoInput.addEventListener("change", async event => {
  const file = event.target.files[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("画像ファイルを選んでね！");
    return;
  }

  try {
    selectedPhoto = await compressImage(file);

    previewPhoto.src = selectedPhoto;
    previewPhoto.classList.remove("hidden");
    uploadText.classList.add("hidden");
  } catch (error) {
    alert("写真を読み込めませんでした。別の画像を試してね！");
  }
});

// ==============================
// 問題を保存
// ==============================

document.getElementById("questionForm").addEventListener(
  "submit",
  event => {
    event.preventDefault();

    if (!selectedPhoto) {
      alert("まず写真を選んでね！");
      return;
    }

    const correct = document
      .getElementById("correctAnswer")
      .value.trim();

    if (!correct) {
      alert("正解のセリフを入力してね！");
      return;
    }

    // 正解セリフの重複チェック
    if (
      customQuestions.some(question =>
        question.correct === correct
      )
    ) {
      alert("同じ正解セリフがすでに登録されているよ！");
      return;
    }

    const newQuestion = {
      type: document.getElementById("animalType").value,
      photo: selectedPhoto,
      correct
    };

    customQuestions.push(newQuestion);

    if (!saveCustomQuestions()) {
      customQuestions.pop();
      return;
    }

    alert("🎉 オリジナル問題を保存したよ！");

    document.getElementById("questionForm").reset();

    selectedPhoto = null;
    previewPhoto.src = "";
    previewPhoto.classList.add("hidden");
    uploadText.classList.remove("hidden");

    renderCustomList();
    updateCounts();
  }
);


// ==============================
// 登録済み問題の一覧・画像変更・セリフ編集・削除
// ==============================

function renderCustomList() {
  const list = document.getElementById("customList");
  list.innerHTML = "";

  if (customQuestions.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "まだオリジナル問題はないよ！";
    empty.className = "editor-description";
    list.appendChild(empty);
    return;
  }

  customQuestions.forEach((question, index) => {
    const item = document.createElement("div");
    item.className = "custom-item";

    // 問題の画像
    const image = document.createElement("img");
    image.src = question.photo;
    image.alt = "問題の写真";
    image.style.width = "100px";
    image.style.height = "100px";
    image.style.objectFit = "cover";
    image.style.borderRadius = "12px";
    image.style.display = "block";
    image.style.marginBottom = "10px";

    // 問題のタイトル
    const title = document.createElement("div");
    title.textContent =
      (question.type === "dog" ? "🐶 " : "🐱 ") +
      question.correct;

    // ==============================
    // 画像変更ボタン
    // ==============================

    const changeButton = document.createElement("button");
    changeButton.className = "delete-btn";
    changeButton.textContent = "📷 画像を変更";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.style.display = "none";

    changeButton.addEventListener("click", () => {
      fileInput.click();
    });

    fileInput.addEventListener("change", async () => {
      const file = fileInput.files[0];

      if (!file) return;

      if (!file.type.startsWith("image/")) {
        alert("画像ファイルを選んでね！");
        return;
      }

      try {
        changeButton.disabled = true;
        changeButton.textContent = "画像を変更中...";

        const newPhoto = await compressImage(file);
        const oldPhoto = question.photo;

        question.photo = newPhoto;

        if (saveCustomQuestions()) {
          alert("🎉 画像を変更したよ！");
          renderCustomList();
        } else {
          question.photo = oldPhoto;
          changeButton.disabled = false;
          changeButton.textContent = "📷 画像を変更";
        }

      } catch (error) {
        alert("写真を読み込めませんでした。");
        changeButton.disabled = false;
        changeButton.textContent = "📷 画像を変更";
      }

      fileInput.value = "";
    });

    // ==============================
    // セリフ編集ボタン
    // ==============================

    const editButton = document.createElement("button");
    editButton.className = "delete-btn";
    editButton.textContent = "✏️ セリフを編集";

    editButton.addEventListener("click", () => {
      const newAnswer = prompt(
        "新しい正解のセリフを入力してね！",
        question.correct
      );

      // キャンセルされた場合
      if (newAnswer === null) return;

      const trimmedAnswer = newAnswer.trim();

      if (!trimmedAnswer) {
        alert("セリフを入力してね！");
        return;
      }

      if (trimmedAnswer.length > 60) {
        alert("セリフは60文字以内にしてね！");
        return;
      }

      // 他の問題と同じセリフにならないか確認
      const duplicate = customQuestions.some(
        (otherQuestion, otherIndex) =>
          otherIndex !== index &&
          otherQuestion.correct === trimmedAnswer
      );

      if (duplicate) {
        alert("そのセリフは別の問題ですでに使われているよ！");
        return;
      }

      const oldAnswer = question.correct;

      // セリフを変更
      question.correct = trimmedAnswer;

      if (saveCustomQuestions()) {
        alert("🎉 セリフを変更したよ！");
        renderCustomList();
      } else {
        // 保存失敗なら元に戻す
        question.correct = oldAnswer;
      }
    });

    // ==============================
    // 削除ボタン
    // ==============================

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-btn";
    deleteButton.textContent = "この問題を削除";

    deleteButton.addEventListener("click", () => {
      if (!confirm("この問題を削除してもいい？")) return;

      const removedQuestion = customQuestions.splice(index, 1)[0];

      if (saveCustomQuestions()) {
        renderCustomList();
        updateCounts();
      } else {
        customQuestions.splice(index, 0, removedQuestion);
        renderCustomList();
      }
    });

    // 一覧に追加
    item.appendChild(image);
    item.appendChild(title);
    item.appendChild(changeButton);
    item.appendChild(fileInput);
    item.appendChild(editButton);
    item.appendChild(deleteButton);

    list.appendChild(item);
  });
}

// ==============================
// ボタンのイベント
// ==============================

document.querySelectorAll(".mode-btn").forEach(button => {
  button.addEventListener("click", () => {
    startQuiz(button.dataset.mode);
  });
});

document.getElementById("nextButton").addEventListener(
  "click",
  nextQuestion
);

document.getElementById("quitQuiz").addEventListener(
  "click",
  () => {
    if (confirm("クイズを終了して戻る？")) {
      showScreen("homeScreen");
    }
  }
);

document.getElementById("retryButton").addEventListener(
  "click",
  () => startQuiz(currentMode)
);

document.getElementById("homeButton").addEventListener(
  "click",
  () => showScreen("homeScreen")
);

document.getElementById("openEditor").addEventListener(
  "click",
  () => {
    renderCustomList();
    showScreen("editorScreen");
  }
);

document.getElementById("closeEditor").addEventListener(
  "click",
  () => showScreen("homeScreen")
);

// ==============================
// 起動時の処理
// ==============================

// ==============================
// 35問の問題データを読み込む
// ==============================

fetch("./questions-backup-compressed_(1).json")
  .then(response => {
    if (!response.ok) {
      throw new Error("問題データを読み込めませんでした");
    }
    return response.json();
  })
  .then(data => {
    sampleQuestions = data;
    updateCounts();
    console.log("問題データ読み込み完了！", data.length + "問");
  })
  .catch(error => {
    console.error(error);
    alert("問題データを読み込めなかったよ！");
  });

// ==============================
// 35問データ救出用
// ==============================

window.exportWanNyanQuestions = function () {
  const data = localStorage.getItem(
    "wan_nyan_custom_questions_v1"
  );

  if (!data) {
    alert("保存データが見つからないよ！");
    return;
  }

  const questions = JSON.parse(data);

  const output = document.createElement("textarea");
  output.value = data;

  Object.assign(output.style, {
    position: "fixed",
    inset: "10px",
    width: "95%",
    height: "80%",
    zIndex: "999999",
    background: "white",
    color: "black",
    fontSize: "12px"
  });

  document.body.appendChild(output);
  output.focus();
  output.select();

  alert(
    questions.length +
    "問のデータを表示したよ！"
  );
};

