import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'cloud_db.json');

// Đảm bảo thư mục lưu trữ dữ liệu đám mây tồn tại
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(
    DB_FILE,
    JSON.stringify(
      {
        config: {
          appName: 'Green Farm Research',
          researchTitle:
            'Tác động của ‘Cam kết xanh’ kết hợp ứng dụng quản lý chăn nuôi đến hành vi quản lý chất thải tại nguồn của các hộ chăn nuôi',
          totalHouseholds: 40,
          tnTarget: 20,
          dcTarget: 20,
          totalWeeks: 6,
          cwmMaxScore: 6,
          reminderDay: 'Chủ nhật',
          reminderTime: '19:00',
          startDate: '2026-09-01',
          endDate: '2026-11-15',
          spreadsheetId: '',
          appsScriptUrl:
            'https://script.google.com/macros/s/AKfycby07SokU46mlK013-tGmlnu0GQFAg_zCpSuPE9l-Sb_geT340XMruiDPlAjVfCC0dQovg/exec',
          allowSelfRegistration: false,
          autoLockAfterDays: 7,
        },
        users: [
          {
            id: 'USR_ADMIN_01',
            username: 'admin',
            fullName: 'Quản trị viên (Chủ nhiệm đề tài)',
            email: 'admin@research.vn',
            phone: '',
            role: 'ADMIN',
            status: 'ACTIVE',
            passwordHash: '5bbc79b65b8aa8c702bae4420c9d6c527929d31b0edace7df7af47af6cc6cf74',
            salt: 'SALT_ADMIN_999',
            createdAt: new Date().toISOString(),
          },
        ],
        households: [],
        bc01: [],
        bc02: [],
        bc03: [],
        bc04: [],
        bc05: [],
        bc06: [],
        bc07: [],
        auditLogs: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      null,
      2
    ),
    'utf-8'
  );
}

function readCloudDb(): any {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading cloud_db.json:', err);
  }
  return null;
}

function writeCloudDb(data: any): boolean {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing to cloud_db.json:', err);
    return false;
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Health Check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'Green Farm Research Cloud Backend',
      timestamp: new Date().toISOString(),
    });
  });

  // API: Lấy toàn bộ dữ liệu lưu trữ đám mây
  app.get('/api/cloud-data', (_req: Request, res: Response) => {
    const data = readCloudDb();
    if (!data) {
      return res.json({ exists: false, data: null });
    }
    return res.json({ exists: true, data });
  });

  // API: Lưu tự động toàn bộ dữ liệu vào Cloud
  app.post('/api/cloud-data', async (req: Request, res: Response) => {
    const payload = req.body;
    if (!payload) {
      return res.status(400).json({ success: false, message: 'Dữ liệu trống' });
    }

    const currentDb = readCloudDb() || {};
    const updatedDb = {
      ...currentDb,
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    const ok = writeCloudDb(updatedDb);
    if (!ok) {
      return res.status(500).json({ success: false, message: 'Lỗi ghi dữ liệu vào máy chủ đám mây' });
    }

    // Nếu có yêu cầu chuyển tiếp lên Google Sheets từ server (tránh CORS)
    if (payload.forwardToGoogleSheets && payload.appsScriptUrl && payload.sheets) {
      try {
        fetch(payload.appsScriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'SYNC_ALL_SHEETS',
            spreadsheetId: payload.spreadsheetId || '',
            timestamp: new Date().toISOString(),
            sheets: payload.sheets,
          }),
        }).catch((err) => {
          console.warn('Background Google Sheets push failed:', err.message);
        });
      } catch (sheetErr) {
        console.warn('Google Sheets forward error:', sheetErr);
      }
    }

    return res.json({
      success: true,
      message: 'Dữ liệu đã được lưu trữ tự động vào đám mây thành công!',
      timestamp: updatedDb.updatedAt,
    });
  });

  // API: Đồng bộ trực tiếp lên Google Apps Script từ phía máy chủ (Không bị hạn chế CORS trình duyệt)
  app.post('/api/cloud-sync-sheets', async (req: Request, res: Response) => {
    const { appsScriptUrl, spreadsheetId, sheets } = req.body;
    if (!appsScriptUrl || !sheets) {
      return res.status(400).json({ success: false, message: 'Thiếu Apps Script URL hoặc dữ liệu Sheets' });
    }

    try {
      const response = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'SYNC_ALL_SHEETS',
          spreadsheetId: spreadsheetId || '',
          timestamp: new Date().toISOString(),
          sheets,
        }),
      });

      const responseText = await response.text();
      let parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        parsed = { raw: responseText };
      }

      return res.json({
        success: true,
        message: 'Đã đẩy dữ liệu trực tiếp từ máy chủ lên Google Sheets thành công!',
        result: parsed,
      });
    } catch (err: any) {
      console.error('Server push to Google Sheets failed:', err);
      return res.status(500).json({
        success: false,
        message: `Lỗi kết nối từ máy chủ tới Google Sheets: ${err.message}`,
      });
    }
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
    console.log(`[Green Farm Cloud Server] Running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
