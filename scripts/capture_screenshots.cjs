const puppeteer = require('puppeteer-core');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://zgqmfccemfwaumvpcklz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_SBnliWNdfMOfjW7x7hqYIw_vDZzp1aG';
const BASE_URL = 'https://docly-ai-psi.vercel.app';
const OUT_DIR = path.resolve(__dirname, '..', 'screenshots');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function setupDemoData() {
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const email = 'docly_demo@docmind.ai';
  const password = 'PasswordDocly2026!';

  // 1. Authenticate or create demo user
  let { data: authData } = await sb.auth.signInWithPassword({ email, password });
  let user = authData?.user;
  let session = authData?.session;

  if (!user) {
    const res = await sb.auth.signUp({
      email,
      password,
      options: { data: { name: 'Sanjeev A' } }
    });
    user = res.data?.user;
    session = res.data?.session;
  }

  if (!user) {
    console.error('Failed to get demo user');
    return null;
  }

  // 2. Ensure user row exists in public.users
  await sb.from('users').upsert({
    id: user.id,
    email: user.email,
    name: 'Sanjeev A'
  });

  // 3. Check if demo workspace exists
  const { data: existingWs } = await sb.from('workspaces').select('*').eq('owner_id', user.id).limit(1);
  let wsId;
  if (!existingWs || existingWs.length === 0) {
    const { data: newWs, error: wsErr } = await sb.from('workspaces').insert({
      name: 'Acme Knowledge Base',
      slug: 'acme-kb-' + Math.floor(Math.random() * 10000),
      owner_id: user.id,
      tier: 'pro',
      color: '#2563eb',
      description: 'Corporate policies, engineering RFCs, and quarterly financial specs.'
    }).select().single();

    if (wsErr) {
      console.warn('Workspace create error:', wsErr.message);
    } else {
      wsId = newWs.id;
    }
  } else {
    wsId = existingWs[0].id;
  }

  if (wsId) {
    // Check if documents exist
    const { data: existingDocs } = await sb.from('documents').select('id').eq('workspace_id', wsId);
    if (!existingDocs || existingDocs.length === 0) {
      await sb.from('documents').insert([
        {
          workspace_id: wsId,
          filename: 'Q3_Financial_Audit_Report.pdf',
          file_size: 2450000,
          pages: 34,
          mime_type: 'application/pdf',
          storage_key: 'demo/audit.pdf',
          status: 'ready',
          uploaded_by: user.id,
          chunk_count: 58
        },
        {
          workspace_id: wsId,
          filename: 'Engineering_Architecture_RFC_v2.pdf',
          file_size: 1820000,
          pages: 22,
          mime_type: 'application/pdf',
          storage_key: 'demo/rfc.pdf',
          status: 'ready',
          uploaded_by: user.id,
          chunk_count: 42
        },
        {
          workspace_id: wsId,
          filename: 'Employee_Handbook_2026.docx',
          file_size: 940000,
          pages: 15,
          mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          storage_key: 'demo/handbook.docx',
          status: 'ready',
          uploaded_by: user.id,
          chunk_count: 28
        }
      ]);
    }

    // Check if chat sessions exist
    const { data: existingSessions } = await sb.from('chat_sessions').select('id').eq('workspace_id', wsId);
    if (!existingSessions || existingSessions.length === 0) {
      const { data: chatSession } = await sb.from('chat_sessions').insert({
        workspace_id: wsId,
        user_id: user.id,
        title: 'Q3 EBITDA & Retention Analysis'
      }).select().single();

      if (chatSession) {
        await sb.from('chat_messages').insert([
          {
            session_id: chatSession.id,
            role: 'user',
            content: 'What were the key drivers for Q3 EBITDA margin growth according to the financial report?'
          },
          {
            session_id: chatSession.id,
            role: 'assistant',
            content: 'According to the **Q3 Financial Audit Report** [Source 1, Page 14], key drivers for EBITDA margin expansion (up +4.2% YoY to 28.6%) included:\n\n1. **Cloud Infrastructure Optimization**: Migrating vector embedding pipelines to edge caching reduced operational inference costs by 31% [Source 1, Page 16].\n2. **Enterprise Expansion**: Net revenue retention reached 124%, driven by multi-seat workspace tier upgrades [Source 1, Page 18].\n3. **Automated Document Ingestion**: Overhead reduced by 18% following client-side OCR and hybrid BM25 preprocessing.\n\nAll metrics have been verified against audited ledger tables [Source 2, Page 22].',
            sources: [
              {
                id: 'chunk-1',
                document_id: wsId,
                filename: 'Q3_Financial_Audit_Report.pdf',
                pageNumber: 14,
                content: 'EBITDA margin reached 28.6% (+420 bps YoY), outperforming guidance due to cloud infrastructure and tier expansions.',
                score: 0.94
              },
              {
                id: 'chunk-2',
                document_id: wsId,
                filename: 'Q3_Financial_Audit_Report.pdf',
                pageNumber: 16,
                content: 'Operational cost optimization: inference and indexing pipelines yielded 31% reduced compute expenditure.',
                score: 0.89
              }
            ]
          }
        ]);
      }
    }
  }

  return session;
}

async function run() {
  console.log('Setting up demo data & acquiring session...');
  const session = await setupDemoData();

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // 1. Landing Page
  console.log('Capturing 01_landing_page.png...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
  await sleep(2500);
  await page.screenshot({ path: path.join(OUT_DIR, '01_landing_page.png') });

  // 2. Auth Page
  console.log('Capturing 02_auth_page.png...');
  await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle2' });
  await sleep(2000);
  await page.screenshot({ path: path.join(OUT_DIR, '02_auth_page.png') });

  // 3. Pricing Page
  console.log('Capturing 03_pricing_page.png...');
  await page.goto(`${BASE_URL}/pricing`, { waitUntil: 'networkidle2' });
  await sleep(2000);
  await page.screenshot({ path: path.join(OUT_DIR, '03_pricing_page.png') });

  if (session) {
    console.log('Injecting session into localStorage...');
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle2' });
    await page.evaluate((sess) => {
      const storageKey = 'sb-zgqmfccemfwaumvpcklz-auth-token';
      localStorage.setItem(storageKey, JSON.stringify(sess));
    }, session);

    // 4. Workspaces Dashboard
    console.log('Capturing 04_workspaces_dashboard.png...');
    await page.goto(`${BASE_URL}/app`, { waitUntil: 'networkidle2' });
    await sleep(3500);
    await page.screenshot({ path: path.join(OUT_DIR, '04_workspaces_dashboard.png') });

    // 5. Chat Studio
    console.log('Navigating to Chat Studio...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent && el.textContent.trim().toLowerCase() === 'chat');
      if (b) b.click();
    });
    await sleep(2500);

    // Click the chat session to display the conversation and citations
    console.log('Selecting active chat session...');
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('span'));
      const match = items.find(el => el.textContent && el.textContent.includes('Q3 EBITDA'));
      if (match) {
        const clickable = match.closest('div[style*="cursor"]') || match.parentElement || match;
        clickable.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      }
    });
    await sleep(3000);

    console.log('Capturing 05_chat_studio.png...');
    await page.screenshot({ path: path.join(OUT_DIR, '05_chat_studio.png') });

    // 6. Documents Studio
    console.log('Navigating to Documents Studio...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent && el.textContent.trim().toLowerCase() === 'documents');
      if (b) b.click();
    });
    await sleep(3000);
    console.log('Capturing 06_document_studio.png...');
    await page.screenshot({ path: path.join(OUT_DIR, '06_document_studio.png') });

    // 7. Workspace Settings
    console.log('Navigating to Workspace Settings...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent && el.textContent.trim().toLowerCase() === 'settings');
      if (b) b.click();
    });
    await sleep(3000);
    console.log('Capturing 07_workspace_settings.png...');
    await page.screenshot({ path: path.join(OUT_DIR, '07_workspace_settings.png') });
  }

  await browser.close();
  console.log('All 7 screenshots captured successfully!');
}

run().catch(err => {
  console.error('Screenshot script error:', err);
  process.exit(1);
});
