// 最初からある35問の動画設定アドオン
// 既存のscript.jsは変更せず、index.htmlからこのファイルを読み込むだけで動作します。
(() => {
  const STORAGE_KEY = "wan_nyan_sample_video_urls_v1";
  let videoUrls = {};

  function readLocal() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function applyUrls() {
    if (typeof sampleQuestions === "undefined" || !sampleQuestions.length) return false;
    sampleQuestions.forEach((question, index) => {
      question.videoUrl = videoUrls[String(index)] || "";
    });
    return true;
  }

  function saveLocal() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(videoUrls));
      return true;
    } catch {
      alert("動画設定を保存できませんでした。");
      return false;
    }
  }

  function exportUrls() {
    const blob = new Blob([JSON.stringify(videoUrls, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sample-video-urls.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function renderEditor() {
    const editor = document.getElementById("editorScreen");
    if (!editor || document.getElementById("sampleVideoSettings")) return;

    const section = document.createElement("section");
    section.id = "sampleVideoSettings";
    section.innerHTML = `
      <div class="registered-heading"><h3>最初からある35問の動画設定</h3></div>
      <p class="editor-description">
        各問題の正解時に流す動画を設定できるよ。設定後に書き出したJSONをGitHubへアップロードすると、みんなにも反映されるよ。
      </p>
      <button type="button" class="main-btn" id="exportSampleVideoUrls">
        35問の動画設定を書き出す
      </button>
      <div id="sampleVideoList" class="custom-list"></div>
    `;
    editor.appendChild(section);
    document.getElementById("exportSampleVideoUrls").addEventListener("click", exportUrls);
    renderList();
  }

  function renderList() {
    const list = document.getElementById("sampleVideoList");
    if (!list || typeof sampleQuestions === "undefined" || !sampleQuestions.length) return;
    list.replaceChildren();

    sampleQuestions.forEach((question, index) => {
      const item = document.createElement("div");
      item.className = "custom-item";

      const title = document.createElement("div");
      title.textContent = (question.type === "dog" ? "🐶 " : "🐱 ") +
        `最初からある問題 ${index + 1}`;
      item.appendChild(title);

      const status = document.createElement("p");
      status.className = "editor-description";
      status.textContent = videoUrls[String(index)] ? "動画設定済み" : "動画未設定";
      item.appendChild(status);

      const button = document.createElement("button");
      button.type = "button";
      button.className = "delete-btn";
      button.textContent = "🎬 動画URLを設定・変更";
      button.addEventListener("click", () => {
        const entered = prompt(
          `最初からある問題 ${index + 1} の正解時に流す動画URLを入力してね！`,
          videoUrls[String(index)] || ""
        );
        if (entered === null) return;

        const previous = videoUrls[String(index)];
        const value = entered.trim();
        if (value) videoUrls[String(index)] = value;
        else delete videoUrls[String(index)];

        if (saveLocal()) {
          applyUrls();
          renderList();
        } else if (previous) {
          videoUrls[String(index)] = previous;
        } else {
          delete videoUrls[String(index)];
        }
      });
      item.appendChild(button);
      list.appendChild(item);
    });
  }

  async function initialize() {
    try {
      const response = await fetch("./sample-video-urls.json", { cache: "no-store" });
      if (response.ok) videoUrls = await response.json();
    } catch (error) {
      // 公開用ファイルがまだなくても空の設定で動作する
    }

    videoUrls = { ...videoUrls, ...readLocal() };

    // 元のscript.jsが35問を読み込むのを待ってから動画URLを反映
    const started = Date.now();
    const timer = setInterval(() => {
      if (applyUrls()) {
        clearInterval(timer);
        renderEditor();
      } else if (Date.now() - started > 15000) {
        clearInterval(timer);
        console.warn("35問の問題データが読み込まれませんでした。");
      }
    }, 100);

    const openEditor = document.getElementById("openEditor");
    if (openEditor) {
      openEditor.addEventListener("click", () => {
        setTimeout(() => {
          applyUrls();
          renderEditor();
          renderList();
        }, 0);
      });
    }
  }

  initialize();
})();
