## 语音分析模块前后端集成说明（内部文档）

本说明面向 **后端 NodeJS 团队** 和 **前端 React 团队**，帮助在现有项目中正确集成 `voice_analysis/` 下的 Python 模块。

> 注意：语音分析模块 **只负责算法与特征计算**，不包含任何 HTTP 路由、鉴权、数据库读写逻辑，这些都由你们现有的 NodeJS 后端负责。

---

### 一、模块定位与代码结构

- 目录：`voice_analysis/`
- 主入口函数：`analyze_voice`（已在 `__init__.py` 中导出）
- 核心文件：
  - `analyzer.py`：对外唯一入口，负责协调音频特征、文本特征与打分。
  - `audio_features.py`：静音段检测、能量与音高（pitch）计算。
  - `text_features.py`：基于 transcript 的填充词统计与语速计算。
  - `scoring.py`：根据特征计算 `1–5` 分制的信心、犹豫度和整体流利度。
  - `config.py`：阈值、权重、填充词表等可配置项。
  - `README.md`：英文使用说明。

所有模块返回的数据结构均为 **可 JSON 序列化** 的 `dict` / `list` / 基本类型。

---

### 二、Python 环境与依赖安装（后端部署注意事项）

在后端服务器或容器中，需要单独准备一个 Python 3.10+ 环境，用于运行语音分析：

```bash
cd /path/to/capstone-project-25t3-9900-f09c-almond
python -m venv .venv
source .venv/bin/activate   # Windows 使用 .venv\Scripts\activate
pip install -r requirements.txt
```

部署注意：

- 尽量在 **与 NodeJS 后端同一台机器 / 同一容器** 内完成分析，这样可以直接使用本地文件路径，避免频繁上传下载音频。
- 若使用 Docker，可在现有后端镜像中增加一层安装 Python 及 `requirements.txt`，或单独起一个 Python 服务容器，通过内部网络调用。

---

### 三、后端调用方式建议（NodeJS ↔ Python）

后端有两种常见集成方式：

#### 3.1 方式 A：NodeJS 通过子进程调用 Python 脚本（简单直接）

1. 在 `voice_analysis/` 新建一个轻量脚本（如果需要）例如 `cli_analyze.py`（由后端团队按需添加）：

   ```python
   # 示例：cli_analyze.py（示意，未在仓库中创建）
   import json
   import sys
   from voice_analysis import analyze_voice

   if __name__ == "__main__":
       audio_path = sys.argv[1]
       transcript = sys.argv[2] if len(sys.argv) > 2 else None
       result = analyze_voice(audio_path, transcript=transcript)
       print(json.dumps(result, ensure_ascii=False))
   ```

2. 在 NodeJS 后端中，通过 `child_process.spawn` 或 `execFile` 调用：

   ```js
   import { execFile } from 'child_process';
   import path from 'path';

   const PYTHON_BIN = process.env.PYTHON_BIN || 'python';
   const PROJECT_ROOT = process.cwd();
   const CLI_PATH = path.join(PROJECT_ROOT, 'voice_analysis', 'cli_analyze.py');

   function runVoiceAnalysis(audioPath, transcript) {
     return new Promise((resolve, reject) => {
       const args = [CLI_PATH, audioPath];
       if (transcript) args.push(transcript);

       execFile(PYTHON_BIN, args, { cwd: PROJECT_ROOT }, (err, stdout, stderr) => {
         if (err) {
           console.error('Voice analysis error:', err, stderr);
           return reject(err);
         }
         try {
           const json = JSON.parse(stdout);
           resolve(json);
         } catch (e) {
           console.error('Failed to parse analysis result:', e, stdout);
           reject(e);
         }
       });
     });
   }
   ```

3. 在你的业务路由中（例如面试结束后生成反馈时），调用该函数并把结果写入 MongoDB 或附加到 GPT 的上下文中。

优点：
- 实现简单，不需要额外的网络服务。
缺点：
- 每次调用都要启动 Python 进程，对高并发场景不太友好（可以通过持久化 Python 服务优化）。

#### 3.2 方式 B：单独起一个 Python HTTP 服务（推荐给高并发/复杂场景）

> 该方式需要后端同学额外实现一个轻量 Flask/FastAPI 服务，本仓库不包含此部分代码。

思路简述：

1. Python 侧实现一个简单接口，例如：
   - `POST /analyze-voice`，参数：
     - `audio_path` 或上传的音频文件
     - `transcript`（可选）
2. NodeJS 后端在合适的地方发起 HTTP 请求，把音频路径或临时文件位置传过去，等待返回 JSON。
3. 将返回 JSON 写入数据库或返回给前端。

这种方式适合后期扩展成独立服务，并可以水平扩展多个 Python 实例。

---

### 四、接口数据结构约定（给前后端共同参考）

`analyze_voice` 返回结构示例（简化版）：

```json
{
  "audio": {
    "sample_rate": 16000,
    "duration_seconds": 12.34
  },
  "pauses": {
    "total_pause_count": 5,
    "total_pause_duration": 3.1,
    "average_pause_duration": 0.62,
    "long_pause_count": 2,
    "long_pause_threshold": 1.0,
    "segments": [
      { "start": 1.2, "end": 1.9, "duration": 0.7 }
    ]
  },
  "fillers": {
    "total_filler_count": 4,
    "fillers_per_minute": 12.5,
    "fillers_per_100_words": 8.0,
    "per_filler_counts": {
      "um": 2,
      "uh": 1,
      "ah": 1
    }
  },
  "prosody": {
    "rms_mean": 0.03,
    "rms_std": 0.01,
    "pitch_mean_hz": 180.0,
    "pitch_std_hz": 25.0
  },
  "speech_rate": {
    "total_word_count": 120,
    "words_per_second": 2.0,
    "words_per_minute": 120.0,
    "effective_speech_duration": 60.0
  },
  "scores": {
    "confidence_score": 4.2,
    "hesitation_score": 3.6,
    "overall_fluency_score": 3.9
  }
}
```

建议：

- **后端存储层面**：可将 `scores` 字段直接作为面试反馈的一部分写入数据库；
  - 例如在 `interview_feedback` 文档中增加 `voice_analysis` 字段。
- **前端展示层面**：
  - 重点使用 `scores.overall_fluency_score`、`confidence_score`、`hesitation_score` 进行可视化（雷达图、进度条、评分卡等）。
  - `pauses.total_pause_count`、`fillers.total_filler_count`、`speech_rate.words_per_minute` 可用于详细说明（例如：一句提示卡片）。

---

### 五、前后端协作建议

#### 5.1 前端（React）需要注意的点

- 前端在提交面试答案给后端时，尽量携带：
  - 用户最终文本答案（已有）
  - 音频文件（若已有音频上传逻辑，可扩展复用）
  - 让后端在「生成反馈」阶段调用语音分析模块。
- 如果需要在反馈页展示语音分析结果：
  - 后端返回结构中增加 `voice_analysis` 字段（沿用上面的 JSON 结构）。
  - 前端在 `FeedbackPage` 中读取并渲染：
    - 总体评分（大号数字、星级）
    - 填充词数量 + 简短提示（「建议减少 'um', 'uh' 等填充词」）
    - 语速（提示偏快/偏慢）
    - 暂停次数/总时长（提示多停顿会影响流畅度）

#### 5.2 后端（NodeJS）需要注意的点

- 确保在服务器上有 **稳定的 Python 运行环境**，且安装了 `requirements.txt` 中的依赖。
- 对音频路径的约定：
  - 建议统一使用绝对路径，避免工作目录不一致导致找不到文件。
  - 若使用 S3 等云存储，应先由后端下载到本地临时路径，再交给 Python 模块分析。
- 异常处理：
  - `analyze_voice` 内部尽量避免抛出异常；但仍建议后端在调用 Python 时做好超时与异常捕获。
  - 出现错误时，可以返回一个降级结果（例如仅基于文本分析或跳过语音反馈）。

---

### 六、开发与调试建议

1. 本地单独调试语音分析：
   ```bash
   cd capstone-project-25t3-9900-f09c-almond
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt

   python
   >>> from voice_analysis import analyze_voice
   >>> res = analyze_voice("examples/demo.wav", "This is a sample transcript.")
   >>> res["scores"]
   ```

2. 使用 `pytest` 跑单元测试：
   ```bash
   pytest voice_analysis/tests
   ```

3. 与前端联调时：
   - 可以在后端加一个临时调试路由（只在开发环境开启），返回语音分析的完整 JSON，方便前端查看字段和调试 UI。

---

### 七、后续扩展方向（可选）

- 利用 `word_timestamps` 做更精细的停顿定位（按句子/段落统计）。
- 将 `pause`、`filler` 与答案内容结合，生成更智能的自然语言反馈（交给 GPT 层处理）。
- 增加多语言支持（当前模块对文本只做简单 tokenization，如果未来需要支持中文/其他语言，需要调整分词及填充词列表）。


