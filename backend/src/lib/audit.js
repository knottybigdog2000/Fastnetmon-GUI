const db = require('../db');

const MAX_ROWS = 20000;

function audit(req, action, details, success = true) {
  try {
    db.prepare(
      'INSERT INTO audit_log (username, action, details, success, ip) VALUES (?, ?, ?, ?, ?)'
    ).run(
      req.user?.username || null,
      action,
      details ? String(details).slice(0, 500) : null,
      success ? 1 : 0,
      req.ip || null
    );
    db.prepare(
      'DELETE FROM audit_log WHERE id <= (SELECT MAX(id) FROM audit_log) - ?'
    ).run(MAX_ROWS);
  } catch (e) {
    // Auditing must never break the request it describes
    console.error('Audit log write failed:', e.message);
  }
}

module.exports = audit;
