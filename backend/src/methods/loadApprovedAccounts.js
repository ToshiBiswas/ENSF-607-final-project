

function loadApprovedAccounts() {
  const p = process.env.ACCOUNTS_PATH || path.join(__dirname, 'data', 'accounts.ts');
  const raw = fs.readFileSync(p, 'utf8');

  // strip TS/ESM bits (best-effort), same idea as the VM seed
  let code = raw
    .replace(/^\s*import[^\n]*\n/gm, '')
    .replace(/^\s*(export\s+)?type\s+[^\n]*\n/gm, '')
    .replace(/\b(export\s+)?interface\s+[A-Za-z0-9_]+\s*\{[\s\S]*?\}\s*/gm, '');

  if (/export\s+default\s+/.test(code)) {
    code = code.replace(/export\s+default\s+/, 'module.exports = ');
  } else if (/export\s+const\s+accounts\s*=/.test(code)) {
    code += '\nmodule.exports = accounts;\n';
  }

  code = code.replace(/as\s+const/g, '').replace(/<[^>]+>(?=\s*\[)/g, '');

  const sandbox = { module: { exports: {} }, exports: {} };
  vm.createContext(sandbox);
  new vm.Script(code, { filename: 'accounts.ts' }).runInContext(sandbox);
  const accounts = sandbox.module.exports || sandbox.exports;
  if (!Array.isArray(accounts)) throw new Error('accounts.ts did not export an array');
  return accounts;
}module.exports = {loadApprovedAccounts}