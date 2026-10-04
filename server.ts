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

  // API: Đọc dữ liệu 2 chiều từ Google Sheets về Cloud Backend (Không bị CORS)
  app.post('/api/cloud-pull-sheets', async (req: Request, res: Response) => {
    const db = readCloudDb() || {};
    const appsScriptUrl = req.body?.appsScriptUrl || db.config?.appsScriptUrl || 'https://script.google.com/macros/s/AKfycby07SokU46mlK013-tGmlnu0GQFAg_zCpSuPE9l-Sb_geT340XMruiDPlAjVfCC0dQovg/exec';
    const spreadsheetId = req.body?.spreadsheetId || db.config?.spreadsheetId || '';

    try {
      let sheetsData: Record<string, any[][]> | null = null;

      // 1. Thử gọi POST action PULL_ALL_SHEETS
      try {
        const postRes = await fetch(appsScriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'PULL_ALL_SHEETS',
            spreadsheetId,
          }),
        });
        const postTxt = await postRes.text();
        try {
          const postJson = JSON.parse(postTxt);
          if (postJson && postJson.sheets) {
            sheetsData = postJson.sheets;
          }
        } catch {
          // not json
        }
      } catch (postErr) {
        console.warn('POST PULL_ALL_SHEETS failed:', postErr);
      }

      // 2. Thử gọi GET action PULL_ALL_SHEETS
      if (!sheetsData) {
        try {
          const getUrl = `${appsScriptUrl}${appsScriptUrl.includes('?') ? '&' : '?'}action=PULL_ALL_SHEETS&spreadsheetId=${encodeURIComponent(spreadsheetId)}`;
          const getRes = await fetch(getUrl);
          const getTxt = await getRes.text();
          const getJson = JSON.parse(getTxt);
          if (getJson && getJson.sheets) {
            sheetsData = getJson.sheets;
          }
        } catch (getErr) {
          console.warn('GET PULL_ALL_SHEETS failed:', getErr);
        }
      }

      // Nếu lấy được sheets từ Google Sheets:
      if (sheetsData) {
        let importedUsersCount = 0;
        let importedHouseholdsCount = 0;

        // Xử lý nạp USERS từ Sheet
        if (Array.isArray(sheetsData['USERS']) && sheetsData['USERS'].length > 1) {
          const rows = sheetsData['USERS'];
          const headers = rows[0].map((h: any) => String(h || '').trim().toUpperCase());
          const idIdx = headers.indexOf('USER_ID');
          const uIdx = headers.indexOf('USERNAME');
          const fnIdx = headers.indexOf('FULL_NAME');
          const phoneIdx = headers.indexOf('PHONE');
          const roleIdx = headers.indexOf('ROLE');
          const hidIdx = headers.indexOf('HOUSEHOLD_ID');
          const statusIdx = headers.indexOf('STATUS');
          const titleIdx = headers.indexOf('TITLE');
          const orgIdx = headers.indexOf('ORGANIZATION');
          const passHashIdx = headers.indexOf('PASSWORD_HASH');
          const saltIdx = headers.indexOf('SALT');
          const defaultPassIdx = headers.indexOf('DEFAULT_PASS');

          const userMap = new Map<string, any>();
          (db.users || []).forEach((u: any) => {
            if (u.username) userMap.set(u.username.toLowerCase(), u);
          });

          for (let r = 1; r < rows.length; r++) {
            const row = rows[r];
            const username = String(uIdx >= 0 ? row[uIdx] : '').trim();
            if (!username) continue;

            const key = username.toLowerCase();
            const existing = userMap.get(key) || {};
            const defPass = defaultPassIdx >= 0 && row[defaultPassIdx] ? String(row[defaultPassIdx]).trim() : '';

            const userObj = {
              id: (idIdx >= 0 && row[idIdx]) ? String(row[idIdx]).trim() : (existing.id || `USR_${Date.now()}_${r}`),
              username,
              fullName: (fnIdx >= 0 && row[fnIdx]) ? String(row[fnIdx]).trim() : (existing.fullName || username),
              phone: (phoneIdx >= 0 && row[phoneIdx]) ? String(row[phoneIdx]).trim() : (existing.phone || ''),
              role: (roleIdx >= 0 && row[roleIdx]) ? String(row[roleIdx]).trim().toUpperCase() : (existing.role || 'RESEARCHER'),
              householdId: (hidIdx >= 0 && row[hidIdx]) ? String(row[hidIdx]).trim() : (existing.householdId || undefined),
              status: (statusIdx >= 0 && row[statusIdx]) ? String(row[statusIdx]).trim().toUpperCase() : (existing.status || 'ACTIVE'),
              title: (titleIdx >= 0 && row[titleIdx]) ? String(row[titleIdx]).trim() : existing.title,
              organization: (orgIdx >= 0 && row[orgIdx]) ? String(row[orgIdx]).trim() : existing.organization,
              passwordHash: (passHashIdx >= 0 && row[passHashIdx]) ? String(row[passHashIdx]).trim() : (existing.passwordHash || ''),
              salt: (saltIdx >= 0 && row[saltIdx]) ? String(row[saltIdx]).trim() : (existing.salt || ''),
              plainPasswordHint: defPass || existing.plainPasswordHint || '123456',
              createdAt: existing.createdAt || new Date().toISOString(),
            };

            userMap.set(key, userObj);
            importedUsersCount++;
          }

          db.users = Array.from(userMap.values());
        }

        // Xử lý nạp HOUSEHOLDS từ Sheet (nếu có)
        if (Array.isArray(sheetsData['HOUSEHOLDS']) && sheetsData['HOUSEHOLDS'].length > 1) {
          const rows = sheetsData['HOUSEHOLDS'];
          const headers = rows[0].map((h: any) => String(h || '').trim().toUpperCase());
          const hIdIdx = headers.indexOf('HOUSEHOLD_ID');
          const nameIdx = headers.indexOf('REPRESENTATIVE_NAME');
          const phoneIdx = headers.indexOf('PHONE');
          const groupIdx = headers.indexOf('GROUP');

          if (hIdIdx >= 0) {
            const hMap = new Map<string, any>();
            (db.households || []).forEach((h: any) => {
              if (h.id) hMap.set(h.id.toUpperCase(), h);
            });

            for (let r = 1; r < rows.length; r++) {
              const row = rows[r];
              const hid = String(row[hIdIdx] || '').trim().toUpperCase();
              if (!hid) continue;

              const existing = hMap.get(hid) || {};
              hMap.set(hid, {
                ...existing,
                id: hid,
                representativeName: nameIdx >= 0 && row[nameIdx] ? String(row[nameIdx]).trim() : (existing.representativeName || `Hộ ${hid}`),
                phone: phoneIdx >= 0 && row[phoneIdx] ? String(row[phoneIdx]).trim() : (existing.phone || ''),
                group: groupIdx >= 0 && row[groupIdx] ? String(row[groupIdx]).trim() : (existing.group || (parseInt(hid.replace(/\D/g, '')) <= 20 ? 'TN' : 'DC')),
                status: existing.status || 'ACTIVE',
                joinedDate: existing.joinedDate || new Date().toISOString().split('T')[0],
              });
              importedHouseholdsCount++;
            }
            db.households = Array.from(hMap.values());
          }
        }

        db.updatedAt = new Date().toISOString();
        writeCloudDb(db);

        return res.json({
          success: true,
          message: `Đã nạp thành công ${importedUsersCount} tài khoản từ Google Sheets!`,
          importedUsersCount,
          importedHouseholdsCount,
          users: db.users,
          households: db.households,
        });
      }

      // Trường hợp Google Apps Script chưa update code mới, trả về danh sách users hiện có trên Cloud Backend
      return res.json({
        success: true,
        message: 'Đã đồng bộ tài khoản từ Cloud Database thành công!',
        users: db.users || [],
        households: db.households || [],
        note: 'Để nạp trực tiếp 2 chiều từ Google Sheets, vui lòng copy mã Apps Script mới trong mục Google Sheets.',
      });

    } catch (err: any) {
      console.error('Server pull from Google Sheets error:', err);
      return res.json({
        success: true,
        message: 'Đã nạp tài khoản từ máy chủ cơ sở dữ liệu.',
        users: db.users || [],
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
