import { MathEngine } from "../../math/math_engine.mjs";

function getValue(solveNode) {
  if (solveNode?.type === 'signed')
    return -solveNode?.left.value?.value();
  return solveNode?.value?.value();
}

registerTestSuite("test Math engine solveNextStep", ()=>{
  describe("Test constant expressions", ()=>{
    /*it("Should sum 1+2-4", ()=>{
      const math = new MathEngine('1+2-4');
      const step = math.solveNextStep();
      expect(getValue(step.changes[0]?.originalLeft)).toBe(1);
      expect(getValue(step.changes[0]?.originalRight)).toBe(2);
      expect(getValue(step.changes[1]?.originalLeft)).toBe(3);
      expect(getValue(step.changes[1]?.originalRight)).toBe(4);
      expect(step.tree.left.value?.value()).toBe(-1);
    });
    it("Should sum 1+2-4+(-4-5)", ()=>{
      const math = new MathEngine('1+2-4+(-4-5)');
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(getValue(step.changes[0]?.originalLeft)).toBe(-4);
      expect(getValue(step.changes[0]?.originalRight)).toBe(5);
      const step2 = math.solveNextStep();
      expect(step2.changes.length).toBe(3);
      expect(getValue(step2.changes[0]?.originalLeft)).toBe(1);
      expect(getValue(step2.changes[0]?.originalRight)).toBe(2);
      expect(getValue(step2.changes[1]?.originalLeft)).toBe(3);
      expect(getValue(step2.changes[1]?.originalRight)).toBe(4);
      expect(getValue(step2.changes[2]?.originalLeft)).toBe(-1);
      expect(getValue(step2.changes[2]?.originalRight)).toBe(-9);
      expect(step.tree.left.value?.value()).toBe(-10);
    });
    it("Should factor 1*2/4", ()=>{
      const math = new MathEngine('1*2/4');
      const step = math.solveNextStep();
      expect(getValue(step.changes[0]?.originalLeft)).toBe(1);
      expect(getValue(step.changes[0]?.originalRight)).toBe(2);
      expect(getValue(step.changes[1]?.originalLeft)).toBe(2);
      expect(getValue(step.changes[1]?.originalRight)).toBe(4);
      expect(step.tree.left.value?.value()).toBe(0.5);
    });
    it("Should factor 1*2*4/(-4*5)", ()=>{
      const math = new MathEngine('1*2*4/(-4*5)');
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(getValue(step.changes[0]?.originalLeft)).toBe(-4);
      expect(getValue(step.changes[0]?.originalRight)).toBe(5);
      const step2 = math.solveNextStep();
      expect(step2.changes.length).toBe(3);
      expect(getValue(step2.changes[0]?.originalLeft)).toBe(1);
      expect(getValue(step2.changes[0]?.originalRight)).toBe(2);
      expect(getValue(step2.changes[1]?.originalLeft)).toBe(2);
      expect(getValue(step2.changes[1]?.originalRight)).toBe(4);
      expect(getValue(step2.changes[2]?.originalLeft)).toBe(8);
      expect(getValue(step2.changes[2]?.originalRight)).toBe(-20);
      expect(step.tree.left.value?.value()).toBe(-0.4);
    });

    it("Should exponent 2^4", ()=>{
      const math = new MathEngine('2^4');
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(getValue(step.changes[0]?.originalLeft)).toBe(2);
      expect(getValue(step.changes[0]?.originalRight)).toBe(4);
      expect(step.tree.left.value?.value()).toBe(16);
    });*/

    it("Should factor 16^4^(-4+3)", ()=>{
      const math = new MathEngine('16^4^(-4+3)');
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(getValue(step.changes[0]?.originalLeft)).toBe(-4);
      expect(getValue(step.changes[0]?.originalRight)).toBe(3);
      const step2 = math.solveNextStep();
      expect(step2.changes.length).toBe(1);
      expect(getValue(step2.changes[0]?.originalLeft)).toBe(4);
      expect(getValue(step2.changes[0]?.originalRight)).toBe(-1);
      const step3 = math.solveNextStep();
      expect(step3.changes.length).toBe(1);
      expect(getValue(step3.changes[0]?.originalLeft)).toBe(16);
      expect(getValue(step3.changes[0]?.originalRight)).toBe(0.25);
      expect(step.tree.left.value?.value()).toBe(2);
    });
  });
});
