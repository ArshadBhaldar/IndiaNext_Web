/**
 * AI Service Mock
 * Simulates analyzing an image of agricultural produce and returning a quality grade.
 */

async function inspectProduce(imageBase64, productType = "mango") {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate an AI grading process
      const scores = {
        mango: { score: 92, grade: "A", notes: "Excellent color and firmness." },
        apple: { score: 85, grade: "A-", notes: "Slight bruising detected but overall high quality." },
        generic: { score: 88, grade: "B+", notes: "Standard harvest quality. Safe for retail." }
      };

      const result = scores[productType.toLowerCase()] || scores["generic"];

      resolve({
        qualityScore: result.score,
        grade: result.grade,
        analysisNotes: result.notes,
        inspectedAt: new Date().toISOString()
      });
    }, 3000); // 3-second simulation delay
  });
}

module.exports = {
  inspectProduce
};
