import express from "express";
import path from "path";
import { Client, handle_file } from "@gradio/client";
import dotenv from "dotenv";
import fs from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set limits for base64 images
  app.use(express.json({ limit: '20mb' }));
  
  // Handle express json parsing errors globally so they return JSON instead of HTML
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof SyntaxError && 'status' in err && err.status === 400 && 'body' in err) {
      return res.status(400).json({ error: 'Request body is invalid JSON' });
    }
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ error: '上傳的圖片過大，請裁切或壓縮後再試 (限制為 20MB)' });
    }
    next();
  });

  // Helper to save base64 to temp file
  const saveTempImage = (dataUrl: string) => {
    if (!dataUrl || !dataUrl.startsWith('data:')) return dataUrl;
    
    try {
      const [header, base64] = dataUrl.split(',');
      const extension = header.match(/\/(.*?);/)?.[1] || 'png';
      const buffer = Buffer.from(base64, 'base64');
      const fileName = `tryon_${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
      const filePath = join(tmpdir(), fileName);
      fs.writeFileSync(filePath, buffer);
      return filePath;
    } catch (e) {
      console.error("Failed to save temp image:", e);
      throw new Error("圖片處理失敗，請重新上傳");
    }
  };

  // API route for AI Try-On
  app.post("/api/try-on", async (req, res) => {
    let tempFiles: string[] = [];
    try {
      const { personImage, garmentImage } = req.body;

      if (!personImage || !garmentImage) {
        return res.status(400).json({ error: "請先上傳人物照片與衣服照片" });
      }

      console.log("Saving temporary files...");
      const personPath = saveTempImage(personImage);
      const garmentPath = saveTempImage(garmentImage);
      tempFiles = [personPath, garmentPath];

      console.log("Connecting to Gradio Space (Kwai-Kolors/Kolors-Virtual-Try-On)...");
      const client = await Client.connect("Kwai-Kolors/Kolors-Virtual-Try-On");
      
      console.log("Calling prediction (fn_index: 2)...");
      // Positional arguments for index 2: [person_img, garment_img, seed, is_checked]
      const result = await client.predict(2, [
        handle_file(personPath),
        handle_file(garmentPath),
        Math.floor(Math.random() * 10000), // Random seed
        true,
      ]) as any;

      console.log("Prediction complete. Data structure:", JSON.stringify(result.data, (key, value) => 
        typeof value === 'string' && value.length > 100 ? value.substring(0, 100) + '...' : value
      , 2));

      const output = result.data?.[0];
      let resultImageUrl = "";

      if (typeof output === 'string') {
        resultImageUrl = output;
      } else if (output && typeof output === 'object') {
        // Preference: url > path > name
        resultImageUrl = output.url || output.path || output.name || "";
      }
      
      console.log("Raw result image URL/Path:", resultImageUrl);

      if (!resultImageUrl) {
        throw new Error("AI 無法生成結果，請換一張清晰的照片試試");
      }

      // If the URL is relative, resolve it to the full space URL
      if (!resultImageUrl.startsWith('http')) {
        const baseUrl = "https://kwai-kolors-kolors-virtual-try-on.hf.space";
        
        // If it already starts with /file=, just prepend the baseUrl
        if (resultImageUrl.startsWith('/file=')) {
          resultImageUrl = `${baseUrl}${resultImageUrl}`;
        } else if (resultImageUrl.startsWith('file=')) {
          resultImageUrl = `${baseUrl}/${resultImageUrl}`;
        } else {
          // Otherwise, it might be a raw path, so wrap it
          resultImageUrl = `${baseUrl}/file=${resultImageUrl.startsWith('/') ? '' : '/'}${resultImageUrl}`;
        }
      }

      console.log("Resolved result image URL:", resultImageUrl);

      console.log("Fetching result image for base64 conversion...");
      try {
        const imgResponse = await fetch(resultImageUrl);
        if (!imgResponse.ok) {
          console.error(`Failed to fetch image: ${imgResponse.status} ${imgResponse.statusText}`);
          throw new Error("無法從 AI 伺服器獲取結果圖片");
        }
        
        const arrayBuffer = await imgResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = imgResponse.headers.get('content-type') || 'image/png';
        const base64Image = `data:${mimeType};base64,${buffer.toString('base64')}`;
        
        res.json({ resultImage: base64Image });
      } catch (fetchError: any) {
        console.error("Error converting result to base64:", fetchError);
        // Fallback to original URL if fetch fails, but ensure it's a valid string
        res.json({ resultImage: resultImageUrl });
      }

    } catch (error: any) {
      console.error("Try-on detailed error:", error);
      
      let clientMessage = "系統繁忙中，請稍後再試";
      if (error.message?.includes('Too many users')) {
        clientMessage = "【伺服器繁忙】目前使用人數過多，請等待 10-20 秒後再次點擊「開始試穿」";
      } else if (error.message?.includes('queue')) {
        clientMessage = "正在排隊中，請不要關閉視窗";
      }

      res.status(500).json({ 
        error: clientMessage,
        originalError: error.message 
      });
    } finally {
      // Clean up temp files
      tempFiles.forEach(file => {
        if (fs.existsSync(file)) {
          try { fs.unlinkSync(file); } catch (e) {}
        }
      });
    }
  });

  // API route for Background Removal
  app.post("/api/remove-bg", async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ error: "請上傳圖片" });
      }

      console.log("Uploading file to Gradio server (briaai/BRIA-RMBG-1.4)...");
      const base64Data = image.includes(',') ? image.split(',')[1] : image;
      const mimeType = image.includes(';') ? image.split(';')[0].split(':')[1] : 'image/png';
      const buffer = Buffer.from(base64Data, 'base64');
      const blob = new Blob([buffer], { type: mimeType });
      const fd = new FormData();
      fd.append('files', blob, 'image.png');
      
      const uploadRes = await fetch("https://briaai-bria-rmbg-1-4.hf.space/upload", {
        method: "POST",
        body: fd
      });
      if (!uploadRes.ok) {
        throw new Error(`Upload failed: ${uploadRes.status}`);
      }
      const uploadData = await uploadRes.json();
      const uploadedPath = uploadData[0];

      console.log("Joining inference queue...");
      const session_hash = Math.random().toString(36).substring(2);
      const joinRes = await fetch("https://briaai-bria-rmbg-1-4.hf.space/queue/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fn_index: 0,
          session_hash,
          data: [{ path: uploadedPath }]
        })
      });
      if (!joinRes.ok) throw new Error(`Join queue failed: ${joinRes.status}`);
      
      console.log("Listening to queue data stream...");
      const dataRes = await fetch("https://briaai-bria-rmbg-1-4.hf.space/queue/data?session_hash=" + session_hash);
      const dataText = await dataRes.text();
      
      let resultPath;
      for (const line of dataText.split('\n')) {
        if (line.startsWith('data: ')) {
          try {
            const event = JSON.parse(line.substring(6));
            if (event.msg === 'process_completed') {
              if (event.success) {
                resultPath = event.output.data[0].path;
              } else {
                throw new Error("AI 模型生成去背失敗");
              }
            }
          } catch(e) {}
        }
      }

      if (!resultPath) {
        throw new Error("伺服器沒有回傳處理完成的圖片路徑");
      }

      const resultImageUrl = "https://briaai-bria-rmbg-1-4.hf.space/file=" + resultPath;

      console.log("Fetching bg removal result image for base64...");
      try {
        const imgResponse = await fetch(resultImageUrl);
        if (!imgResponse.ok) {
          throw new Error("無法從 AI 伺服器獲取結果圖片");
        }
        
        const arrayBuffer = await imgResponse.arrayBuffer();
        const outBuffer = Buffer.from(arrayBuffer);
        const outMimeType = imgResponse.headers.get('content-type') || 'image/png';
        const base64Image = `data:${outMimeType};base64,${outBuffer.toString('base64')}`;
        
        res.json({ resultImage: base64Image });
      } catch (fetchError) {
        console.error("Error converting bg removal result to base64:", fetchError);
        res.json({ resultImage: resultImageUrl });
      }

    } catch (error: any) {
      console.error("BG Removal detailed error:", error);
      res.status(500).json({ 
        error: "去背失敗，系統繁忙中",
        originalError: error.message 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
