import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';

// URL Google Apps Script cố định của dự án
const DEFAULT_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycby07SokU46mlK013-tGmlnu0GQFAg_zCpSuPE9l-Sb_geT340XMruiDPlAjVfCC0dQovg/exec';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Kiểm tra trạng thái máy chủ
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'Hệ thống Quản lý Chăn nuôi Gà & Nghiên cứu Khoa học',
      backend: 'Google Sheets Direct Relay (Không lưu nền Cloud - Dữ liệu vĩnh viễn trên Sheets)',
      timestamp: new Date().toISOString(),
    });
  });

  // API Đồng bộ trực tiếp lên Google Sheets (Chuyển tiếp từ Backend tránh giới hạn CORS)
  app.post(['/api/sheets-sync', '/api/cloud-sync-sheets'], async (req: Request, res: Response) => {
    const { appsScriptUrl, spreadsheetId, sheets } = req.body;
    const targetUrl = appsScriptUrl || DEFAULT_APPS_SCRIPT_URL;

    if (!sheets || typeof sheets !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu các bảng tính (sheets) không hợp lệ',
      });
    }

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'SYNC_UPSERT_SHEETS', // Khắc sâu: Upsert thông minh, không xóa dòng cũ
          spreadsheetId: spreadsheetId || '',
          timestamp: new Date().toISOString(),
          sheets,
        }),
      });

      const responseText = await response.text();
      let parsed: any;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        parsed = { raw: responseText };
      }

      return res.json({
        success: true,
        message: 'Đã lưu vĩnh viễn dữ liệu lên Google Sheets thành công!',
        result: parsed,
      });
    } catch (err: any) {
      console.error('Lỗi kết nối tới Google Sheets:', err);
      return res.status(500).json({
        success: false,
        message: `Lỗi kết nối tới Google Sheets: ${err.message}`,
      });
    }
  });

  // API Kéo dữ liệu 2 chiều từ Google Sheets về App (Chuyển tiếp qua Backend)
  app.all(['/api/sheets-pull', '/api/cloud-pull-sheets'], async (req: Request, res: Response) => {
    const appsScriptUrl =
      req.body?.appsScriptUrl || req.query?.appsScriptUrl || DEFAULT_APPS_SCRIPT_URL;
    const spreadsheetId = req.body?.spreadsheetId || req.query?.spreadsheetId || '';

    try {
      let sheetsData: Record<string, any[][]> | null = null;
      let rawResult: any = null;

      // 1. Thử gửi POST với action PULL_ALL_SHEETS
      try {
        const postRes = await fetch(String(appsScriptUrl), {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'PULL_ALL_SHEETS',
            spreadsheetId: String(spreadsheetId || ''),
          }),
        });
        const postTxt = await postRes.text();
        try {
          const postJson = JSON.parse(postTxt);
          rawResult = postJson;
          if (postJson && postJson.sheets) {
            sheetsData = postJson.sheets;
          }
        } catch {
          // Chưa parse được JSON
        }
      } catch (postErr) {
        console.warn('Lỗi gọi POST PULL_ALL_SHEETS:', postErr);
      }

      // 2. Thử gọi GET với action PULL_ALL_SHEETS nếu POST chưa có dữ liệu
      if (!sheetsData) {
        try {
          const getUrl = `${appsScriptUrl}${appsScriptUrl.includes('?') ? '&' : '?'}action=PULL_ALL_SHEETS&spreadsheetId=${encodeURIComponent(String(spreadsheetId || ''))}`;
          const getRes = await fetch(getUrl);
          const getTxt = await getRes.text();
          const getJson = JSON.parse(getTxt);
          rawResult = getJson;
          if (getJson && getJson.sheets) {
            sheetsData = getJson.sheets;
          }
        } catch (getErr) {
          console.warn('Lỗi gọi GET PULL_ALL_SHEETS:', getErr);
        }
      }

      if (sheetsData) {
        return res.json({
          success: true,
          message: 'Đã kéo toàn bộ dữ liệu từ Google Sheets về hệ thống!',
          sheets: sheetsData,
          rawResult,
        });
      }

      return res.json({
        success: false,
        message: 'Google Apps Script chưa trả về cấu trúc sheets. Vui lòng kiểm tra mã Apps Script.',
        rawResult,
      });
    } catch (err: any) {
      console.error('Lỗi khi kéo dữ liệu từ Google Sheets:', err);
      return res.status(500).json({
        success: false,
        message: `Lỗi kết nối tới Google Sheets: ${err.message}`,
      });
    }
  });

  // Tương thích ngược: /api/cloud-data nhận dữ liệu và chuyển thẳng sang Google Sheets
  app.post('/api/cloud-data', async (req: Request, res: Response) => {
    const { appsScriptUrl, spreadsheetId, sheets } = req.body;
    if (sheets && appsScriptUrl) {
      try {
        fetch(appsScriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'SYNC_UPSERT_SHEETS',
            spreadsheetId: spreadsheetId || '',
            timestamp: new Date().toISOString(),
            sheets,
          }),
        }).catch(() => {});
      } catch {
        // bỏ qua
      }
    }
    return res.json({
      success: true,
      message: 'Dữ liệu được chuyển tiếp lên Google Sheets.',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/cloud-data', (_req: Request, res: Response) => {
    return res.json({
      exists: false,
      message: 'Hệ thống hoạt động thuần Google Sheets, không lưu trữ trên máy chủ phụ.',
    });
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Green Farm Google Sheets Relay] Running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
