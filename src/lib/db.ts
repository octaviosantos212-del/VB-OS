import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { hashSync } from 'bcryptjs';

const DB_PATH = path.join(process.cwd(), 'data', 'vbos.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    const fs = require('fs');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    initializeDb(_db);
  }
  return _db;
}

function initializeDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','producer','editor','videomaker','freelancer','client')),
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      segment TEXT,
      contact_name TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      decision_maker TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      event_type TEXT NOT NULL,
      complexity TEXT NOT NULL CHECK(complexity IN ('S','M','L')),
      default_days INTEGER DEFAULT 1,
      checklist_pre_event TEXT DEFAULT '[]',
      checklist_event TEXT DEFAULT '[]',
      checklist_post_event TEXT DEFAULT '[]',
      default_deliverables TEXT DEFAULT '[]',
      default_tasks TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      client_id TEXT REFERENCES clients(id),
      template_id TEXT REFERENCES templates(id),
      status TEXT NOT NULL DEFAULT 'pre_sale' CHECK(status IN ('pre_sale','pre_event','event','post_event','delivery','closed')),
      risk TEXT DEFAULT 'low' CHECK(risk IN ('low','medium','high')),
      risk_reasons TEXT,
      complexity TEXT DEFAULT 'S' CHECK(complexity IN ('S','M','L')),
      package_type TEXT DEFAULT 'ONE_SHOT' CHECK(package_type IN ('ONE_SHOT','PROGRAM')),
      city TEXT,
      venue TEXT,
      start_date TEXT,
      end_date TEXT,
      event_days INTEGER DEFAULT 1,
      delivery_deadline TEXT,
      revenue REAL DEFAULT 0,
      variable_cost REAL DEFAULT 0,
      margin_percent REAL DEFAULT 0,
      ticket_minimum REAL DEFAULT 0,
      strategic_score INTEGER DEFAULT 0,
      is_exception INTEGER DEFAULT 0,
      exception_approved INTEGER DEFAULT 0,
      has_integra INTEGER DEFAULT 0,
      has_sameday INTEGER DEFAULT 0,
      ppm_completed INTEGER DEFAULT 0,
      ppm_data TEXT DEFAULT '{}',
      contacts TEXT DEFAULT '[]',
      notes TEXT,
      created_by TEXT REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS deliverables (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','in_progress','review','approved','delivered')),
      link TEXT,
      deadline TEXT,
      assigned_to TEXT REFERENCES users(id),
      sla_days INTEGER DEFAULT 10,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      deliverable_id TEXT REFERENCES deliverables(id) ON DELETE SET NULL,
      phase TEXT NOT NULL CHECK(phase IN ('pre_sale','pre_event','event','post_event','delivery','closing')),
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'todo' CHECK(status IN ('todo','in_progress','done','blocked')),
      assigned_to TEXT REFERENCES users(id),
      deadline TEXT,
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('low','medium','high','urgent')),
      is_checklist_item INTEGER DEFAULT 0,
      checklist_required INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
      project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK(type IN ('deadline','capacity','risk','upload_pending','ppm_pending','margin','exception')),
      message TEXT NOT NULL,
      severity TEXT DEFAULT 'warning' CHECK(severity IN ('info','warning','critical')),
      resolved INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Seed data if empty
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number };
  if (userCount.c === 0) {
    seedData(db);
  }
}

function seedData(db: Database.Database) {
  const adminId = uuid();
  const producerId = uuid();
  const editorId = uuid();
  const videomakerId = uuid();
  const freelancerId = uuid();

  const insertUser = db.prepare('INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)');
  insertUser.run(adminId, 'Octavio Santos', 'octavio@vb.com', hashSync('admin123', 10), 'admin');
  insertUser.run(producerId, 'Ana Oliveira', 'ana@vb.com', hashSync('producer123', 10), 'producer');
  insertUser.run(editorId, 'Lucas Silva', 'lucas@vb.com', hashSync('editor123', 10), 'editor');
  insertUser.run(videomakerId, 'Pedro Costa', 'pedro@vb.com', hashSync('videomaker123', 10), 'videomaker');
  insertUser.run(freelancerId, 'Maria Freelancer', 'maria@vb.com', hashSync('freelancer123', 10), 'freelancer');

  // Clients
  const client1Id = uuid();
  const client2Id = uuid();
  const client3Id = uuid();
  const insertClient = db.prepare('INSERT INTO clients (id, name, segment, contact_name, contact_email, contact_phone, decision_maker) VALUES (?, ?, ?, ?, ?, ?, ?)');
  insertClient.run(client1Id, 'TechCorp Brasil', 'Tecnologia', 'Carlos Mendes', 'carlos@techcorp.com', '11999887766', 'Carlos Mendes');
  insertClient.run(client2Id, 'Banco Nacional', 'Financeiro', 'Fernanda Lima', 'fernanda@banconacional.com', '11988776655', 'Roberto Dias');
  insertClient.run(client3Id, 'Pharma Health', 'Saúde', 'Juliana Rocha', 'juliana@pharmahealth.com', '11977665544', 'Dr. André Souza');

  // Templates
  const tmpl1Id = uuid();
  const tmpl2Id = uuid();
  const tmpl3Id = uuid();
  const insertTemplate = db.prepare(`INSERT INTO templates (id, name, description, event_type, complexity, default_days,
    checklist_pre_event, checklist_event, checklist_post_event, default_deliverables, default_tasks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  insertTemplate.run(tmpl1Id, 'Evento 1 Dia - Simples', 'Cobertura simples de 1 dia: palco único, até 4h de captação', 'conference', 'S', 1,
    JSON.stringify(['Confirmar local e horários', 'Definir equipe (1 videomaker + 1 auxiliar)', 'Preparar equipamento (2 câmeras + áudio)', 'Alinhar shotlist com cliente', 'Confirmar logística (transporte + alimentação)', 'Testar equipamentos']),
    JSON.stringify(['Check-in no local', 'Montar equipamento', 'Testar áudio e iluminação', 'Captar conforme shotlist', 'Backup parcial no intervalo', 'Captar depoimentos dirigidos', 'Desmontagem e conferência de cartões']),
    JSON.stringify(['Ingest e backup dos cartões', 'Organizar projeto de edição', 'Selecionar melhores takes', 'Editar brandmovie', 'Revisão interna', 'Ajustes pós-revisão', 'Exportar versões finais', 'Upload para pasta de entrega', 'Enviar link ao cliente']),
    JSON.stringify([
      { type: 'brandmovie', title: 'Brandmovie Final', sla_days: 10 },
      { type: 'testimonials', title: 'Depoimentos Dirigidos (3 unidades)', sla_days: 10 },
      { type: 'raw', title: 'Brutos', sla_days: 5 },
      { type: 'delivery_folder', title: 'Pasta de Entrega (Google Drive)', sla_days: 10 }
    ]),
    JSON.stringify([
      { phase: 'pre_event', title: 'PPM com cliente', priority: 'high', checklist_required: 1 },
      { phase: 'pre_event', title: 'Preparar equipamento', priority: 'high' },
      { phase: 'pre_event', title: 'Definir shotlist', priority: 'medium' },
      { phase: 'event', title: 'Captação principal', priority: 'high' },
      { phase: 'event', title: 'Captação de depoimentos', priority: 'high' },
      { phase: 'post_event', title: 'Ingest e backup', priority: 'urgent' },
      { phase: 'post_event', title: 'Edição brandmovie', priority: 'high' },
      { phase: 'post_event', title: 'Edição depoimentos', priority: 'medium' },
      { phase: 'delivery', title: 'Revisão interna', priority: 'high' },
      { phase: 'delivery', title: 'Upload e entrega', priority: 'high' }
    ])
  );

  insertTemplate.run(tmpl2Id, 'Evento 2 Dias - Padrão', 'Cobertura padrão de 2 dias: múltiplos palcos, depoimentos, sameday edit', 'convention', 'M', 2,
    JSON.stringify(['Confirmar local, horários e agenda dos 2 dias', 'Definir equipe (2 videomakers + 1 editor sameday + 1 auxiliar)', 'Preparar equipamento (3+ câmeras + áudio wireless)', 'Alinhar shotlist detalhado por dia', 'Confirmar logística (hotel + transporte + alimentação)', 'Reunião de alinhamento com equipe', 'Testar equipamentos e baterias', 'Preparar kit de backup (HDs/SSDs extras)']),
    JSON.stringify(['Check-in no local dia 1', 'Montar equipamento em todos os pontos', 'Testar áudio, iluminação e transmissão', 'Captar conforme shotlist dia 1', 'Backup ao final do dia 1', 'Editar sameday reel dia 1', 'Captar dia 2', 'Captar depoimentos dirigidos', 'Desmontagem final', 'Conferência completa de cartões e backups']),
    JSON.stringify(['Ingest completo e backup redundante', 'Organizar projeto de edição por dia', 'Selecionar melhores takes de cada dia', 'Editar brandmovie principal', 'Editar depoimentos', 'Revisão interna rodada 1', 'Ajustes', 'Revisão interna rodada 2', 'Exportar todas as versões', 'Upload para pasta de entrega', 'Enviar links ao cliente', 'Debrief interno']),
    JSON.stringify([
      { type: 'brandmovie', title: 'Brandmovie Final', sla_days: 10 },
      { type: 'testimonials', title: 'Depoimentos Dirigidos (5 unidades)', sla_days: 10 },
      { type: 'sameday', title: 'Reels Sameday (2 unidades)', sla_days: 1 },
      { type: 'raw', title: 'Brutos', sla_days: 5 },
      { type: 'delivery_folder', title: 'Pasta de Entrega (Google Drive)', sla_days: 10 }
    ]),
    JSON.stringify([
      { phase: 'pre_event', title: 'PPM com cliente', priority: 'high', checklist_required: 1 },
      { phase: 'pre_event', title: 'Reunião de equipe', priority: 'high' },
      { phase: 'pre_event', title: 'Preparar equipamento completo', priority: 'high' },
      { phase: 'pre_event', title: 'Definir shotlist por dia', priority: 'medium' },
      { phase: 'pre_event', title: 'Organizar logística (hotel/transporte)', priority: 'medium' },
      { phase: 'event', title: 'Captação dia 1', priority: 'high' },
      { phase: 'event', title: 'Sameday edit dia 1', priority: 'urgent' },
      { phase: 'event', title: 'Captação dia 2', priority: 'high' },
      { phase: 'event', title: 'Captação de depoimentos', priority: 'high' },
      { phase: 'post_event', title: 'Ingest e backup completo', priority: 'urgent' },
      { phase: 'post_event', title: 'Edição brandmovie', priority: 'high' },
      { phase: 'post_event', title: 'Edição depoimentos', priority: 'medium' },
      { phase: 'delivery', title: 'Revisão interna', priority: 'high' },
      { phase: 'delivery', title: 'Upload e entrega', priority: 'high' },
      { phase: 'closing', title: 'Debrief interno', priority: 'medium' }
    ])
  );

  insertTemplate.run(tmpl3Id, 'Evento 3+ Dias - Grande', 'Cobertura completa de evento grande: 3+ dias, múltiplos palcos, íntegra, equipe ampla', 'congress', 'L', 3,
    JSON.stringify(['Confirmar local, horários e agenda completa de todos os dias', 'Definir equipe completa (3+ videomakers + 2 auxiliares + 1 editor sameday)', 'Preparar equipamento extenso (5+ câmeras + áudio multichannel + iluminação)', 'Alinhar shotlist detalhado por dia e por palco', 'Visita técnica ao local', 'Confirmar logística completa (hotel + transporte + alimentação todos os dias)', 'Reunião geral de alinhamento com equipe completa', 'Definir sistema de comunicação (radios/walkie-talkie)', 'Testar todos equipamentos e redundâncias', 'Preparar kits de backup abundantes', 'Confirmar pontos de energia e internet']),
    JSON.stringify(['Check-in e montagem completa', 'Teste geral de todos os sistemas', 'Captação dia 1 - todos os palcos', 'Backup ao final de cada dia', 'Sameday edit diário', 'Captação dia 2 - todos os palcos', 'Captação dia 3 - todos os palcos', 'Captação de depoimentos (múltiplas sessões)', 'Captação de íntegra (se contratada)', 'Desmontagem final completa', 'Conferência exaustiva de todo material']),
    JSON.stringify(['Ingest completo e backup triplo', 'Catalogar todo material por dia/palco', 'Organizar projetos de edição separados', 'Editar brandmovie principal', 'Editar depoimentos (8+ unidades)', 'Editar reels sameday', 'Editar íntegra (se contratada)', 'Revisão interna rodada 1', 'Ajustes rodada 1', 'Revisão interna rodada 2', 'Ajustes finais', 'Exportar todas as versões e formatos', 'Upload completo para pasta de entrega', 'Conferir todos os links', 'Enviar ao cliente', 'Debrief interno detalhado', 'Documentar aprendizados']),
    JSON.stringify([
      { type: 'brandmovie', title: 'Brandmovie Final', sla_days: 15 },
      { type: 'testimonials', title: 'Depoimentos Dirigidos (8 unidades)', sla_days: 15 },
      { type: 'sameday', title: 'Reels Sameday (3 unidades por dia)', sla_days: 1 },
      { type: 'integra', title: 'Íntegra Completa', sla_days: 20 },
      { type: 'raw', title: 'Brutos Organizados', sla_days: 7 },
      { type: 'delivery_folder', title: 'Pasta de Entrega (Google Drive + Frame.io)', sla_days: 15 }
    ]),
    JSON.stringify([
      { phase: 'pre_event', title: 'PPM com cliente', priority: 'high', checklist_required: 1 },
      { phase: 'pre_event', title: 'Visita técnica ao local', priority: 'high' },
      { phase: 'pre_event', title: 'Reunião geral de equipe', priority: 'high' },
      { phase: 'pre_event', title: 'Preparar equipamento completo', priority: 'high' },
      { phase: 'pre_event', title: 'Definir shotlist por dia/palco', priority: 'high' },
      { phase: 'pre_event', title: 'Organizar logística completa', priority: 'medium' },
      { phase: 'event', title: 'Captação dia 1', priority: 'high' },
      { phase: 'event', title: 'Captação dia 2', priority: 'high' },
      { phase: 'event', title: 'Captação dia 3', priority: 'high' },
      { phase: 'event', title: 'Sameday edits diários', priority: 'urgent' },
      { phase: 'event', title: 'Captação de depoimentos', priority: 'high' },
      { phase: 'event', title: 'Captação de íntegra', priority: 'medium' },
      { phase: 'post_event', title: 'Ingest e backup completo', priority: 'urgent' },
      { phase: 'post_event', title: 'Edição brandmovie', priority: 'high' },
      { phase: 'post_event', title: 'Edição depoimentos', priority: 'high' },
      { phase: 'post_event', title: 'Edição íntegra', priority: 'medium' },
      { phase: 'delivery', title: 'Revisão interna', priority: 'high' },
      { phase: 'delivery', title: 'Upload e entrega completa', priority: 'high' },
      { phase: 'closing', title: 'Debrief interno detalhado', priority: 'medium' },
      { phase: 'closing', title: 'Documentar aprendizados', priority: 'low' }
    ])
  );

  // Sample projects
  const proj1Id = uuid();
  const proj2Id = uuid();
  const proj3Id = uuid();
  const insertProject = db.prepare(`INSERT INTO projects (id, name, client_id, template_id, status, risk, complexity, package_type,
    city, venue, start_date, end_date, event_days, delivery_deadline, revenue, variable_cost, margin_percent,
    has_integra, has_sameday, ppm_completed, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  insertProject.run(proj1Id, 'TechSummit 2026', client1Id, tmpl2Id, 'pre_event', 'low', 'M', 'ONE_SHOT',
    'São Paulo', 'Expo Center Norte', '2026-04-15', '2026-04-16', 2, '2026-04-30',
    25000, 12000, 52, 0, 1, 1, adminId);

  insertProject.run(proj2Id, 'Banco Nacional - Convenção Anual', client2Id, tmpl3Id, 'post_event', 'medium', 'L', 'ONE_SHOT',
    'Rio de Janeiro', 'Windsor Barra', '2026-03-10', '2026-03-12', 3, '2026-03-28',
    45000, 22000, 51, 1, 1, 1, adminId);

  insertProject.run(proj3Id, 'Pharma Health - Lançamento Produto', client3Id, tmpl1Id, 'pre_sale', 'low', 'S', 'ONE_SHOT',
    'São Paulo', 'Hotel Unique', '2026-05-20', '2026-05-20', 1, '2026-06-03',
    15000, 6000, 60, 0, 0, 0, adminId);

  // Deliverables for proj2 (post_event)
  const insertDeliverable = db.prepare(`INSERT INTO deliverables (id, project_id, type, title, status, deadline, assigned_to, sla_days) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  insertDeliverable.run(uuid(), proj2Id, 'brandmovie', 'Brandmovie Final', 'in_progress', '2026-03-28', editorId, 15);
  insertDeliverable.run(uuid(), proj2Id, 'testimonials', 'Depoimentos Dirigidos (8 unidades)', 'in_progress', '2026-03-28', editorId, 15);
  insertDeliverable.run(uuid(), proj2Id, 'sameday', 'Reels Sameday', 'delivered', '2026-03-12', editorId, 1);
  insertDeliverable.run(uuid(), proj2Id, 'integra', 'Íntegra Completa', 'pending', '2026-04-01', editorId, 20);
  insertDeliverable.run(uuid(), proj2Id, 'raw', 'Brutos Organizados', 'approved', '2026-03-17', videomakerId, 7);

  // Tasks for projects
  const insertTask = db.prepare(`INSERT INTO tasks (id, project_id, phase, title, status, assigned_to, deadline, priority, is_checklist_item, checklist_required, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  // Tasks for proj1 (pre_event)
  insertTask.run(uuid(), proj1Id, 'pre_event', 'PPM com cliente', 'done', producerId, '2026-04-05', 'high', 1, 1, 1);
  insertTask.run(uuid(), proj1Id, 'pre_event', 'Reunião de equipe', 'done', producerId, '2026-04-08', 'high', 0, 0, 2);
  insertTask.run(uuid(), proj1Id, 'pre_event', 'Preparar equipamento completo', 'in_progress', videomakerId, '2026-04-13', 'high', 1, 1, 3);
  insertTask.run(uuid(), proj1Id, 'pre_event', 'Definir shotlist por dia', 'todo', producerId, '2026-04-10', 'medium', 0, 0, 4);
  insertTask.run(uuid(), proj1Id, 'pre_event', 'Organizar logística', 'todo', producerId, '2026-04-12', 'medium', 0, 0, 5);

  // Tasks for proj2 (post_event)
  insertTask.run(uuid(), proj2Id, 'post_event', 'Ingest e backup completo', 'done', videomakerId, '2026-03-13', 'urgent', 1, 1, 1);
  insertTask.run(uuid(), proj2Id, 'post_event', 'Edição brandmovie', 'in_progress', editorId, '2026-03-25', 'high', 0, 0, 2);
  insertTask.run(uuid(), proj2Id, 'post_event', 'Edição depoimentos', 'in_progress', editorId, '2026-03-25', 'high', 0, 0, 3);
  insertTask.run(uuid(), proj2Id, 'post_event', 'Edição íntegra', 'todo', editorId, '2026-04-01', 'medium', 0, 0, 4);
  insertTask.run(uuid(), proj2Id, 'delivery', 'Revisão interna', 'todo', producerId, '2026-03-27', 'high', 0, 0, 5);
  insertTask.run(uuid(), proj2Id, 'delivery', 'Upload e entrega completa', 'todo', editorId, '2026-03-28', 'high', 0, 0, 6);

  // Alerts
  const insertAlert = db.prepare(`INSERT INTO alerts (id, project_id, type, message, severity) VALUES (?, ?, ?, ?, ?)`);
  insertAlert.run(uuid(), proj2Id, 'deadline', 'Prazo de entrega do brandmovie em 6 dias', 'warning');
  insertAlert.run(uuid(), proj2Id, 'deadline', 'Íntegra com prazo apertado - edição não iniciada', 'critical');
  insertAlert.run(uuid(), proj3Id, 'ppm_pending', 'PPM não realizado - evento em menos de 60 dias', 'warning');
}
