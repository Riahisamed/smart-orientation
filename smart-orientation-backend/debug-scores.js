const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  try {
    // 1. Count FiliereScore
    const scoreCount = await p.filiereScore.count();
    console.log("======== DB DEBUG ========");
    console.log("FiliereScore COUNT:", scoreCount);

    // 2. Sample scores
    const sampleScores = await p.filiereScore.findMany({ take: 5 });
    console.log("SAMPLE SCORES:", JSON.stringify(sampleScores, null, 2));

    // 3. First filiere with scores included
    const filiere = await p.filiere.findFirst({ include: { scores: true, bacTypes: true } });
    console.log("\nFIRST FILIERE (with scores + bacTypes):", JSON.stringify(filiere, null, 2));

    // 4. Count filieres with non-empty scores
    const allFilieres = await p.filiere.findMany({ include: { scores: true } });
    const withScores = allFilieres.filter(f => f.scores && f.scores.length > 0);
    console.log("\nTOTAL FILIERES:", allFilieres.length);
    console.log("FILIERES WITH SCORES:", withScores.length);
    console.log("FILIERES WITHOUT SCORES:", allFilieres.length - withScores.length);

    // 5. Check a student
    const student = await p.student.findFirst();
    if (student) {
      console.log("\nFIRST STUDENT bacType:", student.bacType);
      
      // Count scores matching this bacType
      const matchingScores = await p.filiereScore.count({ where: { bacType: student.bacType } });
      console.log("SCORES MATCHING bacType '" + student.bacType + "':", matchingScores);
    } else {
      console.log("\n⚠️ NO STUDENTS IN DB!");
    }

    console.log("==========================");
  } catch (err) {
    console.error("ERROR:", err.message);
  } finally {
    await p.$disconnect();
  }
})();
