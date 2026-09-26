const clients = new Set(['opencode', 'gentle-shell', 'claude', 'codex'])
const scalarList = (value) => Array.isArray(value) && value.every((item) => typeof item === 'string' && item.length > 0)
export const validatePlan = (plan) => {
  const errors = []
  if (!plan || typeof plan !== 'object' || Array.isArray(plan)) errors.push('plan debe ser un objeto')
  if (plan?.schemaVersion !== undefined && plan.schemaVersion !== 1) errors.push('schemaVersion debe ser 1')
  if (!scalarList(plan?.clients || [])) errors.push('clients debe ser una lista de strings')
  for (const client of plan?.clients || []) if (!clients.has(client)) errors.push(`cliente inválido: ${client}`)
  if (!scalarList(plan?.components || [])) errors.push('components debe ser una lista de strings')
  if (!scalarList(plan?.providers || [])) errors.push('providers debe ser una lista de strings')
  if (plan?.home !== undefined && (typeof plan.home !== 'string' || !plan.home.startsWith('/'))) errors.push('home debe ser una ruta absoluta')
  return errors
}
export const assertValidPlan = (plan) => { const errors = validatePlan(plan); if (errors.length) throw new Error(`install-plan inválido: ${errors.join('; ')}`); return plan }
