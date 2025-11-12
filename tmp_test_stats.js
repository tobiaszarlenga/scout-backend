// tmp_test_stats.js
// Quick script to validate the aggregation queries used by the new endpoints.
// Run from project root: node tmp_test_stats.js

const prisma = require('./db/prisma');

async function testPitcher(pitcherId) {
  console.log('\n== Testing pitcher stats for id=', pitcherId);
  try {
    const total = await prisma.lanzamiento.count({ where: { pitcherId } });
    const avgRes = await prisma.lanzamiento.aggregate({ _avg: { velocidad: true }, where: { pitcherId } });
    const avgVel = avgRes._avg?.velocidad ?? null;
    const byZone = await prisma.lanzamiento.groupBy({ by: ['x','y'], where: { pitcherId }, _count: { _all: true } });
    const zoneCounts = new Array(25).fill(0);
    byZone.forEach(r => {
      const x = Number(r.x); const y = Number(r.y);
      if (Number.isInteger(x) && Number.isInteger(y) && x>=0 && x<5 && y>=0 && y<5) {
        zoneCounts[y*5 + x] = r._count._all || 0;
      }
    });
    const byResId = await prisma.lanzamiento.groupBy({ by: ['resultadoId'], where: { pitcherId }, _count: { _all: true } });
    const resultadoIds = byResId.map(r => r.resultadoId).filter(v => v != null);
    const resultados = resultadoIds.length ? await prisma.resultadoLanzamiento.findMany({ where: { id: { in: resultadoIds } } }) : [];
    const resultadosMap = resultados.reduce((acc,r)=> (acc[r.id]=r.nombre, acc), {});
    const byResultado = {};
    byResId.forEach(r => { const key = resultadosMap[r.resultadoId] || String(r.resultadoId); byResultado[key] = r._count._all || 0; });

    console.log({ total, avgVel, zoneCounts, byResultado });
  } catch (err) {
    console.error('pitcher test error', err);
  }
}

async function testEquipo(equipoId) {
  console.log('\n== Testing equipo stats for id=', equipoId);
  try {
    const total = await prisma.lanzamiento.count({ where: { pitcher: { equipoId } } });
    const avgRes = await prisma.lanzamiento.aggregate({ _avg: { velocidad: true }, where: { pitcher: { equipoId } } });
    const avgVel = avgRes._avg?.velocidad ?? null;
    const byZone = await prisma.lanzamiento.groupBy({ by: ['x','y'], where: { pitcher: { equipoId } }, _count: { _all: true } });
    const zoneCounts = new Array(25).fill(0);
    byZone.forEach(r => {
      const x = Number(r.x); const y = Number(r.y);
      if (Number.isInteger(x) && Number.isInteger(y) && x>=0 && x<5 && y>=0 && y<5) {
        zoneCounts[y*5 + x] = r._count._all || 0;
      }
    });
    const byResId = await prisma.lanzamiento.groupBy({ by: ['resultadoId'], where: { pitcher: { equipoId } }, _count: { _all: true } });
    const resultadoIds = byResId.map(r => r.resultadoId).filter(v => v != null);
    const resultados = resultadoIds.length ? await prisma.resultadoLanzamiento.findMany({ where: { id: { in: resultadoIds } } }) : [];
    const resultadosMap = resultados.reduce((acc,r)=> (acc[r.id]=r.nombre, acc), {});
    const byResultado = {};
    byResId.forEach(r => { const key = resultadosMap[r.resultadoId] || String(r.resultadoId); byResultado[key] = r._count._all || 0; });

    const perPitcher = await prisma.lanzamiento.groupBy({ by: ['pitcherId'], where: { pitcher: { equipoId } }, _count: { _all: true }, _avg: { velocidad: true } });
    const pitcherIds = perPitcher.map(p => p.pitcherId).filter(v => v != null);
    const pitchers = pitcherIds.length ? await prisma.pitcher.findMany({ where: { id: { in: pitcherIds } }, select: { id: true, nombre: true, apellido: true } }) : [];
    const pitcherMap = pitchers.reduce((acc,p)=> (acc[p.id]=p, acc), {});
    const pitchersSummary = perPitcher.map(p=>({ id: p.pitcherId, nombre: pitcherMap[p.pitcherId]?.nombre || null, apellido: pitcherMap[p.pitcherId]?.apellido || null, total: p._count._all || 0, avgVel: p._avg?.velocidad ?? null }));

    console.log({ total, avgVel, zoneCounts, byResultado, pitchers: pitchersSummary });
  } catch (err) {
    console.error('equipo test error', err);
  }
}

async function main() {
  try {
    // pick some existing pitcher and equipo ids if present
    const somePitcher = await prisma.pitcher.findFirst({ select: { id: true } });
    const someEquipo = await prisma.equipo.findFirst({ select: { id: true } });
    if (!somePitcher) {
      console.log('No pitcher found in DB — nothing to test for pitcher');
    } else {
      await testPitcher(somePitcher.id);
    }
    if (!someEquipo) {
      console.log('No equipo found in DB — nothing to test for equipo');
    } else {
      await testEquipo(someEquipo.id);
    }
  } catch (err) {
    console.error('main error', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
