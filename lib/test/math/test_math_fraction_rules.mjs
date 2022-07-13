
import { MathEngine } from "../../math/math_engine.mjs";

registerTestSuite("test Math engine solveNextStep Fractions", ()=>{
  describe("Test Fraction Constants", ()=>{
    it("Should multiply frac 1/2 * frac 1/4", ()=>{
      const math = new MathEngine('frac1/2 * frac1/4');

      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(step.changes[0].inputNodes?.length).toBe(2);
      expect(step.changes[0]?.inputNodes[0]?.toString()).toBe('frac 1/2');
      expect(step.changes[0]?.inputNodes[1]?.toString()).toBe('frac 1/4');

      expect(step.tree.left.value?.value().toString()).toBe('frac 1/8');
    });

    it("Should multiply 1/2 * (1/4 * 1/6)", ()=>{
      const math = new MathEngine('frac1/2 * (frac1/4 * frac1/8)');

      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(step.changes[0]?.inputNodes.length).toBe(2)
      expect(step.changes[0]?.inputNodes[0]?.toString()).toBe('frac 1/4');
      expect(step.changes[0]?.inputNodes[1]?.toString()).toBe('frac 1/8');

      const step2 = math.solveNextStep();
      expect(step2.changes.length).toBe(1);
      expect(step2.changes[0]?.inputNodes[0]?.toString()).toBe('frac 1/2');
      expect(step2.changes[0]?.inputNodes[1]?.toString()).toBe('frac 1/32');

      expect(step.tree.left.value?.value().toString()).toBe('frac 1/64');
    });

    it("Should divide 1/2 / 1/4", ()=>{
      const math = new MathEngine('frac1/2 / frac1/4');

      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(step.changes[0]?.inputNodes?.length).toBe(1);
      expect(step.changes[0]?.inputNodes[0]?.toString()).toBe('frac 1/4');
      expect(step.changes[0]?.resultNode.toString()).toBe('frac 4/1');
      expect(step.changes[0]?.operator).toBe('div');

      const step2 = math.solveNextStep();
      expect(step2.changes.length).toBe(1);
      expect(step2.changes[0]?.inputNodes?.length).toBe(2);
      expect(step2.changes[0]?.inputNodes[0]?.toString()).toBe('frac 1/2');
      expect(step2.changes[0]?.inputNodes[1]?.toString()).toBe('frac 4/1');
      expect(step2.changes[0]?.operator).toBe('mul');

      const step3 = math.solveNextStep();
      expect(step3.changes.length).toBe(1);
      expect(step3.changes[0]?.inputNodes[0]?.toString()).toBe('frac 4/2');

      expect(step.tree.left.value?.value().toString()).toBe('frac 2/1');
    });

    it("Should divide 1/2 / (1/4 / 1/6)", ()=>{
      const math = new MathEngine('frac1/2 / (frac1/4 / frac1/6)');

      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(step.changes[0]?.inputNodes?.length).toBe(1)
      expect(step.changes[0]?.inputNodes[0]?.toString()).toBe('frac 1/6');
      expect(step.changes[0]?.resultNode.toString()).toBe('frac 6/1');
      expect(step.changes[0]?.operator).toBe('div');

      const step2 = math.solveNextStep();
      expect(step2.changes.length).toBe(1);
      expect(step2.changes[0]?.inputNodes[0]?.toString()).toBe('frac 1/4');
      expect(step2.changes[0]?.inputNodes[1]?.toString()).toBe('frac 6/1');
      expect(step2.changes[0]?.operator).toBe('mul');

      const step3 = math.solveNextStep();
      expect(step3.changes.length).toBe(1);
      expect(step3.changes[0]?.changeRule.name).toBe('SimplifyFractions');
      expect(step3.changes[0]?.inputNodes[0].toString()).toBe('frac 6/4');
      expect(step3.changes[0]?.resultNode.toString()).toBe('frac 3/2');

      const step4 = math.solveNextStep();
      expect(step4.changes[0]?.inputNodes[0]?.toString()).toBe('frac 3/2');
      expect(step4.changes[0]?.resultNode?.toString()).toBe('frac 2/3');
      expect(step4.changes[0]?.operator).toBe('div');

      const step5 = math.solveNextStep();
      expect(step5.changes[0]?.inputNodes[0]?.toString()).toBe('frac 1/2');
      expect(step5.changes[0]?.inputNodes[1]?.toString()).toBe('frac 2/3');
      expect(step5.changes[0]?.operator).toBe('mul');

      const step6 = math.solveNextStep();
      expect(step6.changes[0]?.inputNodes[0]?.toString()).toBe('frac 2/6');
      expect(step6.changes[0]?.resultNode?.toString()).toBe('frac 1/3');

      expect(step.tree.left.value?.value().toString()).toBe('frac 1/3');
    });

    it("Should sum 1/2 + 1/4", ()=>{
      const math = new MathEngine('frac1/2 + frac1/4');

      const step = math.solveNextStep();
      expect(step.changes.length).toBe(2);
      expect(step.changes[0]?.inputNodes[0]?.toString()).toBe('frac 1/2');
      expect(step.changes[0]?.resultNode?.toString()).toBe('frac 2/4');
      expect(step.changes[0]?.operator).toBe('expand');
      expect(step.changes[1]?.inputNodes[0]?.toString()).toBe('frac 2/4');
      expect(step.changes[1]?.inputNodes[1]?.toString()).toBe('frac 1/4');
      expect(step.changes[1]?.resultNode?.toString()).toBe('frac 3/4');
      expect(step.changes[1]?.operator).toBe('add');

      expect(step.tree.left.value?.value().toString()).toBe('frac 3/4');
    });

    it("Should sum 1/2 + 1/4 - 1/6 + (1/5 + 3/2)", ()=>{
      const math = new MathEngine('frac1/2 + frac1/4 - frac 1/6 + (frac1/5 + frac3/2)');

      const step = math.solveNextStep();
      expect(step.changes.length).toBe(2);
      expect(step.changes[0]?.inputNodes?.length).toBe(2);
      expect(step.changes[0]?.inputNodes[0]?.toString()).toBe('frac 1/5');
      expect(step.changes[0]?.inputNodes[1]?.toString()).toBe('frac 3/2');
      expect(step.changes[0]?.operator).toBe('expand');

      expect(step.changes[1]?.inputNodes[0]?.toString()).toBe('frac 2/10');
      expect(step.changes[1]?.inputNodes[1]?.toString()).toBe('frac 15/10');
      expect(step.changes[1]?.resultNode?.toString()).toBe('frac 17/10');
      expect(step.changes[1]?.operator).toBe('add');

      const step2 = math.solveNextStep();
      expect(step2.changes.length).toBe(2);
      expect(step2.changes[0]?.inputNodes?.length).toBe(4);
      expect(step2.changes[0]?.inputNodes[0]?.toString()).toBe('frac 1/2');
      expect(step2.changes[0]?.inputNodes[1]?.toString()).toBe('frac 1/4');
      expect(step2.changes[0]?.inputNodes[2]?.toString()).toBe('frac 1/6');
      expect(step2.changes[0]?.inputNodes[3]?.toString()).toBe('frac 17/10');
      expect(step2.changes[0]?.operator).toBe('expand');

      expect(step2.changes[1]?.inputNodes[0]?.toString()).toBe('frac 30/60');
      expect(step2.changes[1]?.inputNodes[1]?.toString()).toBe('frac 15/60');
      expect(step2.changes[1]?.resultNode?.toString()).toBe('frac 45/60');
      expect(step2.changes[1]?.operator).toBe('add');

      const step3 = math.solveNextStep();
      expect(step3.changes.length).toBe(2);
      expect(step3.changes[0]?.inputNodes?.length).toBe(2);
      expect(step3.changes[0]?.inputNodes[0]?.toString()).toBe('frac 45/60');
      expect(step3.changes[0]?.inputNodes[1]?.toString()).toBe('frac 10/60');
      expect(step3.changes[0]?.operator).toBe('sub');
      expect(step3.changes[0]?.resultNode?.toString()).toBe('frac 35/60');

      expect(step3.changes[1].inputNodes?.length).toBe(2);
      expect(step3.changes[1]?.inputNodes[0]?.toString()).toBe('frac 35/60');
      expect(step3.changes[1]?.inputNodes[1]?.toString()).toBe('frac 102/60');
      expect(step3.changes[1]?.operator).toBe('add');

      expect(step3.changes[1]?.resultNode?.toString()).toBe('frac 137/60');

      // should not reduce further
      const step4 = math.solveNextStep();
      expect(step4.changes.length).toBe(0);

      expect(step.tree.left.value?.value().toString()).toBe('frac 137/60');
    });
  });
});
