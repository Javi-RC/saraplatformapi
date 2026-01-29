# 🎯 REFERENCIA RÁPIDA: Cambios de Probabilidad

## En 30 Segundos

### ❌ ANTES
```javascript
// CBR
probability = weightSum / totalWeight

// Combinación
probability = (prob_DT × w_DT) + (prob_CBR × w_CBR)
```

### ✅ AHORA
```javascript
// CBR
probability = avg(similarityScores)

// Combinación
probability = Math.max(prob_DT, prob_CBR)
winnerSource = (prob_CBR > prob_DT) ? 'cbr' : 'expert_rules'
```

---

## Archivos Modificados

| Archivo | Función | Cambio |
|---------|---------|--------|
| `cbr.service.js` | `reuseSolution()` | Cálculo de probability (línea ~330) |
| `riskPrediction.service.js` | `combineRisks()` | Selección máximo (línea ~250) |

---

## Resultados Esperados

```
Proyecto con 25 casos en CaseBase

RISK: skill_gap
├─ DT predice: 0.65
└─ CBR predice: 0.73

ANTES: 0.69 (promedio)
AHORA: 0.73 (máximo, CBR gana)

✅ Response incluye: winnerSource = "cbr"
```

---

## Quick Test

```bash
cd tfg-backend
node scripts/test-simplified-probability.js
```

Expected output:
```
✅ 4/4 tests passed (100%)
🎉 All tests passed!
```

---

## Validación Manual

Para verificar que funciona en tu proyecto:

1. Crear proyecto nuevo
2. Esperar predicciones
3. Buscar en response: `"winnerSource": "cbr"` o `"winnerSource": "expert_rules"`
4. Si ves ese campo → ✅ Funciona correctamente

---

## Rollback (si es necesario)

Si necesitas volver atrás:

1. En `cbr.service.js`, revertir `reuseSolution()` a usar `weightSum`
2. En `riskPrediction.service.js`, revertir `combineRisks()` a usar suma ponderada

---

## Debug: Ver Cálculo Interno

```javascript
// Añade esto en tu código
console.log({
  risk: risk.type,
  dtProb: risk.treeData?.probability,
  cbrProb: risk.cbrData?.probability,
  finalProb: risk.probability,
  winner: risk.winnerSource
});

// Output esperado:
// {
//   risk: 'skill_gap',
//   dtProb: 0.65,
//   cbrProb: 0.73,
//   finalProb: 0.73,
//   winner: 'cbr'
// }
```

---

## Impacto en API Response

**Campo NUEVO en cada riesgo**:
```json
"winnerSource": "cbr"  // o "expert_rules"
```

Esto es lo único nuevo que verá el frontend.

---

## FAQ Rápido

**P: ¿Cambió la BD?**
A: No.

**P: ¿Se rompen queries?**
A: No.

**P: ¿Necesito redeploy?**
A: Sí, con el código nuevo.

**P: ¿Es reversible?**
A: Sí, revert en git.

**P: ¿Está validado?**
A: Sí, 4/4 tests passing.

---

## Documentación Completa

- 📄 **QUICK_SUMMARY.md** ← Esto
- 📄 **SIMPLIFIED_PROBABILITY.md** - Explicación detallada
- 📄 **VISUAL_COMPARISON.md** - Gráficos antes/después
- 📄 **CHANGES_SUMMARY.md** - Resumen técnico

---

**Estado**: ✅ Listo
**Validación**: ✅ Pasada
**Rollback**: ✅ Posible
**Docs**: ✅ Completas
